/* ================================================================
   ADMIN DASHBOARD - COMPLETE IMPLEMENTATION
   
   This script sets up the complete admin dashboard functionality including:
   1. User status management (suspend/activate)
   2. Organization verification workflow
   3. Payout management system
   4. Activity logging and monitoring
   5. Platform-wide statistics and metrics
   
   IMPORTANT: This script is designed to be SAFE to run on existing databases.
   - Uses DO blocks with column existence checks
   - Won't break existing user registration flows
   - Adds DEFAULT values and updates existing records
   - Creates constraints after columns are added
   
   Run this after the main database setup.
   ================================================================ */

-- ==============================================================
-- 1. UPDATE PROFILES TABLE FOR USER MANAGEMENT
-- ==============================================================

-- Add status tracking columns to profiles
-- Using ALTER TABLE with IF NOT EXISTS to safely add columns
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
        
        -- Add constraint after column is created
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_status_check 
        CHECK (status IN ('active', 'suspended', 'inactive'));
    END IF;

    -- Add suspension_reason column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'suspension_reason'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN suspension_reason TEXT;
    END IF;

    -- Add suspended_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'suspended_at'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN suspended_at TIMESTAMPTZ;
    END IF;
END $$;

-- Update existing records to have 'active' status if null
UPDATE public.profiles 
SET status = 'active' 
WHERE status IS NULL;

-- Add index for faster admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ==============================================================
-- 2. UPDATE ORGANIZATIONS TABLE
-- ==============================================================

-- Add verification and admin management columns
DO $$ 
BEGIN
    -- Add verification_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations' 
        AND column_name = 'verification_status'
    ) THEN
        ALTER TABLE public.organizations 
        ADD COLUMN verification_status TEXT DEFAULT 'pending';
        
        -- Add constraint after column is created
        ALTER TABLE public.organizations 
        ADD CONSTRAINT organizations_verification_status_check 
        CHECK (verification_status IN ('pending', 'verified', 'rejected'));
    END IF;

    -- Add admin_notes column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations' 
        AND column_name = 'admin_notes'
    ) THEN
        ALTER TABLE public.organizations 
        ADD COLUMN admin_notes TEXT;
    END IF;

    -- Add verified_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations' 
        AND column_name = 'verified_at'
    ) THEN
        ALTER TABLE public.organizations 
        ADD COLUMN verified_at TIMESTAMPTZ;
    END IF;

    -- Add verified_by column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'organizations' 
        AND column_name = 'verified_by'
    ) THEN
        ALTER TABLE public.organizations 
        ADD COLUMN verified_by UUID REFERENCES public.profiles(id);
    END IF;
END $$;

-- Update existing records to have 'pending' status if null
UPDATE public.organizations 
SET verification_status = 'pending' 
WHERE verification_status IS NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_organizations_verification ON public.organizations(verification_status);

-- ==============================================================
-- 3. PAYOUT REQUESTS TABLE (if not exists)
-- ==============================================================

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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_payout_requests_org ON public.payout_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);

-- ==============================================================
-- 4. AUDIT LOGS TABLE FOR ACTIVITY TRACKING
-- ==============================================================

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

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- ==============================================================
-- 5. ADMIN RPC FUNCTIONS
-- ==============================================================

-- Function: Get Global Platform Stats
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
    total_users BIGINT,
    total_organizations BIGINT,
    verified_organizations BIGINT,
    total_platform_revenue NUMERIC,
    pending_payout_amount NUMERIC,
    pending_verifications BIGINT
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM profiles) as total_users,
        (SELECT COUNT(*) FROM organizations) as total_organizations,
        (SELECT COUNT(*) FROM organizations WHERE verification_status = 'verified') as verified_organizations,
        (SELECT COALESCE(SUM(fee_amount), 0) FROM payout_requests WHERE status = 'paid') as total_platform_revenue,
        (SELECT COALESCE(SUM(amount_net), 0) FROM payout_requests WHERE status = 'pending') as pending_payout_amount,
        (SELECT COUNT(*) FROM organizations WHERE verification_status = 'pending') as pending_verifications;
END;
$$;

-- Function: Get All Payouts (Admin View)
CREATE OR REPLACE FUNCTION public.get_admin_payouts()
RETURNS TABLE (
    id UUID,
    organization_name TEXT,
    amount_gross NUMERIC,
    fee_amount NUMERIC,
    amount_net NUMERIC,
    status TEXT,
    payout_method TEXT,
    payout_details JSONB,
    created_at TIMESTAMPTZ,
    processed_at TIMESTAMPTZ
) 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    RETURN QUERY
    SELECT 
        pr.id,
        o.name as organization_name,
        pr.amount_gross,
        pr.fee_amount,
        pr.amount_net,
        pr.status,
        pr.payout_method,
        pr.payout_details,
        pr.created_at,
        pr.processed_at
    FROM payout_requests pr
    JOIN organizations o ON pr.organization_id = o.id
    ORDER BY pr.created_at DESC;
