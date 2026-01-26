-- First, let's get the Supabase credentials and then set up the database
-- This file contains the SQL that needs to be executed in Supabase

-- Create team_invites table
CREATE TABLE IF NOT EXISTS team_invites_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('team_member')),
  
  -- Invite security
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  
  invited_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE team_invites_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_invites_organization ON team_invites_fm7x9k2p1q (organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites_fm7x9k2p1q (email);
CREATE INDEX IF NOT EXISTS idx_team_invites_code ON team_invites_fm7x9k2p1q (invite_code);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON team_invites_fm7x9k2p1q (status);

-- Create simple, non-recursive RLS policies
CREATE POLICY "Enable all operations for authenticated users" 
ON team_invites_fm7x9k2p1q 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create organizations table if it doesn't exist (referenced by team_invites)
CREATE TABLE IF NOT EXISTS organizations_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for organizations
ALTER TABLE organizations_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- Create simple policy for organizations
CREATE POLICY "Enable all operations for authenticated users" 
ON organizations_fm7x9k2p1q 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create user_profiles table if it doesn't exist
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

-- Create simple policy for user_profiles
CREATE POLICY "Enable all operations for authenticated users" 
ON user_profiles_fm7x9k2p1q 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles_fm7x9k2p1q (
    user_id,
    full_name,
    email,
    phone,
    role,
    organization_name
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'organization_name'
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

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();

-- Insert some sample data for testing (optional)
-- You can remove this section if you don't want sample data
INSERT INTO organizations_fm7x9k2p1q (id, name, owner_id) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Elite Sports Academy', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440001', 'Youth Training Center', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON team_invites_fm7x9k2p1q TO authenticated;
GRANT ALL ON organizations_fm7x9k2p1q TO authenticated;
GRANT ALL ON user_profiles_fm7x9k2p1q TO authenticated;