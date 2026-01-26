-- Fix RLS policies to prevent infinite recursion
-- Run this in your Supabase SQL Editor

-- First, drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON team_invites_fm7x9k2p1q;
DROP POLICY IF EXISTS "team_invites_access" ON team_invites_fm7x9k2p1q;
DROP POLICY IF EXISTS "team_invites_policy" ON team_invites_fm7x9k2p1q;

-- Create specific, non-recursive policies for team_invites_fm7x9k2p1q

-- 1. Allow users to view invitations sent to their email
CREATE POLICY "view_own_invitations" ON team_invites_fm7x9k2p1q
FOR SELECT
USING (email = auth.jwt() ->> 'email');

-- 2. Allow organization owners to view invitations for their organization
CREATE POLICY "view_org_invitations" ON team_invites_fm7x9k2p1q
FOR SELECT
USING (organization_id = auth.uid());

-- 3. Allow organization owners to create invitations for their organization
CREATE POLICY "create_org_invitations" ON team_invites_fm7x9k2p1q
FOR INSERT
WITH CHECK (organization_id = auth.uid());

-- 4. Allow organization owners to update invitations for their organization
CREATE POLICY "update_org_invitations" ON team_invites_fm7x9k2p1q
FOR UPDATE
USING (organization_id = auth.uid())
WITH CHECK (organization_id = auth.uid());

-- 5. Allow users who created the invitation to view it
CREATE POLICY "view_created_invitations" ON team_invites_fm7x9k2p1q
FOR SELECT
USING (invited_by = auth.uid());

-- Fix other table policies to prevent recursion
-- Drop existing policies for user_profiles
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON user_profiles_fm7x9k2p1q;
DROP POLICY IF EXISTS "user_profiles_access" ON user_profiles_fm7x9k2p1q;
DROP POLICY IF EXISTS "user_profiles_policy" ON user_profiles_fm7x9k2p1q;

-- Create specific policies for user_profiles_fm7x9k2p1q
CREATE POLICY "view_own_profile" ON user_profiles_fm7x9k2p1q
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "update_own_profile" ON user_profiles_fm7x9k2p1q
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "insert_own_profile" ON user_profiles_fm7x9k2p1q
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Allow org owners to view team members in their organization
CREATE POLICY "view_org_team_members" ON user_profiles_fm7x9k2p1q
FOR SELECT
USING (organization_id = auth.uid());

-- Fix organizations table policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON organizations_fm7x9k2p1q;
DROP POLICY IF EXISTS "organizations_access" ON organizations_fm7x9k2p1q;
DROP POLICY IF EXISTS "organizations_policy" ON organizations_fm7x9k2p1q;

-- Create specific policies for organizations_fm7x9k2p1q
CREATE POLICY "view_own_organization" ON organizations_fm7x9k2p1q
FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "update_own_organization" ON organizations_fm7x9k2p1q
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "insert_own_organization" ON organizations_fm7x9k2p1q
FOR INSERT
WITH CHECK (owner_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON team_invites_fm7x9k2p1q TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_profiles_fm7x9k2p1q TO authenticated;
GRANT SELECT, INSERT, UPDATE ON organizations_fm7x9k2p1q TO authenticated;

-- Test the setup
SELECT 'RLS policies updated successfully!' as message;

-- Verify no recursion by testing a simple query
SELECT COUNT(*) as invite_count FROM team_invites_fm7x9k2p1q;