-- ==============================================================================
-- Mini Banking Transaction System: Demo Seed Data
-- Graphic Era Hill University - Team GHOST
-- ==============================================================================

SET search_path = banking, public, extensions;

-- Initial Demo Accounts
INSERT INTO accounts (account_number, holder_name, email, balance, status) VALUES
    ('ACC1001', 'Rohit Negi',        'rn2919544@gmail.com',         50000.00, 'active'),
    ('ACC1002', 'Sumit Singh Mahar', 'sumitsinghmahar123@gmail.com', 35000.00, 'active'),
    ('ACC1003', 'Mohd Faiz',         'faizmohd0220@gmail.com',      42000.00, 'active'),
    ('ACC1004', 'Priyanka Bartwal',   'bartwal190606@gmail.com',     60000.00, 'active'),
    ('ACC1005', 'Demo Corporate',    'corporate@bank.com',         100000.00, 'active')
ON CONFLICT (account_number) DO NOTHING;

-- Initial Demo Completed Transactions
INSERT INTO transactions (txn_ref, from_account_id, to_account_id, type, amount, status) VALUES
    ('TXN-INIT-001', NULL, 1, 'deposit', 50000.00, 'committed'),
    ('TXN-INIT-002', NULL, 2, 'deposit', 35000.00, 'committed'),
    ('TXN-INIT-003', NULL, 3, 'deposit', 42000.00, 'committed'),
    ('TXN-INIT-004', NULL, 4, 'deposit', 60000.00, 'committed')
ON CONFLICT (txn_ref) DO NOTHING;

-- Initial Audit Record
INSERT INTO audit_log (operator, action, details) VALUES
    ('system', 'init-database', 'Initialized banking schema with 5 demo accounts and starting balances');

