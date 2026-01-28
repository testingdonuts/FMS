-- ================================================================
-- EMERGENCY FIX: User Registration Error
-- Run this immediately if users can't sign up
-- ================================================================

-- Step 1: Ensure status column has proper default
ALTER TABLE public.profiles 
ALTER COLUMN status SET DEFAULT 'active';

-- Step 2: Fix any existing NULL statuses
UPDATE public.profiles 
SET status = 'active' 
WHERE status IS NULL;

-- Step 3: Update the registration trigger to explicitly set status
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  org_name TEXT;
  new_org_id UUID;
BEGIN
  user_role := NEW.raw_user_meta_data->>'role';
  org_name := NEW.raw_user_meta_data->>'organization_name';
  
  -- Create profile WITH status explicitly set
  INSERT INTO profiles (
    id, full_name, email, phone, role, status
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    user_role,
    'active'  -- ← This is the key fix
  );
  
  -- Organization signup
  IF user_role = 'organization' THEN
    INSERT INTO organizations (owner_id, name, email, phone)
    VALUES (NEW.id, COALESCE(org_name, 'My Organization'), NEW.email, NEW.raw_user_meta_data->>'phone')
    RETURNING id INTO new_org_id;
    
    UPDATE profiles SET organization_id = new_org_id WHERE id = NEW.id;
    
  -- Parent signup
  ELSIF user_role = 'parent' THEN
    INSERT INTO parents (id, preferred_language)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'));
    
  -- Team member signup
  ELSIF user_role = 'team_member' THEN
    UPDATE profiles SET organization_id = (NEW.raw_user_meta_data->>'organization_id')::UUID WHERE id = NEW.id;
    
    INSERT INTO team_members (user_id, organization_id, role)
    VALUES (NEW.id, (NEW.raw_user_meta_data->>'organization_id')::UUID, 
            COALESCE(NEW.raw_user_meta_data->>'team_role', 'staff'));
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Registration error for %: %', NEW.id, SQLERRM;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Ensure trigger is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_registration();

-- Verification
SELECT 'Fix applied successfully!' as status;
SELECT 'Test by creating a new user account' as next_step;
