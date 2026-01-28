-- ================================================================
-- COMPLETE ADMIN SETUP: All Functions, Policies, and Data
-- ================================================================

-- 1) Ensure all required tables have proper foreign keys
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_organization_id_fkey;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_organization_id_fkey 
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_owner_id_fkey;
-- Link owner_id to profiles.id so PostgREST can join owner:profiles!owner_id
ALTER TABLE public.organizations 
  ADD CONSTRAINT organizations_owner_id_fkey 
  FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2) Create audit_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details TEXT,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- 3) Create payout_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  amount_gross NUMERIC(10, 2) NOT NULL,
  fee_amount NUMERIC(10, 2) NOT NULL,
  amount_net NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'rejected')),
  payout_method TEXT,
  payout_details JSONB,
  requested_by UUID REFERENCES public.profiles(id),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES public.profiles(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payout_requests_org ON public.payout_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);

-- 4) Add verification_status to organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'organizations' AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE public.organizations ADD COLUMN verification_status TEXT DEFAULT 'pending';
  END IF;
END $$;

ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_verification_status_check;
ALTER TABLE public.organizations 
  ADD CONSTRAINT organizations_verification_status_check 
  CHECK (verification_status IN ('pending','verified','rejected'));

UPDATE public.organizations SET verification_status = 'pending' WHERE verification_status IS NULL;

-- 5) Add status to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active';
  END IF;
END $$;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_status_check;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_status_check 
  CHECK (status IN ('active', 'suspended', 'inactive'));

UPDATE public.profiles SET status = 'active' WHERE status IS NULL;

-- 6) Create admin RPC functions
DROP FUNCTION IF EXISTS public.get_admin_stats();
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
    total_users BIGINT,
    total_organizations BIGINT,
    verified_organizations BIGINT,
    total_platform_revenue NUMERIC,
    pending_payout_amount NUMERIC,
    pending_verifications BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.profiles) as total_users,
        (SELECT COUNT(*) FROM public.organizations) as total_organizations,
        (SELECT COUNT(*) FROM public.organizations WHERE verification_status = 'verified') as verified_organizations,
        COALESCE((SELECT SUM(fee_amount) FROM public.payout_requests WHERE status = 'paid'), 0) as total_platform_revenue,
        COALESCE((SELECT SUM(amount_net) FROM public.payout_requests WHERE status = 'pending'), 0) as pending_payout_amount,
        (SELECT COUNT(*) FROM public.organizations WHERE verification_status = 'pending') as pending_verifications;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_admin_payouts();
CREATE OR REPLACE FUNCTION public.get_admin_payouts()
RETURNS TABLE (
    id UUID,
    organization_id UUID,
    organization_name TEXT,
    amount_gross NUMERIC,
    fee_amount NUMERIC,
    amount_net NUMERIC,
    status TEXT,
    created_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.id,
        pr.organization_id,
        o.name as organization_name,
        pr.amount_gross,
        pr.fee_amount,
        pr.amount_net,
        pr.status,
        pr.created_at,
        pr.processed_at
    FROM public.payout_requests pr
    LEFT JOIN public.organizations o ON o.id = pr.organization_id
    ORDER BY pr.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7) Create is_admin helper function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7b) Fix role constraint to include 'admin'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('parent', 'organization', 'team_member', 'admin', 'org_owner'));

-- 8) Create/Update profiles for all auth users (sync with auth.users)
DO $$
DECLARE
  v_user RECORD;
BEGIN
  FOR v_user IN SELECT id, email, raw_user_meta_data FROM auth.users LOOP
    INSERT INTO public.profiles (id, full_name, email, phone, role, status, created_at, updated_at)
    VALUES (
      v_user.id,
      COALESCE(v_user.raw_user_meta_data->>'full_name', 'User'),
      v_user.email,
      v_user.raw_user_meta_data->>'phone',
      'admin',
      'active',
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      role = 'admin',
      status = 'active',
      updated_at = now();
    
    RAISE NOTICE '✓ Profile created/updated for %', v_user.email;
  END LOOP;
END$$;

-- 9) Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 10) Drop existing policies
DROP POLICY IF EXISTS "profiles_own_data" ON public.profiles;
DROP POLICY IF EXISTS "admins_view_all_profiles" ON public.profiles;
DROP POLICY IF EXISTS "admins_update_profiles" ON public.profiles;
DROP POLICY IF EXISTS "orgs_owners_manage" ON public.organizations;
DROP POLICY IF EXISTS "orgs_public_view" ON public.organizations;
DROP POLICY IF EXISTS "admins_view_all_orgs" ON public.organizations;
DROP POLICY IF EXISTS "admins_update_orgs" ON public.organizations;
DROP POLICY IF EXISTS "admins_view_audit_logs" ON public.audit_logs;
DROP POLICY IF EXISTS "orgs_view_own_payouts" ON public.payout_requests;
DROP POLICY IF EXISTS "admins_view_all_payouts" ON public.payout_requests;
DROP POLICY IF EXISTS "admins_update_payouts" ON public.payout_requests;

-- 11) Create new RLS policies
-- Profiles: users can view/edit their own, admins can view/edit all
CREATE POLICY "profiles_own_data" ON public.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "admins_view_all_profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admins_update_profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin());

-- Organizations: owners manage theirs, anyone can view, admins can view/edit all
CREATE POLICY "orgs_owners_manage" ON public.organizations
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "orgs_public_view" ON public.organizations
  FOR SELECT USING (true);

CREATE POLICY "admins_view_all_orgs" ON public.organizations
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admins_update_orgs" ON public.organizations
  FOR UPDATE USING (public.is_admin());

-- Audit logs: only admins can view
CREATE POLICY "admins_view_audit_logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin());

-- Payout requests: orgs can view their own, admins can view all
CREATE POLICY "orgs_view_own_payouts" ON public.payout_requests
  FOR SELECT USING (
    organization_id IN (SELECT id FROM public.organizations WHERE owner_id = auth.uid())
  );

CREATE POLICY "admins_view_all_payouts" ON public.payout_requests
  FOR SELECT USING (public.is_admin());

CREATE POLICY "admins_update_payouts" ON public.payout_requests
  FOR UPDATE USING (public.is_admin());

-- 12) Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.payout_requests TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;

-- 13) Verify setup
SELECT 
  u.id,
  u.email,
  p.id AS profile_id,
  p.role,
  p.status,
  CASE 
    WHEN p.role = 'admin' THEN '✅ ADMIN'
    ELSE '❌ USER'
  END as access_level
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at DESC
LIMIT 10;

SELECT 'RLS Policies:' as info, tablename, policyname
FROM pg_policies 
WHERE schemaname = 'public' AND tablename IN ('profiles', 'organizations', 'audit_logs', 'payout_requests')
ORDER BY tablename, policyname;

SELECT '✅ Complete setup finished! Close browser and log back in.' as status;
