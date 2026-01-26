-- Complete fix for team invites system
-- Run this in your Supabase SQL editor

-- First, let's check what tables exist
DO $$
BEGIN
    -- Create team_invites table if it doesn't exist
    CREATE TABLE IF NOT EXISTS team_invites_fm7x9k2p1q (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'team_member' CHECK (role IN ('team_member')),
        invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex'),
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
        invited_by UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Add missing columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_invites_fm7x9k2p1q' AND column_name = 'invite_code'
    ) THEN
        ALTER TABLE team_invites_fm7x9k2p1q 
        ADD COLUMN invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(8), 'hex');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_invites_fm7x9k2p1q' AND column_name = 'status'
    ) THEN
        ALTER TABLE team_invites_fm7x9k2p1q 
        ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'team_invites_fm7x9k2p1q' AND column_name = 'expires_at'
    ) THEN
        ALTER TABLE team_invites_fm7x9k2p1q 
        ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days');
    END IF;

    -- Update existing records that might not have invite codes
    UPDATE team_invites_fm7x9k2p1q 
    SET invite_code = encode(gen_random_bytes(8), 'hex')
    WHERE invite_code IS NULL;

    -- Update existing records that might not have status
    UPDATE team_invites_fm7x9k2p1q 
    SET status = 'pending'
    WHERE status IS NULL;

    -- Update existing records that might not have expires_at
    UPDATE team_invites_fm7x9k2p1q 
    SET expires_at = (created_at + INTERVAL '7 days')
    WHERE expires_at IS NULL;

END $$;

-- Enable RLS
ALTER TABLE team_invites_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON team_invites_fm7x9k2p1q;

-- Create simple, non-recursive policy
CREATE POLICY "team_invites_access" ON team_invites_fm7x9k2p1q
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_invites_org_id ON team_invites_fm7x9k2p1q (organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites_fm7x9k2p1q (email);
CREATE INDEX IF NOT EXISTS idx_team_invites_code ON team_invites_fm7x9k2p1q (invite_code);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON team_invites_fm7x9k2p1q (status);
CREATE INDEX IF NOT EXISTS idx_team_invites_invited_by ON team_invites_fm7x9k2p1q (invited_by);

-- Ensure organizations table exists
CREATE TABLE IF NOT EXISTS organizations_fm7x9k2p1q (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for organizations
ALTER TABLE organizations_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- Create policy for organizations
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON organizations_fm7x9k2p1q;
CREATE POLICY "organizations_access" ON organizations_fm7x9k2p1q
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure user_profiles table exists and has correct structure
CREATE TABLE IF NOT EXISTS user_profiles_fm7x9k2p1q (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT,
    organization_id UUID,
    organization_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- Create policy for user_profiles
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON user_profiles_fm7x9k2p1q;
CREATE POLICY "user_profiles_access" ON user_profiles_fm7x9k2p1q
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Create indexes for user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles_fm7x9k2p1q (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles_fm7x9k2p1q (organization_id);

-- Grant permissions
GRANT ALL ON team_invites_fm7x9k2p1q TO authenticated;
GRANT ALL ON organizations_fm7x9k2p1q TO authenticated;
GRANT ALL ON user_profiles_fm7x9k2p1q TO authenticated;

-- Test the setup with a simple query
SELECT 'Setup complete! Table structure:' as message;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'team_invites_fm7x9k2p1q'
ORDER BY ordinal_position;