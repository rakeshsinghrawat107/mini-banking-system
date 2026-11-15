-- ==============================================================================
-- Mini Banking Transaction System: Database Schema
-- Graphic Era Hill University - Team GHOST (Sumit Singh Mahar - DBMS Developer)
-- Schema: banking (supports PostgreSQL & Supabase)
-- ==============================================================================

SET client_min_messages = warning;
DROP SCHEMA IF EXISTS banking CASCADE;
CREATE SCHEMA banking;
SET search_path = banking, public, extensions;

-- Enable UUID extension if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------- 1. Bank Accounts Table ----------
CREATE TABLE accounts (
    id             SERIAL PRIMARY KEY,
    account_number VARCHAR(16) NOT NULL UNIQUE,
    holder_name    VARCHAR(100) NOT NULL,
    email          VARCHAR(100),
    balance        NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00), -- Invariant: No negative balances
    status         VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
    created_at     TIMESTAMP NOT NULL DEFAULT localtimestamp
);

-- Index for instant lookup by account_number
CREATE INDEX idx_accounts_acc_no ON accounts(account_number);

-- ---------- 2. Transactions Ledger Table ----------
CREATE TABLE transactions (
    id              SERIAL PRIMARY KEY,
    txn_ref         VARCHAR(64) NOT NULL UNIQUE,
    from_account_id INT REFERENCES accounts(id),
    to_account_id   INT REFERENCES accounts(id),
    type            VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'transfer')),
    amount          NUMERIC(15, 2) NOT NULL CHECK (amount > 0.00),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'committed', 'rolled_back', 'failed')),
    created_at      TIMESTAMP NOT NULL DEFAULT localtimestamp
);

CREATE INDEX idx_transactions_from_acc ON transactions(from_account_id);
CREATE INDEX idx_transactions_to_acc   ON transactions(to_account_id);
CREATE INDEX idx_transactions_created  ON transactions(created_at);

-- ---------- 3. Write-Ahead Log (WAL) Table (Crash Recovery) ----------
CREATE TABLE wal_logs (
    id           SERIAL PRIMARY KEY,
    lsn          BIGINT NOT NULL,                                                    -- Log Sequence Number
    txn_ref      VARCHAR(64) NOT NULL,
    action       VARCHAR(20) NOT NULL CHECK (action IN ('START', 'DEBIT', 'CREDIT', 'COMMIT', 'ABORT')),
    account_id   INT REFERENCES accounts(id),
    old_balance  NUMERIC(15, 2),
    new_balance  NUMERIC(15, 2),
    logged_at    TIMESTAMP NOT NULL DEFAULT localtimestamp
);

CREATE INDEX idx_wal_txn_ref ON wal_logs(txn_ref);
CREATE INDEX idx_wal_lsn     ON wal_logs(lsn);

-- ---------- 4. Audit Log Table ----------
CREATE TABLE audit_log (
    id          SERIAL PRIMARY KEY,
    logged_at   TIMESTAMP NOT NULL DEFAULT localtimestamp,
    operator    VARCHAR(50),
    action      VARCHAR(50) NOT NULL,
    details     TEXT
);

-- ---------- 5. Views for Quick Reporting ----------
CREATE OR REPLACE VIEW account_summary AS
    SELECT a.id, a.account_number, a.holder_name, a.balance, a.status,
           COUNT(t.id) AS total_transactions
    FROM accounts a
    LEFT JOIN transactions t ON (t.from_account_id = a.id OR t.to_account_id = a.id)
    GROUP BY a.id, a.account_number, a.holder_name, a.balance, a.status;

CREATE OR REPLACE VIEW transaction_history AS
    SELECT t.id, t.txn_ref, t.type, t.amount, t.status, t.created_at,
           fa.account_number AS from_account, fa.holder_name AS from_holder,
           ta.account_number AS to_account, ta.holder_name AS to_holder
    FROM transactions t
    LEFT JOIN accounts fa ON fa.id = t.from_account_id
    LEFT JOIN accounts ta ON ta.id = t.to_account_id
    ORDER BY t.created_at DESC;

