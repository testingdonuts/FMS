-- ================================================================
-- Fix organizations.verification_status missing + backfill user/org/profile
-- Safe to run multiple times
-- ================================================================

-- 1) Ensure verification_status column exists on organizations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'verification_status'
  ) THEN
    ALTER TABLE public.organizations
      ADD COLUMN verification_status TEXT DEFAULT 'pending';
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_verification_status_check
      CHECK (verification_status IN ('pending','verified','rejected'));
  END IF;
END $$;

-- 2) Make sure column has default and no nulls
ALTER TABLE public.organizations ALTER COLUMN verification_status SET DEFAULT 'pending';
UPDATE public.organizations SET verification_status = 'pending' WHERE verification_status IS NULL;

-- 3) Recreate log_admin_action to avoid OLD.verification_status errors
DROP FUNCTION IF EXISTS public.log_admin_action() CASCADE;
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_TABLE_NAME = 'organizations'
     AND OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      entity_type,
      entity_id,
      details,
      created_at
    ) VALUES (
      auth.uid(),
      'organization_status_change',
      'organization',
      NEW.id,
      format('Status changed from %s to %s', OLD.verification_status, NEW.verification_status),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Recreate triggers that use log_admin_action (insert/update/delete)
DROP TRIGGER IF EXISTS organizations_admin_log_ins ON public.organizations;
DROP TRIGGER IF EXISTS organizations_admin_log_upd ON public.organizations;
DROP TRIGGER IF EXISTS organizations_admin_log_del ON public.organizations;

CREATE TRIGGER organizations_admin_log_upd
AFTER UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.log_admin_action();

-- 5) Backfill the specific user (organization role) with missing profile/org link
DO $$
DECLARE
  v_uid   uuid := '0e13b8ee-8e56-4845-b877-b137b9f16d5d';
  v_meta  jsonb;
  v_email text;
  v_phone text;
  v_full  text;
  v_orgid uuid;
BEGIN
  SELECT u.raw_user_meta_data, u.email INTO v_meta, v_email
  FROM auth.users u WHERE u.id = v_uid;

  v_phone := v_meta->>'phone';
  v_full  := COALESCE(v_meta->>'full_name', 'User');

  -- Create profile if missing
  INSERT INTO public.profiles (id, full_name, email, phone, role, created_at, updated_at)
  SELECT v_uid, v_full, v_email, v_phone, 'organization', now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid);

  -- Ensure an organization exists and link it
  SELECT id INTO v_orgid FROM public.organizations WHERE owner_id = v_uid LIMIT 1;
  IF v_orgid IS NULL THEN
    INSERT INTO public.organizations (owner_id, name, email, phone, verification_status)
    VALUES (v_uid, COALESCE(v_meta->>'organization_name', 'My Organization'), v_email, v_phone, 'pending')
    RETURNING id INTO v_orgid;
  END IF;

  UPDATE public.profiles SET organization_id = v_orgid WHERE id = v_uid;

  RAISE NOTICE 'Backfill done for %, org %', v_email, v_orgid;
END$$;

-- 6) Verify the user/profile/org now exist and are linked
SELECT u.id, u.email, p.id AS profile_id, p.role, p.organization_id, o.name AS org_name, o.verification_status
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
LEFT JOIN public.organizations o ON o.owner_id = u.id
WHERE u.id = '0e13b8ee-8e56-4845-b877-b137b9f16d5d';
