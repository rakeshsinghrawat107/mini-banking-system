#pragma once
// Module: Write-Ahead Logging & Crash Recovery (Mohd Faiz - OS & Recovery Developer)
// Implements ARIES recovery protocol principles:
// 1. Write-Ahead Logging (WAL): Record changes with old and new values before database mutation.
// 2. Atomicity: Incomplete transactions interrupted by system crash are rolled back during recovery.

#include <chrono>
#include <fstream>
#include <mutex>
#include <string>
#include <vector>

#include "db.hpp"

namespace banking {

struct WalRecord {
    long long lsn{0};
    std::string txn_ref;
    std::string action; // START, DEBIT, CREDIT, COMMIT, ABORT
    int account_id{0};
    double old_balance{0.0};
    double new_balance{0.0};
    std::string timestamp;
};

class WalLogger {
public:
    static WalLogger& instance();

    // Appends a log entry to both memory/disk WAL file and the database wal_logs table
    long long log(Db& db, const std::string& txn_ref, const std::string& action,
                  int account_id = 0, double old_bal = 0.0, double new_bal = 0.0);

    // Forces flush of log to disk
    void flush();

private:
    WalLogger();
    std::mutex mutex_;
    long long current_lsn_{1000};
    std::ofstream wal_file_;
};

// Analyzes the WAL, finds active/uncommitted transactions, and undoes them to restore consistency
struct RecoveryStats {
    int total_records_analyzed{0};
    int committed_txns{0};
    int uncommitted_txns_undone{0};
    std::vector<std::string> rolled_back_refs;
};

RecoveryStats run_crash_recovery(Db& db);

} // namespace banking

