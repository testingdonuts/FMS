-- ================================================================
-- DIAGNOSTIC SCRIPT: Find Registration Issues
-- ================================================================
-- Run this to see what's preventing user registration
-- ================================================================

-- 1. Check if profiles table exists and its structure
SELECT 'STEP 1: Checking profiles table structure' as step;

SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check if status column exists
SELECT 'STEP 2: Checking status column' as step;

SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'status'
) as status_column_exists;

-- 3. Check constraints on profiles
SELECT 'STEP 3: Checking constraints' as step;

SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'profiles';

-- 4. Check if trigger exists
SELECT 'STEP 4: Checking trigger' as step;

SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users';

-- 5. Check RLS policies on profiles
SELECT 'STEP 5: Checking RLS policies' as step;

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 6. Check if other required tables exist
SELECT 'STEP 6: Checking required tables' as step;

SELECT 
  table_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables t2 
      WHERE t2.table_schema = 'public' 
      AND t2.table_name = table_name
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as status
FROM (
  VALUES 
    ('profiles'),
    ('organizations'),
    ('parents'),
    ('team_members')
) AS required_tables(table_name);

-- 7. Check recent auth.users (to see if any signups attempted)
SELECT 'STEP 7: Recent signup attempts' as step;

SELECT 
  id,
  email,
  created_at,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'full_name' as full_name,
  confirmed_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 8. Check if profiles were created for those users
SELECT 'STEP 8: Checking if profiles exist for recent users' as step;

SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created,
  p.id as profile_id,
  p.role,
  p.full_name,
  CASE 
    WHEN p.id IS NULL THEN '✗ NO PROFILE'
    ELSE '✓ HAS PROFILE'
  END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC 
LIMIT 5;

-- 9. Test if we can manually insert a profile
SELECT 'STEP 9: Testing manual profile insert' as step;

DO $$
DECLARE
  test_uuid UUID := 'a0000000-0000-0000-0000-000000000001';
BEGIN
  -- Clean up test data if exists
  DELETE FROM public.profiles WHERE id = test_uuid;
  
  -- Try to insert
  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    status
  ) VALUES (
    test_uuid,
    'Test User',
    'test' || floor(random() * 10000) || '@example.com',
    '555-0000',
    'parent',
    'active'
  );
  
  -- Clean up
  DELETE FROM public.profiles WHERE id = test_uuid;
  
  RAISE NOTICE '✓ Manual profile insert SUCCESSFUL';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '✗ Manual profile insert FAILED: %', SQLERRM;
END $$;

-- 10. Check for any existing users without profiles (orphaned)
SELECT 'STEP 10: Checking for orphaned auth users' as step;

SELECT 
  COUNT(*) as orphaned_users_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '⚠ Users exist without profiles!'
    ELSE '✓ No orphaned users'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- Summary
SELECT '
╔══════════════════════════════════════════════════════════════╗
║  DIAGNOSTIC COMPLETE                                          ║
╚══════════════════════════════════════════════════════════════╝

Review the output above to identify issues:

1. If status column is missing → Need to add it
2. If trigger doesn''t exist → Need to create it  
3. If RLS policies are too restrictive → Need to adjust them
4. If orphaned users exist → Trigger is failing silently
5. If manual insert fails → Schema/permission issue

Next Steps:
- If everything looks good, the issue might be in the frontend
- Check Supabase Logs: Dashboard > Database > Logs
- Try signup again and check logs immediately
' as summary;
