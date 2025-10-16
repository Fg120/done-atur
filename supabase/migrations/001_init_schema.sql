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
CREATE TYPE user_role AS ENUM ('admin', 'seller', 'user');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Table: profiles
-- Description: Stores user profile information including authentication details and role
-- Prefix: t_ (table prefix for consistent naming convention)
CREATE TABLE profiles (
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
CREATE INDEX idx_profiles_email ON profiles(email);

-- Index for role-based queries
CREATE INDEX idx_profiles_role ON profiles(role);

-- Index for created_at for sorting and filtering
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to read their own profile
CREATE POLICY "Users can view own profile"
    ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Allow users to update their own profile (except role)
CREATE POLICY "Users can update own profile"
    ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id 
        AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    );

-- Policy: Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
    ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Allow admins to update any profile
CREATE POLICY "Admins can update all profiles"
    ON profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy: Allow admins to delete users (except themselves)
CREATE POLICY "Admins can delete other profiles"
    ON profiles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
        AND id != auth.uid()
    );

-- Policy: Allow service role to insert new profiles
CREATE POLICY "Service role can insert profiles"
    ON profiles
    FOR INSERT
    WITH CHECK (true);

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
CREATE TRIGGER on_auth_user_email_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW
    WHEN (OLD.email IS DISTINCT FROM NEW.email)
    EXECUTE FUNCTION handle_user_email_change();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get current user's role
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val
    FROM profiles
    WHERE id = auth.uid();
    
    RETURN user_role_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant access to profiles table
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO anon, authenticated, service_role;

-- Grant access to sequences (if any are added later)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION handle_updated_at() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION handle_user_email_change() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated, service_role;

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

COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates profile entry when new user signs up via auth.users';
COMMENT ON FUNCTION handle_user_email_change() IS 'Syncs email changes from auth.users to profiles';
COMMENT ON FUNCTION handle_updated_at() IS 'Updates the updated_at timestamp on row modification';
COMMENT ON FUNCTION is_admin() IS 'Returns true if current authenticated user has admin role';
COMMENT ON FUNCTION get_current_user_role() IS 'Returns the role of the current authenticated user';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
