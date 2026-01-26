-- Complete fix for user registration issues
-- Run this in your Supabase SQL Editor

-- 1. First, let's check what auth trigger functions exist
SELECT proname, prosrc FROM pg_proc WHERE proname LIKE '%user%';

-- 2. Drop existing trigger and function to start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_registration() CASCADE;

-- 3. Ensure we have the correct table structure
-- Create profiles table with correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('parent', 'organization', 'team_member')) NOT NULL,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  zipcode TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create parents table
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_language TEXT DEFAULT 'en',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('technician', 'manager', 'staff')) DEFAULT 'technician',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- 4. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies
DROP POLICY IF EXISTS "profiles_own_data" ON profiles;
DROP POLICY IF EXISTS "orgs_owners_manage" ON organizations;
DROP POLICY IF EXISTS "orgs_public_view" ON organizations;
DROP POLICY IF EXISTS "parents_own_data" ON parents;
DROP POLICY IF EXISTS "team_members_org_manage" ON team_members;
DROP POLICY IF EXISTS "team_members_view_own" ON team_members;

-- 6. Create simple, working policies
CREATE POLICY "profiles_own_data" ON profiles 
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "orgs_owners_manage" ON organizations 
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "orgs_public_view" ON organizations 
  FOR SELECT USING (true);

CREATE POLICY "parents_own_data" ON parents 
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "team_members_org_manage" ON team_members 
  FOR ALL USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "team_members_view_own" ON team_members 
  FOR SELECT USING (auth.uid() = user_id);

-- 7. Create the corrected user registration function
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  org_name TEXT;
  new_org_id UUID;
BEGIN
  -- Get user metadata
  user_role := NEW.raw_user_meta_data->>'role';
  org_name := NEW.raw_user_meta_data->>'organization_name';

  -- Insert profile first
  INSERT INTO profiles (
    id,
    full_name,
    email,
    phone,
    role
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    user_role
  );

  -- Handle organization users
  IF user_role = 'organization' THEN
    -- Create organization
    INSERT INTO organizations (
      owner_id,
      name,
      email,
      phone
    ) VALUES (
      NEW.id,
      COALESCE(org_name, 'My Organization'),
      NEW.email,
      NEW.raw_user_meta_data->>'phone'
    )
    RETURNING id INTO new_org_id;

    -- Update profile with organization_id
    UPDATE profiles 
    SET organization_id = new_org_id 
    WHERE id = NEW.id;

  -- Handle parent users
  ELSIF user_role = 'parent' THEN
    INSERT INTO parents (id) VALUES (NEW.id);

  -- Handle team member users (they'll be added to team_members later via invitation)
  ELSIF user_role = 'team_member' THEN
    -- Profile is already created above, nothing else needed here
    NULL;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user_registration: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles (organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations (owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_org_id ON team_members (organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members (user_id);

-- 10. Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON parents TO authenticated;
GRANT ALL ON team_members TO authenticated;

-- 11. Test the setup
SELECT 'User registration fix complete!' as message;

-- Verify table structure
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'organizations', 'parents', 'team_members')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;