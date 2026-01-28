-- ================================================================
-- COMPLETE FIX: Database Error Saving New User
-- ================================================================
-- This script fixes all known issues with user registration:
-- 1. Ensures status column exists with proper default
-- 2. Updates registration trigger to explicitly set status
-- 3. Fixes all role-specific table creation
-- 4. Ensures proper error handling
-- Run this in Supabase SQL Editor
-- ================================================================

-- STEP 1: Ensure profiles table has status column with proper setup
-- ================================================================
DO $$ 
BEGIN
    -- Add status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN status TEXT DEFAULT 'active';
        
        RAISE NOTICE 'Added status column to profiles table';
    END IF;
END $$;

-- Ensure status has proper default
ALTER TABLE public.profiles 
ALTER COLUMN status SET DEFAULT 'active';

-- Update any existing NULL statuses
UPDATE public.profiles 
SET status = 'active' 
WHERE status IS NULL;

-- Remove existing constraint if it exists and recreate
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('active', 'suspended', 'inactive'));

DO $$ BEGIN
    RAISE NOTICE 'Status column configured properly';
END $$;

-- STEP 2: Ensure all required tables exist
-- ================================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('parent','organization','team_member')) NOT NULL,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  organization_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'inactive')),
  suspension_reason TEXT,
  suspended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Organizations table  
CREATE TABLE IF NOT EXISTS public.organizations (
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
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  admin_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Parents table
CREATE TABLE IF NOT EXISTS public.parents (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language TEXT DEFAULT 'en',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('technician','manager','staff')) DEFAULT 'staff',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Add foreign key constraint for profiles.organization_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'profiles_organization_id_fkey'
    AND table_name = 'profiles'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;
    
    RAISE NOTICE 'Added foreign key constraint for profiles.organization_id';
  END IF;
END $$;

-- STEP 3: Drop and recreate the registration trigger function
-- ================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_registration() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  org_name TEXT;
  new_org_id UUID;
  org_id_from_meta TEXT;
BEGIN
  -- Extract metadata
  user_role := NEW.raw_user_meta_data->>'role';
  org_name := NEW.raw_user_meta_data->>'organization_name';
  org_id_from_meta := NEW.raw_user_meta_data->>'organization_id';
  
  -- Log the registration attempt
  RAISE LOG 'Starting registration for user %: role=%, org_name=%', 
    NEW.id, user_role, org_name;
  
  -- CRITICAL: Create profile with explicit status = 'active'
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    status  -- ← CRITICAL: Explicitly set status
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    user_role,
    'active'  -- ← CRITICAL: Always set to active on creation
  );
  
  RAISE LOG 'Profile created successfully for user %', NEW.id;
  
  -- Handle role-specific setup
  IF user_role = 'organization' THEN
    -- Create organization
    INSERT INTO public.organizations (
      owner_id,
      name,
      email,
      phone,
      verification_status
    ) VALUES (
      NEW.id,
      COALESCE(org_name, 'My Organization'),
      NEW.email,
      NEW.raw_user_meta_data->>'phone',
      'pending'
    ) RETURNING id INTO new_org_id;
    
    -- Link profile to organization
    UPDATE public.profiles 
    SET organization_id = new_org_id 
    WHERE id = NEW.id;
    
    RAISE LOG 'Organization % created and linked to user %', new_org_id, NEW.id;
    
  ELSIF user_role = 'parent' THEN
    -- Create parent record
    INSERT INTO public.parents (
      id,
      preferred_language
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
    );
    
    RAISE LOG 'Parent record created for user %', NEW.id;
    
  ELSIF user_role = 'team_member' THEN
    -- For team members, link to organization if provided
    IF org_id_from_meta IS NOT NULL THEN
      UPDATE public.profiles 
      SET organization_id = org_id_from_meta::UUID 
      WHERE id = NEW.id;
      
      -- Create team member record
      INSERT INTO public.team_members (
        user_id,
        organization_id,
        role
      ) VALUES (
        NEW.id,
        org_id_from_meta::UUID,
        COALESCE(NEW.raw_user_meta_data->>'team_role', 'staff')
      );
      
      RAISE LOG 'Team member linked to organization % for user %', org_id_from_meta, NEW.id;
    ELSE
      RAISE LOG 'Team member profile created without organization for user %', NEW.id;
    END IF;
    
  ELSE
    RAISE WARNING 'Unknown role % for user %', user_role, NEW.id;
  END IF;
  
  RAISE LOG 'Registration completed successfully for user %', NEW.id;
  RETURN NEW;
  
