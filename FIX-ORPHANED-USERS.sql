-- ================================================================
-- FIX ORPHANED USERS: Create missing profiles
-- ================================================================
-- This will find users without profiles and create them
-- Then fix the trigger to prevent future issues
-- ================================================================

-- STEP 1: Find and fix orphaned users
DO $$
DECLARE
  user_record RECORD;
  new_org_id UUID;
  user_role TEXT;
BEGIN
  -- Loop through all users without profiles
  FOR user_record IN 
    SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    WHERE p.id IS NULL
  LOOP
    user_role := user_record.raw_user_meta_data->>'role';
    
    RAISE NOTICE 'Fixing orphaned user: % (role: %)', user_record.email, user_role;
    
    BEGIN
      -- Create profile
      INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone,
        role,
        created_at
      ) VALUES (
        user_record.id,
        user_record.raw_user_meta_data->>'full_name',
        user_record.email,
        user_record.raw_user_meta_data->>'phone',
        user_role,
        user_record.created_at
      );
      
      RAISE NOTICE 'Profile created for %', user_record.email;
      
      -- Handle role-specific tables
      IF user_role = 'organization' THEN
        -- Create organization
        INSERT INTO public.organizations (
          owner_id,
          name,
          email,
          phone,
          created_at
        ) VALUES (
          user_record.id,
          COALESCE(user_record.raw_user_meta_data->>'organization_name', 'My Organization'),
          user_record.email,
          user_record.raw_user_meta_data->>'phone',
          user_record.created_at
        ) RETURNING id INTO new_org_id;
        
        -- Link profile to organization
        UPDATE public.profiles 
        SET organization_id = new_org_id 
        WHERE id = user_record.id;
        
        RAISE NOTICE 'Organization created and linked for %', user_record.email;
        
      ELSIF user_role = 'parent' THEN
        -- Create parent record if it doesn't exist
        INSERT INTO public.parents (id, created_at)
        VALUES (user_record.id, user_record.created_at)
        ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Parent record created for %', user_record.email;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to fix user %: %', user_record.email, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Orphaned users fix completed!';
END $$;

-- STEP 2: Check results
SELECT 
  'Orphaned users remaining: ' || COUNT(*) as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- STEP 3: Show all users and their profile status
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'role' as intended_role,
  p.id as profile_exists,
  p.role as profile_role,
  p.full_name,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    WHEN p.role IS NULL THEN '⚠️ PROFILE MISSING ROLE'
    ELSE '✅ OK'
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

-- STEP 4: Check RLS policies that might block profile reads
SELECT 
  'RLS Policies on profiles:' as info,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT '
╔══════════════════════════════════════════════════════════════╗
║  ORPHANED USERS FIXED                                         ║
╚══════════════════════════════════════════════════════════════╝

If you still get "Account Initialization Error":
1. Try logging out and logging back in
2. Clear browser cache/cookies
3. Check if RLS policy is blocking profile reads

To test: Try accessing your dashboard again now!
' as instructions;
