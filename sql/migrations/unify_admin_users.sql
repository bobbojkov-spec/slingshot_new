-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'admin', -- 'admin' or 'super_admin'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- Ensure admin_login_codes exists (from existing logic, just in case)
CREATE TABLE IF NOT EXISTS admin_login_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    device_fingerprint TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for searching users by email
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(lower(email));

-- Optional: Migrate existing admin_profiles to admin_users if possible
-- This is tricky because admin_profiles doesn't have password_hash.
-- We might need to leave them active but require a password reset, 
-- or just assume this is a fresh start for "Fix" request. 
-- Given "remove all supabase rest stuff", valid users might be in Supabase Auth but not here.
-- For now, we create the table structure. 
