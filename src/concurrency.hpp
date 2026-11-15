#pragma once
// Module: Concurrency Control & Deadlock Prevention (Mohd Faiz - OS & Recovery Developer)
// OS Concept 1: Mutex locking per account to prevent simultaneous update race conditions.
// OS Concept 2: Deadlock Prevention via Global Lock Ordering (lexicographical sorting of account IDs)
//               to break Coffman's Circular Wait condition.

#include <algorithm>
#include <map>
#include <memory>
#include <mutex>
#include <string>
#include <vector>

namespace banking {

// RAII container: automatically unlocks all held resource mutexes upon leaving scope
using LockSet = std::vector<std::unique_lock<std::mutex>>;

class AccountLocks {
public:
    static AccountLocks& instance() {
        static AccountLocks inst;
        return inst;
    }

    // Acquires lock for a single account
    std::unique_lock<std::mutex> lock_single(const std::string& account_number) {
        return std::unique_lock<std::mutex>(mutex_for(account_number));
    }

    // Acquires locks for a pair of accounts in strictly sorted order (Deadlock Prevention)
    LockSet lock_pair(const std::string& acc_a, const std::string& acc_b) {
        std::vector<std::string> names = {acc_a, acc_b};
        std::sort(names.begin(), names.end());
        names.erase(std::unique(names.begin(), names.end()), names.end());

        LockSet held;
        held.reserve(names.size());
        for (const auto& name : names) {
            held.emplace_back(mutex_for(name));
        }
        return held;
    }

    // Acquires locks for any number of accounts in strictly sorted order
    LockSet lock_all(std::vector<std::string> names) {
        std::sort(names.begin(), names.end());
        names.erase(std::unique(names.begin(), names.end()), names.end());

        LockSet held;
        held.reserve(names.size());
        for (const auto& name : names) {
            held.emplace_back(mutex_for(name));
        }
        return held;
    }

private:
    AccountLocks() = default;

    std::mutex& mutex_for(const std::string& name) {
        std::lock_guard<std::mutex> lock(table_mutex_);
        auto& ptr = mutexes_[name];
        if (!ptr) {
            ptr = std::make_unique<std::mutex>();
        }
        return *ptr;
    }

    std::mutex table_mutex_;
    std::map<std::string, std::unique_ptr<std::mutex>> mutexes_;
};

} // namespace banking
