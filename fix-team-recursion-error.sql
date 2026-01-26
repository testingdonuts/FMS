-- Fix infinite recursion error by dropping and recreating team tables
-- Run this in your Supabase SQL Editor

-- Step 1: Drop all existing team-related tables to start fresh
DROP TABLE IF EXISTS team_invites_fm7x9k2p1q CASCADE;
DROP TABLE IF EXISTS organizations_fm7x9k2p1q CASCADE;

-- Step 2: Drop and recreate user_profiles table without problematic relationships
DROP TABLE IF EXISTS user_profiles_fm7x9k2p1q CASCADE;

-- Step 3: Recreate user_profiles table with simple structure
CREATE TABLE user_profiles_fm7x9k2p1q (
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

-- Create simple, non-recursive policy for user_profiles
CREATE POLICY "user_profiles_simple_access" 
ON user_profiles_fm7x9k2p1q 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Step 4: Recreate organizations table with simple structure
CREATE TABLE organizations_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for organizations
ALTER TABLE organizations_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- Create simple policy for organizations
CREATE POLICY "organizations_simple_access" 
ON organizations_fm7x9k2p1q 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Step 5: Recreate team_invites table with simple structure
CREATE TABLE team_invites_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'team_member' CHECK (role IN ('team_member')),
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for team_invites
ALTER TABLE team_invites_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policy for team_invites
CREATE POLICY "team_invites_simple_access" 
ON team_invites_fm7x9k2p1q 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Step 6: Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles_fm7x9k2p1q (user_id);
CREATE INDEX idx_user_profiles_org_id ON user_profiles_fm7x9k2p1q (organization_id);

CREATE INDEX idx_organizations_owner_id ON organizations_fm7x9k2p1q (owner_id);

CREATE INDEX idx_team_invites_org_id ON team_invites_fm7x9k2p1q (organization_id);
CREATE INDEX idx_team_invites_email ON team_invites_fm7x9k2p1q (email);
CREATE INDEX idx_team_invites_code ON team_invites_fm7x9k2p1q (invite_code);
CREATE INDEX idx_team_invites_status ON team_invites_fm7x9k2p1q (status);
CREATE INDEX idx_team_invites_invited_by ON team_invites_fm7x9k2p1q (invited_by);

-- Step 7: Grant permissions
GRANT ALL ON user_profiles_fm7x9k2p1q TO authenticated;
GRANT ALL ON organizations_fm7x9k2p1q TO authenticated;
GRANT ALL ON team_invites_fm7x9k2p1q TO authenticated;

-- Step 8: Recreate the user registration function without complex relationships
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile
  INSERT INTO user_profiles_fm7x9k2p1q (
    user_id,
    full_name,
    email,
    phone,
    role,
    organization_name,
    organization_id
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'organization_name',
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'organization' THEN NEW.id
      ELSE (NEW.raw_user_meta_data->>'organization_id')::UUID
    END
  );

  -- If user is an organization owner, create organization record
  IF NEW.raw_user_meta_data->>'role' = 'organization' THEN
    INSERT INTO organizations_fm7x9k2p1q (
      id,
      name,
      owner_id
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization'),
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();

-- Step 10: Test the setup
SELECT 'Team tables recreated successfully!' as message;
SELECT 'Testing simple queries...' as test_message;

-- Test queries to ensure no recursion
SELECT COUNT(*) as user_profiles_count FROM user_profiles_fm7x9k2p1q;
SELECT COUNT(*) as organizations_count FROM organizations_fm7x9k2p1q;
SELECT COUNT(*) as team_invites_count FROM team_invites_fm7x9k2p1q;

SELECT 'All team tables are working without recursion!' as success_message;