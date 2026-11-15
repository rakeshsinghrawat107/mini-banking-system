# Mini Banking Transaction System with Concurrency Control and Crash Recovery

A College DBMS + Operating Systems Project — **Graphic Era Hill University**  
**Team Name:** GHOST  
**Team Members:**
- **Rohit Negi** (Team Leader) — Student ID: 24011999 (`rn2919544@gmail.com`)
- **Sumit Singh Mahar** (DBMS Developer) — Student ID: 240111491 (`sumitsinghmahar123@gmail.com`)
- **Mohd Faiz** (OS & Recovery Developer) — Student ID: 240111916 (`faizmohd0220@gmail.com`)
- **Priyanka Bartwal** (Banking Operations Developer) — Student ID: 240121452 (`bartwal190606@gmail.com`)

---

## 1. Project Overview

The **Mini Banking Transaction System** is a high-performance banking server designed to safely execute financial transactions under concurrent workloads and recover cleanly from simulated system crashes.

### Key Capabilities:
1. **Core Banking Operations:** Account creation, balance lookup, deposits, withdrawals, and multi-account fund transfers.
2. **Concurrency Control (OS):** Fine-grained per-account mutex locking to eliminate race conditions and double-spending.
3. **Deadlock Handling (OS):** Lexicographical lock ordering to break Coffman's *Circular Wait* condition, plus a runtime **Wait-For Graph (WFG)** with 3-color DFS cycle detection and victim selection.
4. **ACID Transactions (DBMS):** PostgreSQL / Supabase transactions with `BEGIN`, `COMMIT`, and `ROLLBACK` for relational consistency.
5. **Crash Recovery (DBMS/OS):** Write-Ahead Logging (WAL) implementing ARIES protocol principles (Analysis, Redo, Undo) to guarantee no money is lost or invented when a crash interrupts a transfer.

---

## 2. Technology Stack

| Component | Technology |
|---|---|
| **Backend Language** | C++17 / C |
| **Networking & HTTP** | `cpp-httplib` (embedded single-header multi-threaded server) |
| **Serialization** | `nlohmann/json` (single-header modern JSON for C++) |
| **Database** | PostgreSQL / Supabase (`libpq` client library) |
| **Concurrency Primitives** | `std::mutex`, `std::unique_lock`, `std::condition_variable`, `std::timed_mutex` |
| **Cross-Platform Verification** | Python 3 verification runner (`verify_system.py`) |

---

## 3. Quick Start

### Run Full REST Backend & Web Dashboard (Cross-Platform)
```bash
# 1. Start the server (serves both API & Frontend SPA on http://localhost:5000)
python server.py

# 2. (Optional) Run Vite Dev Server with hot reload
cd frontend
npm install
npm run dev
# Vite runs on: http://localhost:3000 (proxied to backend on 5000)
```

### Build & Run (C++ Backend)
```bash
# 1. Compile the server
make

# 2. Initialize schema & demo accounts in Supabase / PostgreSQL
export DATABASE_URL='postgresql://postgres.xxx:PASSWORD@aws-0-xx.pooler.supabase.com:5432/postgres?sslmode=require'
./banking --init

# 3. Start HTTP server on port 8080
./banking
```

### Run Standalone Demonstrations
```bash
# Native C++ OS Concurrency Demonstrator (Windows & Linux)
make demo
./banking_demo

# Or run specific experiments
./banking_demo --race      # 100 concurrent withdrawals (race condition vs mutex)
./banking_demo --deadlock  # WFG cycle detection & lexicographical lock ordering
```

### Instant Python Verification Runner
```bash
python verify_system.py
```

---

## 4. Academic Presentation & Documentation Deliverables

All presentation slides and comprehensive evaluation reports are pre-compiled and available in `docs/`:
* **PowerPoint Presentation Deck (.pptx):** [docs/Mini_Banking_System_Viva_Presentation.pptx](docs/Mini_Banking_System_Viva_Presentation.pptx)
* **Formal Project Report (.pdf):** [docs/Project_Report_Mini_Banking_System.pdf](docs/Project_Report_Mini_Banking_System.pdf)
* **Team Responsibilities & Viva Q&A:** [docs/TEAM_GUIDE_VIVA.md](docs/TEAM_GUIDE_VIVA.md)
* **Detailed System Architecture:** [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md)

---

## 5. Cloud & Container Deployment

### 1-Click Render Cloud Deployment
* Configuration file: `render.yaml`
* Connect your GitHub repository to [Render.com](https://render.com) — it will automatically install dependencies, build the frontend SPA, and host the live server!

### 1-Click Vercel Frontend Deployment
* Configuration file: `frontend/vercel.json`
* Deploy `frontend/` to Vercel with `VITE_API_URL` set to your live backend URL.

### Docker Compose
```bash
# Spin up both PostgreSQL 16 and Mini Banking App
docker compose up --build
```

