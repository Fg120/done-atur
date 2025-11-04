-- ============================================================================
-- Supabase Database Schema Migration
-- Project: Done-Atur (Donation Management System)
-- Migration: 001_init_schema
-- Description: Initial database schema with profiles table and supporting structures
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Create user role enum type
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'seller', 'user');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Table: profiles
-- Description: Stores user profile information including authentication details and role
-- Prefix: t_ (table prefix for consistent naming convention)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Index for created_at for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;

-- HAPUS SEMUA POLICY LAMA
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can do anything" ON profiles;

-- CREATE ULANG DENGAN SIMPLE LOGIC (NO RECURSION)
-- Policy 1: Everyone can view their own profile
CREATE POLICY "view_own_profile"
    ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Everyone can update their own profile
CREATE POLICY "update_own_profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Service role bypass (for backend only)
CREATE POLICY "service_role_bypass"
    ON profiles
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function: Handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Update updated_at on profiles changes
DROP TRIGGER IF EXISTS set_updated_at ON profiles;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
        'user'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create profile when new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Function: Sync email changes from auth.users to profiles
CREATE OR REPLACE FUNCTION handle_user_email_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email IS DISTINCT FROM OLD.email THEN
        UPDATE public.profiles
        SET email = NEW.email
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Sync email on auth.users update
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION handle_user_email_change();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- NO HELPER FUNCTIONS - CAUSES RECURSION
-- Use service_role for admin checks instead

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant access to profiles table
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO anon, authenticated, service_role;

-- Grant access to sequences (if any are added later)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profiles table with authentication and role information';
COMMENT ON COLUMN profiles.id IS 'References auth.users(id), primary key';
COMMENT ON COLUMN profiles.email IS 'User email address, synced with auth.users';
COMMENT ON COLUMN profiles.full_name IS 'Display name of the user';
COMMENT ON COLUMN profiles.role IS 'User role: admin, seller, or user';
COMMENT ON COLUMN profiles.created_at IS 'Timestamp when profile was created';
COMMENT ON COLUMN profiles.updated_at IS 'Timestamp of last profile update, auto-updated by trigger';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
