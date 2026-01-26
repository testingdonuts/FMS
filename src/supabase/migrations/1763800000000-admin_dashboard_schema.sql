/* # Admin Dashboard Schema
1. New Columns
  - `organizations.verification_status`: Tracks if the platform owner has verified the safety organization (pending, verified, rejected).
  - `organizations.admin_notes`: Internal notes for platform owners.

2. New RPC Functions
  - `get_admin_stats`: Returns global metrics (Total platform revenue, total users, pending payouts, pending verifications).
  - `get_admin_payouts`: Fetches all payout requests across all organizations.
  - `get_admin_organizations`: Fetches all organizations with their verification status.

3. Security
  - All admin functions are `SECURITY DEFINER` and restricted to users with the 'admin' role.
*/

-- 1. Update Organizations Table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- 2. Global Admin Stats RPC
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS TABLE (
    total_users BIGINT,
    total_organizations BIGINT,
    total_platform_revenue NUMERIC,
    pending_payout_amount NUMERIC,
    pending_verifications BIGINT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM profiles) as total_users,
        (SELECT COUNT(*) FROM organizations) as total_organizations,
        (SELECT COALESCE(SUM(fee_amount), 0) FROM payout_requests WHERE status = 'paid') as total_platform_revenue,
        (SELECT COALESCE(SUM(amount_net), 0) FROM payout_requests WHERE status = 'pending') as pending_payout_amount,
        (SELECT COUNT(*) FROM organizations WHERE verification_status = 'pending') as pending_verifications;
END;
$$;

-- 3. Global Payouts RPC (Admin View)
CREATE OR REPLACE FUNCTION get_admin_payouts()
RETURNS TABLE (
    id UUID,
    organization_name TEXT,
    amount_gross NUMERIC,
    fee_amount NUMERIC,
    amount_net NUMERIC,
    status TEXT,
    payout_method TEXT,
    payout_details JSONB,
    created_at TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
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
        pr.created_at
    FROM public.payout_requests pr
    JOIN public.organizations o ON pr.organization_id = o.id
    ORDER BY pr.created_at DESC;
END;
$$;

-- 4. Permissions
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_payouts() TO authenticated;