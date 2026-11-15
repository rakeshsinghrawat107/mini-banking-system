# Mini Banking Transaction System — System Design & Architecture

**Institution:** Graphic Era Hill University  
**Team:** GHOST  
**Members:** Rohit Negi (Lead), Sumit Singh Mahar, Mohd Faiz, Priyanka Bartwal  

---

## 1. High-Level Architecture

The system is built on a 3-tier modular architecture combining Operating System synchronization primitives with Database Management System ACID transactions:

```
+-------------------------------------------------------------------+
|                        Client Layer                               |
|   - HTTP REST API Client (cURL, Postman, Web UI)                  |
|   - Interactive CLI Terminal Menu                                 |
+---------------------------------+---------------------------------+
                                  | HTTP (JSON) / CLI
                                  v
+-------------------------------------------------------------------+
|                     C++17 Application Core                        |
|                                                                   |
|  [routes.cpp]      HTTP Server & Route Dispatcher (ThreadPool: 8) |
|  [banking.cpp]     High-Level Business Operations (Priyanka)      |
|  [concurrency.hpp] Account Mutex Locks & Lock Ordering (Faiz)     |
|  [deadlock.cpp]    Wait-For Graph (WFG) & Cycle Detection (Faiz)  |
|  [recovery.cpp]    Write-Ahead Logging (WAL) & ARIES Engine (Faiz)|
|  [db.cpp]          PostgreSQL / Supabase libpq Wrapper (Sumit)    |
+---------------------------------+---------------------------------+
                                  | SQL Queries ($1, $2 params)
                                  v
+-------------------------------------------------------------------+
|                 PostgreSQL / Supabase Database                    |
|                                                                   |
|   Schema: banking                                                 |
|   - accounts      (Balances, Account Numbers, Status)             |
|   - transactions  (Ledger of Deposits, Withdrawals, Transfers)    |
|   - wal_logs      (LSN, Operation, Undo/Redo Balances)            |
|   - audit_log     (Security & Operations Trail)                   |
|   - Constraints   (CHECK balance >= 0, UNIQUE acc_no)             |
+-------------------------------------------------------------------+
```

---

## 2. Concurrency Control Architecture

### The Problem: Race Conditions & Deadlocks
In a banking environment with 8 worker threads handling concurrent requests:
1. **Race Condition (Lost Update):** Two concurrent deposits of $100 on an account with $500 could read $500 simultaneously and write back $600 instead of $700.
2. **Deadlock (Circular Wait):**
   - Thread 1: Transfers from Account 101 to Account 102 (locks 101, needs 102).
   - Thread 2: Transfers from Account 102 to Account 101 (locks 102, needs 101).
   - Both threads hang forever.

### The Solution:
1. **Granular Per-Account Mutexes (`AccountLocks`):**
   - Each account has its own `std::mutex` managed dynamically by `AccountLocks::instance()`.
   - Operations on different accounts run completely parallel with zero contention.
2. **Global Lock Hierarchy (Deadlock Prevention):**
   - Multi-account transfers sort account identifiers lexicographically before acquiring locks:
     `std::string first = std::min(acc_a, acc_b);`  
     `std::string second = std::max(acc_a, acc_b);`
   - Since all threads lock accounts in the exact same global order, **Circular Wait is eliminated**.
3. **Deadlock Detection Engine (`WaitForGraph`):**
   - Wait-For Graph where directed edges represent $T_A \rightarrow T_B$ (thread A waiting on thread B).
   - 3-Color DFS cycle detection (`UNVISITED`, `VISITING`, `VISITED`) finds cycles in $O(V + E)$ time and terminates a victim thread.

---

## 3. Crash Recovery Architecture (WAL + ARIES Protocol)

### The Problem: Partial Failures
During a multi-account transfer:
1. $100 is deducted from Account A.
2. **SYSTEM CRASH / POWER FAILURE!**
3. Account B never receives the $100. Money has vanished from the banking system.

### The Solution: Write-Ahead Logging (WAL)
Every state modification follows strict WAL rules:
1. **Write-Ahead Rule:** Log record containing `old_balance` and `new_balance` is flushed to the WAL before changing the live database table.
2. **Transaction Life Cycle in WAL:**
   - `START <txn_ref>`
   - `DEBIT <acc_a, old=500, new=400>`
   - `CREDIT <acc_b, old=200, new=300>`
   - `COMMIT <txn_ref>`

### ARIES-Style Recovery Protocol
When the server starts or recovers:
1. **Analysis Phase:** Reads WAL records from start to finish. Identifies:
   - Committed transactions (have matching `COMMIT` record).
   - Uncommitted/Active "loser" transactions (have `START` or `DEBIT` but NO `COMMIT`).
2. **Redo Phase:** Verifies that all committed transactions have their changes reflected.
3. **Undo Phase:** For every uncommitted transaction interrupted by the crash:
   - Reverts balances using the `old_balance` saved in the WAL record.
   - Appends an `ABORT` record to the WAL.
   - Total money conservation invariant: `SUM(balances)` is 100% restored.