END;
$$;

-- Function: Get Platform Metrics (Optional - for charts/graphs)
CREATE OR REPLACE FUNCTION public.get_platform_metrics()
RETURNS JSONB
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;

    SELECT jsonb_build_object(
        'user_growth', (
            SELECT jsonb_agg(row_to_json(t))
            FROM (
                SELECT 
                    DATE_TRUNC('month', created_at) as month,
                    COUNT(*) as count
                FROM profiles
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month DESC
                LIMIT 12
            ) t
        ),
        'revenue_by_month', (
            SELECT jsonb_agg(row_to_json(t))
            FROM (
                SELECT 
                    DATE_TRUNC('month', created_at) as month,
                    SUM(fee_amount) as revenue
                FROM payout_requests
                WHERE status = 'paid'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month DESC
                LIMIT 12
            ) t
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- ==============================================================
-- 6. AUDIT LOG TRIGGER
-- ==============================================================

-- Function to log important actions
CREATE OR REPLACE FUNCTION public.log_admin_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Log organization verification changes
    IF TG_TABLE_NAME = 'organizations' AND 
       OLD.verification_status IS DISTINCT FROM NEW.verification_status THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (
            auth.uid(),
            'organization_verification_changed',
            'organization',
            NEW.id,
            format('Status changed from %s to %s', OLD.verification_status, NEW.verification_status)
        );
    END IF;

    -- Log payout status changes
    IF TG_TABLE_NAME = 'payout_requests' AND 
       OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (
            auth.uid(),
            'payout_status_changed',
            'payout_request',
            NEW.id,
            format('Status changed from %s to %s', OLD.status, NEW.status)
        );
    END IF;

    -- Log user suspension/activation
    IF TG_TABLE_NAME = 'profiles' AND 
       OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
        VALUES (
            auth.uid(),
            'user_status_changed',
            'profile',
            NEW.id,
            format('User status changed from %s to %s', OLD.status, NEW.status)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS audit_organization_changes ON public.organizations;
CREATE TRIGGER audit_organization_changes
    AFTER UPDATE ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION log_admin_action();

DROP TRIGGER IF EXISTS audit_payout_changes ON public.payout_requests;
CREATE TRIGGER audit_payout_changes
    AFTER UPDATE ON public.payout_requests
    FOR EACH ROW
    EXECUTE FUNCTION log_admin_action();

DROP TRIGGER IF EXISTS audit_profile_changes ON public.profiles;
CREATE TRIGGER audit_profile_changes
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION log_admin_action();

-- ==============================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ==============================================================

-- Enable RLS on all tables
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- Admin can see all audit logs
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view all audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admin can manage all payout requests
DROP POLICY IF EXISTS "Admins can manage payouts" ON public.payout_requests;
CREATE POLICY "Admins can manage payouts"
    ON public.payout_requests FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Organizations can view their own payout requests
DROP POLICY IF EXISTS "Organizations can view their payouts" ON public.payout_requests;
CREATE POLICY "Organizations can view their payouts"
    ON public.payout_requests FOR SELECT
    TO authenticated
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- ==============================================================
-- 8. GRANT PERMISSIONS
-- ==============================================================

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_payouts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_metrics() TO authenticated;

-- Grant table permissions
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.payout_requests TO authenticated;

-- ==============================================================
-- 9. SAMPLE DATA (Optional - for testing)
-- ==============================================================

-- Uncomment to insert sample audit log
/*
INSERT INTO public.audit_logs (user_id, action, entity_type, details)
VALUES (
    (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1),
    'system_initialized',
    'system',
    'Admin dashboard initialized successfully'
);
*/

-- ==============================================================
-- COMPLETION MESSAGE
-- ==============================================================

DO $$
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Admin Dashboard Setup Complete!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Features enabled:';
    RAISE NOTICE '  ✓ User management (suspend/activate)';
    RAISE NOTICE '  ✓ Organization verification';
    RAISE NOTICE '  ✓ Payout request management';
    RAISE NOTICE '  ✓ Activity logging';
    RAISE NOTICE '  ✓ Platform statistics';
    RAISE NOTICE '==============================================';
END $$;
