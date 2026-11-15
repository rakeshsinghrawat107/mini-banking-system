-- Migration: new-migration
-- Mini Banking Transaction System
-- Graphic Era Hill University - Team GHOST
-- Schema: banking

CREATE SCHEMA IF NOT EXISTS banking;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Accounts Table
CREATE TABLE IF NOT EXISTS banking.accounts (
    id             SERIAL PRIMARY KEY,
    account_number VARCHAR(16) NOT NULL UNIQUE,
    holder_name    VARCHAR(100) NOT NULL,
    email          VARCHAR(100),
    balance        NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
    status         VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed')),
    created_at     TIMESTAMP NOT NULL DEFAULT localtimestamp
);

CREATE INDEX IF NOT EXISTS idx_accounts_acc_no ON banking.accounts(account_number);

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS banking.transactions (
    id              SERIAL PRIMARY KEY,
    txn_ref         VARCHAR(64) NOT NULL UNIQUE,
    from_account_id INT REFERENCES banking.accounts(id),
    to_account_id   INT REFERENCES banking.accounts(id),
    type            VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'transfer')),
    amount          NUMERIC(15, 2) NOT NULL CHECK (amount > 0.00),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'committed', 'rolled_back', 'failed')),
    created_at      TIMESTAMP NOT NULL DEFAULT localtimestamp
);

CREATE INDEX IF NOT EXISTS idx_transactions_from_acc ON banking.transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_acc   ON banking.transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created  ON banking.transactions(created_at);

-- 3. Write-Ahead Log (WAL) Table
CREATE TABLE IF NOT EXISTS banking.wal_logs (
    id           SERIAL PRIMARY KEY,
    lsn          BIGINT NOT NULL,
    txn_ref      VARCHAR(64) NOT NULL,
    action       VARCHAR(20) NOT NULL CHECK (action IN ('START', 'DEBIT', 'CREDIT', 'COMMIT', 'ABORT')),
    account_id   INT REFERENCES banking.accounts(id),
    old_balance  NUMERIC(15, 2),
    new_balance  NUMERIC(15, 2),
    logged_at    TIMESTAMP NOT NULL DEFAULT localtimestamp
);

CREATE INDEX IF NOT EXISTS idx_wal_txn_ref ON banking.wal_logs(txn_ref);
CREATE INDEX IF NOT EXISTS idx_wal_lsn     ON banking.wal_logs(lsn);

-- 4. Audit Log Table
CREATE TABLE IF NOT EXISTS banking.audit_log (
    id          SERIAL PRIMARY KEY,
    logged_at   TIMESTAMP NOT NULL DEFAULT localtimestamp,
    operator    VARCHAR(50),
    action      VARCHAR(50) NOT NULL,
    details     TEXT
);

-- 5. Reporting Views
CREATE OR REPLACE VIEW banking.account_summary AS
    SELECT a.id, a.account_number, a.holder_name, a.balance, a.status,
           COUNT(t.id) AS total_transactions
    FROM banking.accounts a
    LEFT JOIN banking.transactions t ON (t.from_account_id = a.id OR t.to_account_id = a.id)
    GROUP BY a.id, a.account_number, a.holder_name, a.balance, a.status;

CREATE OR REPLACE VIEW banking.transaction_history AS
    SELECT t.id, t.txn_ref, t.type, t.amount, t.status, t.created_at,
           fa.account_number AS from_account, fa.holder_name AS from_holder,
           ta.account_number AS to_account, ta.holder_name AS to_holder
    FROM banking.transactions t
    LEFT JOIN banking.accounts fa ON fa.id = t.from_account_id
    LEFT JOIN banking.accounts ta ON ta.id = t.to_account_id
    ORDER BY t.created_at DESC;