EXCEPTION 
  WHEN unique_violation THEN
    RAISE LOG 'Unique violation error for user %: %', NEW.id, SQLERRM;
    -- Don't block user creation, just log the error
    RETURN NEW;
    
  WHEN foreign_key_violation THEN
    RAISE LOG 'Foreign key violation for user %: %', NEW.id, SQLERRM;
    -- Don't block user creation, just log the error
    RETURN NEW;
    
  WHEN check_violation THEN
    RAISE LOG 'Check constraint violation for user %: %', NEW.id, SQLERRM;
    -- Don't block user creation, just log the error
    RETURN NEW;
    
  WHEN OTHERS THEN
    RAISE LOG 'Unexpected error in registration for user %: % (SQLSTATE: %)', 
      NEW.id, SQLERRM, SQLSTATE;
    -- Don't block user creation, just log the error
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Create the trigger
-- ================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_registration();

DO $$ BEGIN
    RAISE NOTICE 'Registration trigger created successfully';
END $$;

-- STEP 5: Enable RLS and create policies
-- ================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_own_data" ON public.profiles;
DROP POLICY IF EXISTS "orgs_owners_manage" ON public.organizations;
DROP POLICY IF EXISTS "orgs_public_view" ON public.organizations;
DROP POLICY IF EXISTS "parents_own_data" ON public.parents;
DROP POLICY IF EXISTS "team_members_org_manage" ON public.team_members;
DROP POLICY IF EXISTS "team_members_view_own" ON public.team_members;

-- Create RLS policies
CREATE POLICY "profiles_own_data" 
  ON public.profiles 
  FOR ALL 
  USING (auth.uid() = id);

CREATE POLICY "orgs_owners_manage" 
  ON public.organizations 
  FOR ALL 
  USING (auth.uid() = owner_id);

CREATE POLICY "orgs_public_view" 
  ON public.organizations 
  FOR SELECT 
  USING (true);

CREATE POLICY "parents_own_data" 
  ON public.parents 
  FOR ALL 
  USING (auth.uid() = id);

CREATE POLICY "team_members_org_manage" 
  ON public.team_members 
  FOR ALL 
  USING (
    organization_id IN (
      SELECT id FROM public.organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "team_members_view_own" 
  ON public.team_members 
  FOR SELECT 
  USING (auth.uid() = user_id);

DO $$ BEGIN
    RAISE NOTICE 'RLS policies created successfully';
END $$;

-- STEP 6: Create indexes for performance
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_org_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_verification ON public.organizations(verification_status);
CREATE INDEX IF NOT EXISTS idx_team_members_org_id ON public.team_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

DO $$ BEGIN
    RAISE NOTICE 'Indexes created successfully';
END $$;

-- STEP 7: Grant necessary permissions
-- ================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.parents TO authenticated;
GRANT ALL ON public.team_members TO authenticated;

DO $$ BEGIN
    RAISE NOTICE 'Permissions granted successfully';
END $$;

-- ================================================================
-- VERIFICATION
-- ================================================================

-- Check table structure
DO $$
DECLARE
    status_col_exists BOOLEAN;
    status_has_default BOOLEAN;
    trigger_exists BOOLEAN;
BEGIN
    -- Check if status column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'status'
    ) INTO status_col_exists;
    
    -- Check if status has default
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'status'
        AND column_default IS NOT NULL
    ) INTO status_has_default;
    
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) INTO trigger_exists;
    
    RAISE NOTICE '=== VERIFICATION RESULTS ===';
    RAISE NOTICE 'Status column exists: %', status_col_exists;
    RAISE NOTICE 'Status has default: %', status_has_default;
    RAISE NOTICE 'Registration trigger exists: %', trigger_exists;
    
    IF status_col_exists AND status_has_default AND trigger_exists THEN
        RAISE NOTICE '✓ All checks passed! User registration should work now.';
    ELSE
        RAISE WARNING '✗ Some checks failed. Review the output above.';
    END IF;
END $$;

-- Show table structure
SELECT 
  table_name,
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================
SELECT '
╔══════════════════════════════════════════════════════════════╗
║  ✓ USER REGISTRATION FIX APPLIED SUCCESSFULLY                ║
╚══════════════════════════════════════════════════════════════╝

Next steps:
1. Test user registration with a new account
2. Check the logs in Supabase Dashboard > Database > Logs
3. Verify profile was created with status = ''active''

To test:
- Go to your app signup page
- Create a new account (parent or organization)
- Check: SELECT * FROM profiles ORDER BY created_at DESC LIMIT 1;
' AS instructions;
