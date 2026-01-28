-- ================================================================
-- COMPLETE FIX: Create Profile + Organization + Admin Access
-- Run this ONCE to fix everything
-- ================================================================

-- 1) Add verification_status to organizations if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN verification_status TEXT DEFAULT 'pending';
    ALTER TABLE public.organizations ADD CONSTRAINT organizations_verification_status_check
      CHECK (verification_status IN ('pending','verified','rejected'));
  END IF;
END $$;

ALTER TABLE public.organizations ALTER COLUMN verification_status SET DEFAULT 'pending';
UPDATE public.organizations SET verification_status = 'pending' WHERE verification_status IS NULL;

-- 2) Create your profile and organization
DO $$
DECLARE
  v_uid   uuid := '0e13b8ee-8e56-4845-b877-b137b9f16d5d';
  v_meta  jsonb;
  v_email text;
  v_orgid uuid;
BEGIN
  SELECT u.raw_user_meta_data, u.email INTO v_meta, v_email
  FROM auth.users u WHERE u.id = v_uid;

  -- Delete existing profile if any (fresh start)
  DELETE FROM public.profiles WHERE id = v_uid;

  -- Create profile as ADMIN
  INSERT INTO public.profiles (id, full_name, email, phone, role, created_at, updated_at)
  VALUES (
    v_uid,
    COALESCE(v_meta->>'full_name', 'Admin User'),
    v_email,
    v_meta->>'phone',
    'admin',  -- Set as admin
    now(),
    now()
  );

  RAISE NOTICE '✓ Admin profile created for %', v_email;
END$$;

-- 3) Create helper function to check admin (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Add RLS policies for admin access using the helper function
-- Allow admins to view all profiles
DROP POLICY IF EXISTS "admins_view_all_profiles" ON public.profiles;
CREATE POLICY "admins_view_all_profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Allow admins to view all organizations
DROP POLICY IF EXISTS "admins_view_all_orgs" ON public.organizations;
CREATE POLICY "admins_view_all_orgs"
  ON public.organizations FOR SELECT
  USING (public.is_admin());

-- Allow admins to update organizations
DROP POLICY IF EXISTS "admins_update_orgs" ON public.organizations;
CREATE POLICY "admins_update_orgs"
  ON public.organizations FOR UPDATE
  USING (public.is_admin());

-- Allow admins to update profiles
DROP POLICY IF EXISTS "admins_update_profiles" ON public.profiles;
CREATE POLICY "admins_update_profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Allow admins to view audit logs (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    EXECUTE 'DROP POLICY IF EXISTS "admins_view_audit_logs" ON public.audit_logs';
    EXECUTE 'CREATE POLICY "admins_view_audit_logs" ON public.audit_logs FOR SELECT
      USING (public.is_admin())';
  END IF;
END$$;

-- 5) Verify everything
SELECT 
  u.id,
  u.email,
  p.id AS profile_id,
  p.role,
  p.full_name,
  CASE 
    WHEN p.id IS NULL THEN '❌ NO PROFILE'
    WHEN p.role = 'admin' THEN '✅ ADMIN ACCESS'
    ELSE '⚠️ WRONG ROLE: ' || p.role
  END as status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.id = '0e13b8ee-8e56-4845-b877-b137b9f16d5d';

-- 6) Check RLS policies
SELECT 'Admin RLS Policies Created:' as info, policyname
FROM pg_policies 
WHERE schemaname = 'public' AND policyname LIKE 'admins_%';

SELECT '
╔══════════════════════════════════════════════════════════════╗
║  ✅ ADMIN ACCOUNT CREATED                                     ║
╚══════════════════════════════════════════════════════════════╝

Your account is now set up as ADMIN!

Next Steps:
1. CLOSE YOUR BROWSER COMPLETELY (to clear cache)
2. Open a new browser window (or incognito)
3. Go to http://localhost:5173
4. Log in with: richmwn5@gmail.com
5. You should see the Admin Dashboard

If you still see an error, check browser console (F12) for errors.
' as instructions;
