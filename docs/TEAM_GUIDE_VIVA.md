# Team Guide & Viva Preparation — Team GHOST

**Project Title:** Mini Banking Transaction System with Concurrency Control and Crash Recovery  
**Institution:** Graphic Era Hill University  
**Team Name:** GHOST  

---

## 1. Team Responsibilities & Division of Work

| Member | Role | Assigned Modules & Deliverables | Key Files |
|---|---|---|---|
| **Rohit Negi** *(Team Lead)* | System Architecture & Integration | Overall project coordination, CLI main program, HTTP server configuration, end-to-end testing, integration of OS & DBMS modules. | `src/main.cpp`, `Makefile`, `Dockerfile`, `verify_system.py` |
| **Sumit Singh Mahar** | DBMS & Transactions Developer | Database schema design, PostgreSQL / Supabase connectivity, SQL queries with prepared parameters, ACID transaction wrapper (`BEGIN`, `COMMIT`, `ROLLBACK`), constraints & views. | `sql/schema.sql`, `sql/seed.sql`, `src/db.hpp`, `src/db.cpp` |
| **Priyanka Bartwal** | Banking Operations Developer | Core banking features: account creation, balance checking, deposit, withdrawal, fund transfer business logic, input validation, and ledger recording. | `src/banking.hpp`, `src/banking.cpp`, `src/routes.cpp` |
| **Mohd Faiz** | OS & Recovery Developer | Concurrency control using mutex locks, sorted lock hierarchy (deadlock prevention), Wait-For Graph cycle detection, Write-Ahead Logging (WAL) and crash recovery engine. | `src/concurrency.hpp`, `src/deadlock.hpp`, `src/deadlock.cpp`, `src/recovery.hpp`, `src/recovery.cpp` |

---

## 2. 10-Minute Presentation & Live Demo Script

1. **System Introduction & Architecture (2 mins - Rohit Negi):**
   - Explain the 3-tier architecture: C++17 server interfacing with PostgreSQL / Supabase, backed by fine-grained synchronization and write-ahead logging.
   - Show project structure and emphasize the integration of OS and DBMS concepts.

2. **Database Schema & ACID Transactions (2 mins - Sumit Singh Mahar):**
   - Walk through `sql/schema.sql`: show `accounts`, `transactions`, `wal_logs`, and `audit_log` tables.
   - Explain how `Transaction` RAII ensures atomicity: `BEGIN` on construction, `COMMIT` on success, and automatic `ROLLBACK` on any error or exception.

3. **Core Banking Operations (2 mins - Priyanka Bartwal):**
   - Demonstrate account creation, checking balance, deposit, and withdrawal.
   - Show how the system prevents overdrafts with check constraints (`balance >= 0`) and proper error responses.

4. **Concurrency Control & Deadlock Demo (2 mins - Mohd Faiz):**
   - Run in terminal: `./banking --demo-race`  
     *Show how 10 concurrent threads without locks corrupt account balance, while mutex locking guarantees exact mathematical consistency.*
   - Run in terminal: `./banking --demo-deadlock`  
     *Show circular wait deadlock with A->B and B->A transfers detected by WFG and solved by sorted lock acquisition.*

5. **Crash Recovery Demo & Conclusion (2 mins - Mohd Faiz & Rohit Negi):**
   - Run in terminal: `./banking --demo-crash`  
     *Simulate a power failure midpoint through a transfer after debiting Account A. Show how WAL log analysis identifies the uncommitted transaction and undoes the partial debit, perfectly restoring system consistency.*

---

## 3. High-Yield Viva Questions & Answers

### Questions for Rohit Negi (Team Lead & Integration)
- **Q: Why did you choose C++17 for the backend?**  
  **A:** C++ provides native low-level primitives for Operating System synchronization (`std::mutex`, `std::unique_lock`, `std::condition_variable`, `std::thread`) and direct interaction with database client libraries like `libpq` without overhead.
- **Q: How does the HTTP server handle multiple simultaneous clients?**  
  **A:** We use a thread pool of 8 worker threads (`httplib::ThreadPool(8)`). Each incoming client request is dispatched to an available worker thread from the pool, preventing the overhead of creating a new thread per request.

### Questions for Sumit Singh Mahar (DBMS Developer)
- **Q: What are the ACID properties in your banking system?**  
  **A:**
  - **Atomicity:** Either both debit and credit occur in a transfer, or neither does (managed by `Transaction` class and WAL).
  - **Consistency:** Database invariants like `CHECK (balance >= 0)` prevent negative balances.
  - **Isolation:** Concurrent transactions cannot view partial state, managed via mutex locks and row locking.
  - **Durability:** Committed transactions are persistently stored in Supabase / PostgreSQL and WAL logs.
- **Q: How do you prevent SQL injection?**  
  **A:** All queries use parameterized statements with `PQexecParams` using `$1, $2, ...` placeholders. User input is treated strictly as data, never concatenated into SQL strings.

### Questions for Priyanka Bartwal (Banking Operations Developer)
- **Q: How does the transfer function handle validation?**  
  **A:** It validates that the sender and receiver are distinct accounts, verifies the transfer amount is positive ($> 0$), confirms the sender has sufficient balance, and executes the transfer inside an atomic critical section.
- **Q: What happens if someone tries to withdraw more money than their balance?**  
  **A:** The business logic performs a pre-check throwing an HTTP 400 Bad Request / Insufficient Funds error, and the database schema has an absolute safety net: `CHECK (balance >= 0)`.

### Questions for Mohd Faiz (OS & Recovery Developer)
- **Q: What are the 4 Coffman conditions for Deadlock, and how does your code handle them?**  
  **A:**
  1. Mutual Exclusion
  2. Hold and Wait
  3. No Preemption
  4. Circular Wait  
  Our system eliminates **Circular Wait** by sorting account IDs lexicographically (`std::min(acc_a, acc_b)` locked first). Since every thread acquires locks in the exact same global order, a circular dependency is mathematically impossible.
- **Q: How does the Wait-For Graph (WFG) detect deadlocks?**  
  **A:** Nodes represent transactions/threads, and edges represent wait dependencies. We run a 3-color DFS (`UNVISITED=0`, `VISITING=1`, `VISITED=2`). If a neighbor is in state `VISITING`, a back-edge exists, indicating a directed cycle. The cycle is reported and a victim is terminated.
- **Q: Explain how your Crash Recovery engine works.**  
  **A:** It follows the ARIES protocol:
  1. **Write-Ahead Logging:** Balance changes are recorded to WAL with `old_balance` and `new_balance` before modifying the database.
  2. **Analysis Phase:** On restart, it scans the WAL to find uncommitted transactions that never reached `COMMIT`.
  3. **Undo Phase:** For any active/uncommitted transaction, it uses the recorded `old_balance` to roll back the debited account, restoring full data consistency.
