#pragma once
// Module: Banking Operations (Priyanka Bartwal - Banking Operations Developer)
// Implements core financial operations: create account, balance lookup, deposit, withdrawal, and transfer.

#include <string>
#include <vector>

#include "db.hpp"

namespace banking {

struct AccountInfo {
    int id{0};
    std::string account_number;
    std::string holder_name;
    std::string email;
    double balance{0.0};
    std::string status;
    std::string created_at;
};

struct TransactionRecord {
    int id{0};
    std::string txn_ref;
    std::string from_account;
    std::string to_account;
    std::string type;
    double amount{0.0};
    std::string status;
    std::string created_at;
};

// Generates a unique transaction reference (e.g. TXN-20261115-XXXX)
std::string generate_txn_ref();

// Validates amount format and positive value
void validate_amount(double amount);

// Creates a new bank account with an initial deposit
AccountInfo create_account(Db& db, const std::string& holder_name, double initial_deposit, const std::string& email = "");

// Retrieves account information by account_number
AccountInfo get_account(Db& db, const std::string& account_number);

// Returns account balance
double get_balance(Db& db, const std::string& account_number);

// Deposits money into an account
TransactionRecord deposit(Db& db, const std::string& account_number, double amount);

// Withdraws money from an account (validates sufficient balance)
TransactionRecord withdraw(Db& db, const std::string& account_number, double amount);

// Transfers money atomically between two accounts with concurrency & transaction protection
TransactionRecord transfer(Db& db, const std::string& from_account, const std::string& to_account, double amount);

// Lists recent transactions
std::vector<TransactionRecord> get_transaction_history(Db& db, int limit = 50);

} // namespace banking

