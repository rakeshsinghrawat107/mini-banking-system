// Module: Banking Operations Implementation (Priyanka Bartwal - Banking Operations Developer)
#include "banking.hpp"

#include <chrono>
#include <cstdio>
#include <iomanip>
#include <random>
#include <sstream>

#include "concurrency.hpp"
#include "recovery.hpp"

namespace banking {

std::string generate_txn_ref() {
    auto now = std::chrono::system_clock::now();
    auto ms = std::chrono::duration_cast<std::chrono::milliseconds>(now.time_since_epoch()).count();
    static std::mt19937_64 rng(std::random_device{}());
    std::uniform_int_distribution<int> dist(1000, 9999);

    std::ostringstream oss;
    oss << "TXN-" << ms << "-" << dist(rng);
    return oss.str();
}

void validate_amount(double amount) {
    if (amount <= 0.0) {
        throw HttpError(400, "Transaction amount must be strictly positive (> 0.00)");
    }
}

static HttpError explain_db_error(const DbError& e) {
    if (e.sqlstate == "23505") return HttpError(409, "Account or reference already exists");
    if (e.sqlstate == "23514") return HttpError(400, "Transaction violates account balance constraint (no negative balance)");
    if (e.sqlstate == "23503") return HttpError(404, "Referenced account does not exist");
    return HttpError(500, std::string("Database error: ") + e.what());
}

AccountInfo create_account(Db& db, const std::string& holder_name, double initial_deposit, const std::string& email) {
    if (holder_name.empty()) {
        throw HttpError(400, "Account holder name cannot be empty");
    }
    if (initial_deposit < 0.0) {
        throw HttpError(400, "Initial deposit cannot be negative");
    }

    // Generate account number: ACC + 4 random digits
    static std::mt19937 rng(std::random_device{}());
    std::uniform_int_distribution<int> dist(1000, 9999);
    std::string acc_no;

    try {
        Transaction tx(db);
        // Ensure unique account number
        for (int attempts = 0; attempts < 10; ++attempts) {
            acc_no = "ACC" + std::to_string(dist(rng));
            Rows existing = db.query("SELECT 1 FROM accounts WHERE account_number = $1", {acc_no});
            if (existing.empty()) break;
        }

        std::ostringstream bal_stream;
        bal_stream << std::fixed << std::setprecision(2) << initial_deposit;

        Rows rows = db.query(
            "INSERT INTO accounts (account_number, holder_name, email, balance, status) "
            "VALUES ($1, $2, NULLIF($3, ''), $4, 'active') RETURNING id, created_at",
            {acc_no, holder_name, email, bal_stream.str()});

        if (rows.empty()) {
            throw HttpError(500, "Failed to create account record");
        }

        int acc_id = std::stoi(rows[0]["id"]);

        // If initial deposit > 0, record initial transaction
        if (initial_deposit > 0.0) {
            std::string txn_ref = generate_txn_ref();
            db.query(
                "INSERT INTO transactions (txn_ref, from_account_id, to_account_id, type, amount, status) "
                "VALUES ($1, NULL, $2, 'deposit', $3, 'committed')",
                {txn_ref, std::to_string(acc_id), bal_stream.str()});
            WalLogger::instance().log(db, txn_ref, "START", acc_id, 0.0, initial_deposit);
            WalLogger::instance().log(db, txn_ref, "CREDIT", acc_id, 0.0, initial_deposit);
            WalLogger::instance().log(db, txn_ref, "COMMIT", acc_id, 0.0, initial_deposit);
        }

        tx.commit();
        audit(db, "teller", "create-account", "Account " + acc_no + " created for " + holder_name);

        AccountInfo info;
        info.id = acc_id;
        info.account_number = acc_no;
        info.holder_name = holder_name;
        info.email = email;
        info.balance = initial_deposit;
        info.status = "active";
        info.created_at = rows[0]["created_at"];
        return info;
    } catch (const DbError& e) {
        throw explain_db_error(e);
    }
}

AccountInfo get_account(Db& db, const std::string& account_number) {
    Rows rows = db.query(
        "SELECT id, account_number, holder_name, COALESCE(email, '') AS email, "
        "balance, status, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at "
        "FROM accounts WHERE account_number = $1", {account_number});
    if (rows.empty()) {
        throw HttpError(404, "Account not found: " + account_number);
    }

    AccountInfo info;
    info.id = std::stoi(rows[0]["id"]);
    info.account_number = rows[0]["account_number"];
    info.holder_name = rows[0]["holder_name"];
    info.email = rows[0]["email"];
    info.balance = std::stod(rows[0]["balance"]);
    info.status = rows[0]["status"];
    info.created_at = rows[0]["created_at"];
    return info;
}

double get_balance(Db& db, const std::string& account_number) {
    return get_account(db, account_number).balance;
}

TransactionRecord deposit(Db& db, const std::string& account_number, double amount) {
    validate_amount(amount);

    // OS Concurrency Control: Lock account mutex to ensure serialized balance updates
    auto lock = AccountLocks::instance().lock_single(account_number);

    AccountInfo acc = get_account(db, account_number);
    if (acc.status != "active") {
        throw HttpError(400, "Cannot deposit to inactive or frozen account");
    }

    double new_balance = acc.balance + amount;
    std::string txn_ref = generate_txn_ref();

    try {
        Transaction tx(db);

        // WAL: Write START and CREDIT logs before modifying database
        WalLogger::instance().log(db, txn_ref, "START", acc.id, acc.balance, new_balance);
        WalLogger::instance().log(db, txn_ref, "CREDIT", acc.id, acc.balance, new_balance);

        std::ostringstream amt_str, bal_str;
        amt_str << std::fixed << std::setprecision(2) << amount;
        bal_str << std::fixed << std::setprecision(2) << new_balance;

        // Mutate account balance
        db.query("UPDATE accounts SET balance = $1 WHERE id = $2", {bal_str.str(), std::to_string(acc.id)});

        // Insert into transaction ledger
        Rows row = db.query(
            "INSERT INTO transactions (txn_ref, from_account_id, to_account_id, type, amount, status) "
            "VALUES ($1, NULL, $2, 'deposit', $3, 'committed') RETURNING id, created_at",
            {txn_ref, std::to_string(acc.id), amt_str.str()});

        // WAL: Write COMMIT record
        WalLogger::instance().log(db, txn_ref, "COMMIT", acc.id, acc.balance, new_balance);

        tx.commit();
        audit(db, "teller", "deposit", "Deposited " + amt_str.str() + " to " + account_number);

        TransactionRecord rec;
        rec.id = std::stoi(row[0]["id"]);
        rec.txn_ref = txn_ref;
        rec.to_account = account_number;
        rec.type = "deposit";
        rec.amount = amount;
        rec.status = "committed";
        rec.created_at = row[0]["created_at"];
        return rec;
    } catch (const DbError& e) {
        WalLogger::instance().log(db, txn_ref, "ABORT", acc.id, acc.balance, acc.balance);
        throw explain_db_error(e);
    }
}

TransactionRecord withdraw(Db& db, const std::string& account_number, double amount) {
    validate_amount(amount);

    // OS Concurrency Control: Lock account mutex
    auto lock = AccountLocks::instance().lock_single(account_number);

    AccountInfo acc = get_account(db, account_number);
    if (acc.status != "active") {
        throw HttpError(400, "Cannot withdraw from inactive or frozen account");
    }

    if (acc.balance < amount) {
        throw HttpError(400, "Insufficient funds. Available balance: " + std::to_string(acc.balance));
    }

    double new_balance = acc.balance - amount;
    std::string txn_ref = generate_txn_ref();

    try {
        Transaction tx(db);

        // WAL: Write START and DEBIT logs before mutating balance
        WalLogger::instance().log(db, txn_ref, "START", acc.id, acc.balance, new_balance);
        WalLogger::instance().log(db, txn_ref, "DEBIT", acc.id, acc.balance, new_balance);

        std::ostringstream amt_str, bal_str;
        amt_str << std::fixed << std::setprecision(2) << amount;
        bal_str << std::fixed << std::setprecision(2) << new_balance;

        db.query("UPDATE accounts SET balance = $1 WHERE id = $2", {bal_str.str(), std::to_string(acc.id)});

        Rows row = db.query(
            "INSERT INTO transactions (txn_ref, from_account_id, to_account_id, type, amount, status) "
            "VALUES ($1, $2, NULL, 'withdraw', $3, 'committed') RETURNING id, created_at",
            {txn_ref, std::to_string(acc.id), amt_str.str()});

        // WAL: Write COMMIT record
        WalLogger::instance().log(db, txn_ref, "COMMIT", acc.id, acc.balance, new_balance);

        tx.commit();
        audit(db, "teller", "withdraw", "Withdrew " + amt_str.str() + " from " + account_number);

        TransactionRecord rec;
        rec.id = std::stoi(row[0]["id"]);
        rec.txn_ref = txn_ref;
        rec.from_account = account_number;
        rec.type = "withdraw";
        rec.amount = amount;
        rec.status = "committed";
        rec.created_at = row[0]["created_at"];
        return rec;
    } catch (const DbError& e) {
        WalLogger::instance().log(db, txn_ref, "ABORT", acc.id, acc.balance, acc.balance);
        throw explain_db_error(e);
    }
}

TransactionRecord transfer(Db& db, const std::string& from_account, const std::string& to_account, double amount) {
    validate_amount(amount);

    if (from_account == to_account) {
        throw HttpError(400, "Source and destination accounts must be distinct");
    }

    // OS Concurrency Control & Deadlock Prevention:
    // Lock both accounts in strictly sorted order! This prevents circular wait deadlocks
    // when Thread 1 transfers A -> B while Thread 2 transfers B -> A.
    LockSet locks = AccountLocks::instance().lock_pair(from_account, to_account);

    AccountInfo sender = get_account(db, from_account);
    AccountInfo receiver = get_account(db, to_account);

    if (sender.status != "active")   throw HttpError(400, "Sender account is not active");
    if (receiver.status != "active") throw HttpError(400, "Receiver account is not active");

    if (sender.balance < amount) {
        throw HttpError(400, "Transfer failed: Insufficient funds in account " + from_account);
    }

    double sender_new_bal = sender.balance - amount;
    double receiver_new_bal = receiver.balance + amount;
    std::string txn_ref = generate_txn_ref();

    try {
        Transaction tx(db);

        // WAL: Log START
        WalLogger::instance().log(db, txn_ref, "START", sender.id, sender.balance, sender_new_bal);
        // WAL: Log DEBIT for sender
        WalLogger::instance().log(db, txn_ref, "DEBIT", sender.id, sender.balance, sender_new_bal);
        // WAL: Log CREDIT for receiver
        WalLogger::instance().log(db, txn_ref, "CREDIT", receiver.id, receiver.balance, receiver_new_bal);

        std::ostringstream amt_str, s_bal, r_bal;
        amt_str << std::fixed << std::setprecision(2) << amount;
        s_bal << std::fixed << std::setprecision(2) << sender_new_bal;
        r_bal << std::fixed << std::setprecision(2) << receiver_new_bal;

        // Perform balance modifications
        db.query("UPDATE accounts SET balance = $1 WHERE id = $2", {s_bal.str(), std::to_string(sender.id)});
        db.query("UPDATE accounts SET balance = $1 WHERE id = $2", {r_bal.str(), std::to_string(receiver.id)});

        // Insert ledger record
        Rows row = db.query(
            "INSERT INTO transactions (txn_ref, from_account_id, to_account_id, type, amount, status) "
            "VALUES ($1, $2, $3, 'transfer', $4, 'committed') RETURNING id, created_at",
            {txn_ref, std::to_string(sender.id), std::to_string(receiver.id), amt_str.str()});

        // WAL: Log COMMIT
        WalLogger::instance().log(db, txn_ref, "COMMIT", 0, 0.0, 0.0);

        tx.commit();
        audit(db, "teller", "transfer", "Transferred " + amt_str.str() + " from " + from_account + " to " + to_account);

        TransactionRecord rec;
        rec.id = std::stoi(row[0]["id"]);
        rec.txn_ref = txn_ref;
        rec.from_account = from_account;
        rec.to_account = to_account;
        rec.type = "transfer";
        rec.amount = amount;
        rec.status = "committed";
        rec.created_at = row[0]["created_at"];
        return rec;
    } catch (const DbError& e) {
        WalLogger::instance().log(db, txn_ref, "ABORT", sender.id, sender.balance, sender.balance);
        throw explain_db_error(e);
    }
}

std::vector<TransactionRecord> get_transaction_history(Db& db, int limit) {
    Rows rows = db.query(
        "SELECT id, txn_ref, type, amount, status, to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at, "
        "COALESCE(from_account, '') AS from_account, COALESCE(to_account, '') AS to_account "
        "FROM transaction_history LIMIT $1", {std::to_string(limit)});

    std::vector<TransactionRecord> history;
    history.reserve(rows.size());
    for (const auto& r : rows) {
        TransactionRecord rec;
        rec.id = std::stoi(r.at("id"));
        rec.txn_ref = r.at("txn_ref");
        rec.from_account = r.at("from_account");
        rec.to_account = r.at("to_account");
        rec.type = r.at("type");
        rec.amount = std::stod(r.at("amount"));
        rec.status = r.at("status");
        rec.created_at = r.at("created_at");
        history.push_back(std::move(rec));
    }
    return history;
}

} // namespace banking
