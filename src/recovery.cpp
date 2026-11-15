// Module: Write-Ahead Logging & Crash Recovery Implementation (Mohd Faiz - OS & Recovery Developer)
#include "recovery.hpp"

#include <algorithm>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <unordered_map>
#include <unordered_set>

namespace banking {

WalLogger::WalLogger() {
    wal_file_.open("wal.log", std::ios::app);
}

WalLogger& WalLogger::instance() {
    static WalLogger logger;
    return logger;
}

long long WalLogger::log(Db& db, const std::string& txn_ref, const std::string& action,
                         int account_id, double old_bal, double new_bal) {
    std::lock_guard<std::mutex> lock(mutex_);
    long long lsn = ++current_lsn_;

    // 1. Write to persistent local WAL disk file
    if (wal_file_.is_open()) {
        wal_file_ << "LSN=" << lsn
                  << " TXN=" << txn_ref
                  << " ACTION=" << action
                  << " ACC=" << account_id
                  << " OLD=" << std::fixed << std::setprecision(2) << old_bal
                  << " NEW=" << std::fixed << std::setprecision(2) << new_bal
                  << std::endl;
        wal_file_.flush();
    }

    // 2. Write to PostgreSQL wal_logs table for durability
    try {
        std::ostringstream o_str, n_str;
        o_str << std::fixed << std::setprecision(2) << old_bal;
        n_str << std::fixed << std::setprecision(2) << new_bal;

        std::string acc_param = account_id > 0 ? std::to_string(account_id) : "";
        db.query(
            "INSERT INTO wal_logs (lsn, txn_ref, action, account_id, old_balance, new_balance) "
            "VALUES ($1, $2, $3, NULLIF($4, '')::int, $5, $6)",
            {std::to_string(lsn), txn_ref, action, acc_param, o_str.str(), n_str.str()});
    } catch (const std::exception& e) {
        std::cerr << "WAL DB warning: " << e.what() << "\n";
    }

    return lsn;
}

void WalLogger::flush() {
    std::lock_guard<std::mutex> lock(mutex_);
    if (wal_file_.is_open()) {
        wal_file_.flush();
    }
}

RecoveryStats run_crash_recovery(Db& db) {
    RecoveryStats stats;

    // Fetch all WAL logs in chronological order
    Rows logs = db.query(
        "SELECT lsn, txn_ref, action, account_id, old_balance, new_balance, logged_at "
        "FROM wal_logs ORDER BY lsn ASC");

    stats.total_records_analyzed = static_cast<int>(logs.size());

    // Phase 1: Analysis Phase
    // Determine the status of every transaction (Committed vs Uncommitted/Losers)
    std::unordered_set<std::string> committed_txns;
    std::unordered_set<std::string> aborted_txns;
    std::unordered_set<std::string> all_txns;
    std::unordered_map<std::string, std::vector<Row>> txn_operations;

    for (const auto& log : logs) {
        std::string ref = log.at("txn_ref");
        std::string action = log.at("action");
        all_txns.insert(ref);
        txn_operations[ref].push_back(log);

        if (action == "COMMIT") {
            committed_txns.insert(ref);
        } else if (action == "ABORT") {
            aborted_txns.insert(ref);
        }
    }

    stats.committed_txns = static_cast<int>(committed_txns.size());

    // Phase 2: Undo Phase (Rollback Losers)
    // Any transaction that started or debited/credited but NEVER reached COMMIT or ABORT
    // was active when the system crashed! We must UNDO its operations.
    for (const auto& ref : all_txns) {
        if (committed_txns.count(ref) == 0 && aborted_txns.count(ref) == 0) {
            // Uncommitted transaction caught in crash!
            stats.uncommitted_txns_undone++;
            stats.rolled_back_refs.push_back(ref);

            const auto& ops = txn_operations[ref];
            // Iterate backwards through operations for proper undo
            for (auto it = ops.rbegin(); it != ops.rend(); ++it) {
                const auto& op = *it;
                std::string action = op.at("action");
                if (action == "DEBIT" || action == "CREDIT") {
                    std::string acc_id = op.at("account_id");
                    std::string old_bal = op.at("old_balance");
                    if (!acc_id.empty() && !old_bal.empty()) {
                        // Revert account balance to old_balance
                        db.query("UPDATE accounts SET balance = $1 WHERE id = $2", {old_bal, acc_id});
                    }
                }
            }

            // Mark transaction as rolled_back in transactions table
            db.query("UPDATE transactions SET status = 'rolled_back' WHERE txn_ref = $1", {ref});

            // Append ABORT record in WAL to signify recovery completed for this transaction
            WalLogger::instance().log(db, ref, "ABORT", 0, 0.0, 0.0);
            audit(db, "recovery-daemon", "crash-undo", "Rolled back incomplete transaction " + ref);
        }
    }

    return stats;
}

} // namespace banking
