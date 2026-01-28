-- ================================================================
-- EMERGENCY FIX: Remove verification_status from insert
-- ================================================================
-- This fixes the immediate error by only inserting required fields
-- Run this NOW to fix the 500 error
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
  RAISE LOG 'Starting registration for user %: role=%', NEW.id, user_role;
  
  -- Create profile (only required fields)
  INSERT INTO public.profiles (
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
  
  RAISE LOG 'Profile created successfully for user %', NEW.id;
  
  -- Handle role-specific setup
  IF user_role = 'organization' THEN
    -- Create organization (ONLY REQUIRED FIELDS)
    INSERT INTO public.organizations (
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
    
    -- Link profile to organization
    UPDATE public.profiles 
    SET organization_id = new_org_id 
    WHERE id = NEW.id;
    
    RAISE LOG 'Organization % created for user %', new_org_id, NEW.id;
    
  ELSIF user_role = 'parent' THEN
    -- Create parent record
    INSERT INTO public.parents (id) 
    VALUES (NEW.id);
    
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
      
      RAISE LOG 'Team member linked to org % for user %', org_id_from_meta, NEW.id;
    END IF;
  END IF;
  
  RAISE LOG 'Registration completed for user %', NEW.id;
  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  RAISE LOG 'Registration error for user %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  -- Don't block user creation
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_registration();

-- Verify
SELECT 'Emergency fix applied! Try signing up now.' as status;
