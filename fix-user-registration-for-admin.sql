/* ================================================================
   FIX USER REGISTRATION FOR ADMIN DASHBOARD COMPATIBILITY
   
   This script ensures the user registration trigger works correctly
   with the new admin dashboard columns (status, suspension_reason, suspended_at)
   
   Run this AFTER database-admin-dashboard-complete.sql
   ================================================================ */

-- Update the user registration function to explicitly set status
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
  
  -- Always create a profile first WITH status = 'active'
  INSERT INTO profiles (
    id,
    full_name,
    email,
    phone,
    role,
    status
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    user_role,
    'active'  -- Explicitly set status to 'active' for new users
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
    
    RAISE LOG 'Organization created with id: %', new_org_id;
    
    -- Update profile with organization_id
    UPDATE profiles 
    SET organization_id = new_org_id 
    WHERE id = NEW.id;
    
    RAISE LOG 'Profile updated with organization_id: %', new_org_id;
    
  -- Handle parent users
  ELSIF user_role = 'parent' THEN
    INSERT INTO parents (
      id,
      preferred_language
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
    );
    
    RAISE LOG 'Parent record created for user: %', NEW.id;
    
  -- Handle team member users
  ELSIF user_role = 'team_member' THEN
    -- Team members are added via invite, organization_id should already be in metadata
    UPDATE profiles 
    SET organization_id = (NEW.raw_user_meta_data->>'organization_id')::UUID
    WHERE id = NEW.id;
    
    INSERT INTO team_members (
      user_id,
      organization_id,
      role
    ) VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'organization_id')::UUID,
      COALESCE(NEW.raw_user_meta_data->>'team_role', 'staff')
    );
    
    RAISE LOG 'Team member record created for user: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error for debugging
    RAISE LOG 'Error in handle_new_user_registration for user %: % %', 
      NEW.id, SQLERRM, SQLSTATE;
    -- Re-raise the exception so the transaction fails
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_registration();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'User Registration Fixed!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'The user registration trigger now:';
    RAISE NOTICE '  ✓ Explicitly sets status = active';
    RAISE NOTICE '  ✓ Works with all new admin columns';
    RAISE NOTICE '  ✓ Has proper error handling';
    RAISE NOTICE '  ✓ Includes debug logging';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Test signup by creating a new user account';
    RAISE NOTICE '==============================================';
END $$;
