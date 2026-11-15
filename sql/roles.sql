-- ==============================================================================
-- Mini Banking Transaction System: Roles, Privileges & Row-Level Security
-- Graphic Era Hill University - Team GHOST
-- ==============================================================================

SET search_path = banking, public, extensions;

-- Optional Application Roles
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bank_teller') THEN
        CREATE ROLE bank_teller;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bank_auditor') THEN
        CREATE ROLE bank_auditor;
    END IF;
END $$;

-- Grant permissions to roles
GRANT USAGE ON SCHEMA banking TO bank_teller, bank_auditor;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA banking TO bank_teller;
GRANT SELECT ON ALL TABLES IN SCHEMA banking TO bank_auditor;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA banking TO bank_teller;

-- Row Level Security (RLS) on accounts
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Allow bank services full access
DROP POLICY IF EXISTS bank_service_policy ON accounts;
CREATE POLICY bank_service_policy ON accounts
    FOR ALL
    USING (true)
    WITH CHECK (true);
