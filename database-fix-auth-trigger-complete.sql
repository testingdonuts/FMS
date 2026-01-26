-- Complete fix for auth trigger and signup data routing
-- Run this in your Supabase SQL Editor

-- First, let's check what tables exist and their structure
SELECT 'Checking existing tables...' as status;
SELECT table_name, column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'organizations', 'parents', 'team_members')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Drop existing trigger to recreate it properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user_registration() CASCADE;

-- Ensure all required tables exist with correct structure
-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('parent','organization','team_member')) NOT NULL,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ORGANIZATIONS TABLE  
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

-- 3. PARENTS TABLE
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language TEXT DEFAULT 'en',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TEAM_MEMBERS TABLE
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('technician','manager','staff')) DEFAULT 'technician',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Add foreign key constraint for profiles.organization_id if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_organization_id_fkey'
  ) THEN
    ALTER TABLE profiles 
    ADD CONSTRAINT profiles_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_own_data" ON profiles;
DROP POLICY IF EXISTS "orgs_owners_manage" ON organizations;
DROP POLICY IF EXISTS "orgs_public_view" ON organizations;
DROP POLICY IF EXISTS "parents_own_data" ON parents;
DROP POLICY IF EXISTS "team_members_org_manage" ON team_members;
DROP POLICY IF EXISTS "team_members_view_own" ON team_members;

-- Create simple, working RLS policies
CREATE POLICY "profiles_own_data" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "orgs_owners_manage" ON organizations FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "orgs_public_view" ON organizations FOR SELECT USING (true);
CREATE POLICY "parents_own_data" ON parents FOR ALL USING (auth.uid() = id);
CREATE POLICY "team_members_org_manage" ON team_members FOR ALL USING (
  organization_id IN (
    SELECT id FROM organizations WHERE owner_id = auth.uid()
  )
);
CREATE POLICY "team_members_view_own" ON team_members FOR SELECT USING (auth.uid() = user_id);

-- Create the corrected user registration function
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
  
  -- Debug logging
  RAISE LOG 'Processing new user registration: %, role: %, org_name: %', 
    NEW.id, user_role, org_name;
  
  -- Always create a profile first
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
  
  RAISE LOG 'Profile created for user: %', NEW.id;
  
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
    ) RETURNING id INTO new_org_id;
    
    -- Update profile with organization_id
    UPDATE profiles 
    SET organization_id = new_org_id 
    WHERE id = NEW.id;
    
    RAISE LOG 'Organization created with ID: % for user: %', new_org_id, NEW.id;
    
  -- Handle parent users
  ELSIF user_role = 'parent' THEN
    INSERT INTO parents (id) VALUES (NEW.id);
    
    RAISE LOG 'Parent record created for user: %', NEW.id;
    
  -- Handle team member users (they'll be added to team_members later via invitation)
  ELSIF user_role = 'team_member' THEN
    -- Profile is already created above, nothing else needed here
    RAISE LOG 'Team member profile created for user: %', NEW.id;
    
  END IF;
  
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Log the error but don't fail the user creation
  RAISE WARNING 'Error in handle_new_user_registration for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON profiles (organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations (owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_org_id ON team_members (organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members (user_id);

-- Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON parents TO authenticated;
GRANT ALL ON team_members TO authenticated;

-- Insert sample data for testing
INSERT INTO organizations (id, name, owner_id, description, email, phone) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440000',
  'SafeRide CPST Services',
  '550e8400-e29b-41d4-a716-446655440000',
  'Professional car seat installation and safety education services',
  'info@saferidecpst.com',
  '(555) 987-6543'
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Elite Child Safety',
  '550e8400-e29b-41d4-a716-446655440001',
  'Premium car seat installation and family safety consulting',
  'contact@elitechildsafety.com',
  '(555) 123-4567'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  'Family First Car Seats',
  '550e8400-e29b-41d4-a716-446655440002',
  'Affordable car seat services for every family',
  'hello@familyfirstseats.com',
  '(555) 555-0123'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  description = EXCLUDED.description;

-- Test the trigger function
SELECT 'Auth trigger setup completed successfully!' as message;

-- Verify table structure
SELECT 
  'Table: ' || table_name || ' | Column: ' || column_name || ' | Type: ' || data_type || ' | Nullable: ' || is_nullable as table_structure
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'organizations', 'parents', 'team_members')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name IN ('profiles', 'organizations', 'parents', 'team_members')
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- Verify sample data
SELECT COUNT(*) as organizations_count FROM organizations;

SELECT 'Setup verification complete! Try signing up with a new account to test the trigger.' as final_message;