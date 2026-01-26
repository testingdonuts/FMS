-- Fix the team invites table relationships
-- This SQL should be run in your Supabase SQL editor

-- First, let's check what tables actually exist
-- Run this query first to see your actual table structure:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%fm7x9k2p1q';

-- Drop existing problematic policies that might cause recursion
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON team_invites_fm7x9k2p1q;

-- Create a simple, non-recursive policy for team invites
CREATE POLICY "team_invites_policy" ON team_invites_fm7x9k2p1q
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Ensure the table has proper structure
ALTER TABLE team_invites_fm7x9k2p1q 
ALTER COLUMN invite_code SET DEFAULT encode(gen_random_bytes(8), 'hex');

-- Create or update indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_invites_org_id ON team_invites_fm7x9k2p1q (organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites_fm7x9k2p1q (email);
CREATE INDEX IF NOT EXISTS idx_team_invites_code ON team_invites_fm7x9k2p1q (invite_code);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON team_invites_fm7x9k2p1q (status);

-- Make sure user_profiles table has proper indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles_fm7x9k2p1q (user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_org_id ON user_profiles_fm7x9k2p1q (organization_id);

-- Drop and recreate policies for user_profiles if they're causing issues
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON user_profiles_fm7x9k2p1q;

CREATE POLICY "user_profiles_policy" ON user_profiles_fm7x9k2p1q
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Same for organizations table
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON organizations_fm7x9k2p1q;

CREATE POLICY "organizations_policy" ON organizations_fm7x9k2p1q
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- Grant proper permissions
GRANT ALL ON team_invites_fm7x9k2p1q TO authenticated;
GRANT ALL ON user_profiles_fm7x9k2p1q TO authenticated;
GRANT ALL ON organizations_fm7x9k2p1q TO authenticated;

-- Test query to verify the fix
-- SELECT COUNT(*) FROM team_invites_fm7x9k2p1q;