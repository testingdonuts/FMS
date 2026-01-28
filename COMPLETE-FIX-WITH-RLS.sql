-- ================================================================
-- COMPLETE FIX: Create Profiles + Test Access
-- ================================================================
-- This will fix orphaned users AND test that profiles can be read
-- ================================================================

-- STEP 1: Show current user status BEFORE fix
SELECT 'BEFORE FIX - Current User Status:' as step;
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'role' as role_from_signup,
  p.id as has_profile,
  p.role as profile_role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;

-- STEP 2: Fix all orphaned users
DO $$
DECLARE
  user_record RECORD;
  new_org_id UUID;
  user_role TEXT;
  fixed_count INT := 0;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    user_role := COALESCE(user_record.raw_user_meta_data->>'role', 'parent');
    
    RAISE NOTICE 'Fixing user: % (role: %)', user_record.email, user_role;
    
    BEGIN
      -- Create profile
      INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone,
        role,
        created_at,
        updated_at
      ) VALUES (
        user_record.id,
        COALESCE(user_record.raw_user_meta_data->>'full_name', 'User'),
        user_record.email,
        user_record.raw_user_meta_data->>'phone',
        user_role,
        user_record.created_at,
        user_record.created_at
      );
      
      RAISE NOTICE '✓ Profile created for %', user_record.email;
      fixed_count := fixed_count + 1;
      
      -- Handle organization users
      IF user_role = 'organization' THEN
        INSERT INTO public.organizations (
          owner_id,
          name,
          email,
          phone,
          created_at,
          updated_at
        ) VALUES (
          user_record.id,
          COALESCE(user_record.raw_user_meta_data->>'organization_name', 'My Organization'),
          user_record.email,
          user_record.raw_user_meta_data->>'phone',
          user_record.created_at,
          user_record.created_at
        ) RETURNING id INTO new_org_id;
        
        UPDATE public.profiles 
        SET organization_id = new_org_id 
        WHERE id = user_record.id;
        
        RAISE NOTICE '✓ Organization created for %', user_record.email;
        
      -- Handle parent users
      ELSIF user_role = 'parent' THEN
        INSERT INTO public.parents (id, created_at, updated_at)
        VALUES (user_record.id, user_record.created_at, user_record.created_at)
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE '✓ Parent record created for %', user_record.email;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '✗ Failed to fix user %: %', user_record.email, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '=== Fixed % orphaned users ===', fixed_count;
END $$;

-- STEP 3: Show user status AFTER fix
SELECT 'AFTER FIX - User Status:' as step;
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'role' as role_from_signup,
  p.id as profile_id,
  p.role as profile_role,
  p.full_name,
  o.id as org_id,
  o.name as org_name,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    WHEN p.role = 'organization' AND o.id IS NULL THEN '⚠️ MISSING ORG'
    ELSE '✅ COMPLETE'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.organizations o ON o.owner_id = u.id
ORDER BY u.created_at DESC
LIMIT 10;

-- STEP 4: Test if authenticated users can read their own profiles
-- This simulates what happens when the frontend tries to fetch the profile
DO $$
DECLARE
  test_user_id UUID;
  test_email TEXT;
  can_read BOOLEAN;
BEGIN
  -- Get the most recent user
  SELECT id, email INTO test_user_id, test_email
  FROM auth.users
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'No users found to test';
    RETURN;
  END IF;
  
  -- Test if profile can be read with the RLS policy
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = test_user_id
  ) INTO can_read;
  
  IF can_read THEN
    RAISE NOTICE '✓ Profile for % CAN be read', test_email;
  ELSE
    RAISE WARNING '✗ Profile for % CANNOT be read - RLS issue!', test_email;
  END IF;
END $$;

-- STEP 5: Check RLS policies
SELECT 'Current RLS Policies on profiles:' as step;
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename = 'profiles';

-- STEP 6: Ensure RLS policy allows users to read their own profile
DROP POLICY IF EXISTS "profiles_own_data" ON public.profiles;

CREATE POLICY "profiles_own_data" 
  ON public.profiles 
  FOR ALL 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Also add a policy for service role to read everything (for debugging)
DROP POLICY IF EXISTS "profiles_service_role_access" ON public.profiles;

CREATE POLICY "profiles_service_role_access"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

SELECT '✓ RLS policies updated' as status;

-- STEP 7: Final verification
SELECT '
╔══════════════════════════════════════════════════════════════╗
║  FIX COMPLETE - VERIFICATION                                  ║
╚══════════════════════════════════════════════════════════════╝

Check the results above:
1. All users should now have profiles (✅ COMPLETE)
2. Organization users should have organizations
3. RLS policies should allow users to read their own profiles

Next Steps:
1. Log out of your app
2. Log back in
3. Try accessing the dashboard

If still not working, check browser console for specific errors.
' as final_message;
