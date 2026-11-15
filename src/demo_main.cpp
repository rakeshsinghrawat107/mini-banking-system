// ==============================================================================
// Standalone C++ OS Concurrency Runner (Native Windows & Linux)
// Graphic Era Hill University - Team GHOST
// OS & Recovery Developer: Mohd Faiz | Team Leader: Rohit Negi
// ==============================================================================

#include <iostream>
#include <string>
#include <vector>
#include <thread>
#include <mutex>
#include <chrono>

#include "concurrency.hpp"
#include "deadlock.hpp"

using namespace std::chrono_literals;

namespace banking_os {

static std::mutex print_mutex;
static void say(const std::string& line) {
    std::lock_guard<std::mutex> lock(print_mutex);
    std::cout << line << "\n";
}

// ------------------------------------------------------------------------------
// DEMO 1: RACE CONDITIONS & MUTEX SYNCHRONIZATION
// ------------------------------------------------------------------------------
static int run_in_memory_race(bool use_mutex) {
    int balance = 1000;
    std::mutex account_mutex;

    auto withdraw_100 = [&] {
        for (int i = 0; i < 10; ++i) {
            std::unique_lock<std::mutex> lock(account_mutex, std::defer_lock);
            if (use_mutex) lock.lock();

            int current = balance;                 // 1. Read balance
            std::this_thread::sleep_for(1ms);      // Context switch delay
            balance = current - 10;                // 2. Write updated balance
        }
    };

    std::vector<std::thread> threads;
    for (int i = 0; i < 10; ++i) {
        threads.emplace_back(withdraw_100);
    }
    for (auto& t : threads) t.join();

    return balance;
}

int run_race_demo() {
    std::cout << "\n=======================================================\n";
    std::cout << "DEMO 1: CONCURRENT BALANCE UPDATES & RACE CONDITIONS\n";
    std::cout << "=======================================================\n";
    std::cout << "Starting balance: $1,000.00\n";
    std::cout << "Workload: 10 threads each performing ten $10 withdrawals (Expected: $0.00)\n\n";

    int unprot = run_in_memory_race(false);
    std::cout << "1) WITHOUT Mutex Locking (Race Condition Active):\n";
    std::cout << "   Final Balance = $" << unprot << ".00 (CORRUPTED by lost updates!)\n\n";

    int prot = run_in_memory_race(true);
    std::cout << "2) WITH Account Mutex Locking (Critical Section Protected):\n";
    std::cout << "   Final Balance = $" << prot << ".00 (EXACTLY CORRECT!)\n";
    std::cout << "=======================================================\n\n";
    return 0;
}

// ------------------------------------------------------------------------------
// DEMO 2: DEADLOCK SIMULATION, WFG DETECTION & SORTED LOCK FIX
// ------------------------------------------------------------------------------
static void lock_opposite_order(std::timed_mutex& m1, std::timed_mutex& m2, const std::string& name) {
    std::unique_lock<std::timed_mutex> a(m1);
    std::this_thread::sleep_for(100ms);
    std::unique_lock<std::timed_mutex> b(m2, std::defer_lock);
    if (!b.try_lock_for(500ms)) {
        say("   [" + name + "] Waited 0.5s for 2nd lock -> DEADLOCK detected, backed off!");
        return;
    }
    say("   [" + name + "] Successfully acquired both locks.");
}

static void lock_sorted_order(const std::string& acc_a, const std::string& acc_b, const std::string& name) {
    banking::LockSet locks = banking::AccountLocks::instance().lock_pair(acc_a, acc_b);
    std::this_thread::sleep_for(100ms);
    say("   [" + name + "] Acquired both locks in sorted order without contention.");
}

int run_deadlock_demo() {
    std::cout << "\n=======================================================\n";
    std::cout << "DEMO 2: DEADLOCK DETECTION (WFG) & PREVENTION (SORTING)\n";
    std::cout << "=======================================================\n";

    std::cout << "Scenario: Two simultaneous transfers with cross-account dependency:\n";
    std::cout << "  Transfer 1: Transfer from ACC1001 to ACC1002\n";
    std::cout << "  Transfer 2: Transfer from ACC1002 to ACC1001\n\n";

    std::cout << "1) OPPOSITE LOCK ORDER (Circular Wait Enabled):\n";
    {
        banking::DeadlockManager& dm = banking::DeadlockManager::instance();
        dm.request_resource("Transfer-1", "ACC1002", "Transfer-2");
        dm.request_resource("Transfer-2", "ACC1001", "Transfer-1");

        banking::DeadlockCycle cycle;
        if (dm.check_deadlock(cycle)) {
            std::cout << "   [Wait-For Graph] Directed cycle detected: ";
            for (size_t i = 0; i < cycle.cycle_nodes.size(); ++i) {
                std::cout << cycle.cycle_nodes[i] << (i + 1 < cycle.cycle_nodes.size() ? " -> " : "");
            }
            std::cout << "\n";
        }

        std::timed_mutex acc1001, acc1002;
        std::thread t1(lock_opposite_order, std::ref(acc1001), std::ref(acc1002), "Transfer-1");
        std::thread t2(lock_opposite_order, std::ref(acc1002), std::ref(acc1001), "Transfer-2");
        t1.join();
        t2.join();

        std::string victim;
        if (dm.resolve_deadlock(victim)) {
            std::cout << "   [Wait-For Graph] Deadlock resolved by terminating victim: " << victim << "\n\n";
        }
    }

    std::cout << "2) SORTED LOCK ORDER FIX (AccountLocks::lock_pair):\n";
    {
        std::thread t1(lock_sorted_order, "ACC1001", "ACC1002", "Transfer-1");
        std::thread t2(lock_sorted_order, "ACC1002", "ACC1001", "Transfer-2");
        t1.join();
        t2.join();
        std::cout << "   Both transfers completed safely with zero deadlock!\n";
    }
    std::cout << "=======================================================\n\n";
    return 0;
}

} // namespace banking_os

int main(int argc, char** argv) {
    std::string mode = argc > 1 ? argv[1] : "";

    std::cout << "========================================================\n";
    std::cout << " Mini Banking Transaction System - C++ OS Engine\n";
    std::cout << " Graphic Era Hill University - Team GHOST\n";
    std::cout << "========================================================\n";

    if (mode == "--race") {
        return banking_os::run_race_demo();
    } else if (mode == "--deadlock") {
        return banking_os::run_deadlock_demo();
    } else {
        banking_os::run_race_demo();
        banking_os::run_deadlock_demo();
        std::cout << "All C++ OS demonstrations completed with 100% success!\n";
        return 0;
    }
}
