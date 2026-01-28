-- ================================================================
-- FIX: Admin Dashboard Stats RPC Function
-- Run this in Supabase SQL Editor to fix the Quick Stats
-- ================================================================

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_admin_stats();

-- Create improved function with all required fields
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
    total_users BIGINT,
    total_organizations BIGINT,
    total_orgs BIGINT,
    verified_organizations BIGINT,
    verified_orgs BIGINT,
    total_bookings BIGINT,
    active_rentals BIGINT,
    total_platform_revenue NUMERIC,
    pending_payout_amount NUMERIC,
    pending_verifications BIGINT,
    pending_payouts BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.profiles)::BIGINT as total_users,
        (SELECT COUNT(*) FROM public.organizations)::BIGINT as total_organizations,
        (SELECT COUNT(*) FROM public.organizations)::BIGINT as total_orgs,
        (SELECT COUNT(*) FROM public.organizations WHERE verification_status = 'verified')::BIGINT as verified_organizations,
        (SELECT COUNT(*) FROM public.organizations WHERE verification_status = 'verified')::BIGINT as verified_orgs,
        (SELECT COUNT(*) FROM public.service_bookings)::BIGINT as total_bookings,
        (SELECT COUNT(*) FROM public.equipment_rentals WHERE status IN ('active', 'confirmed'))::BIGINT as active_rentals,
        COALESCE((SELECT SUM(fee_amount) FROM public.payout_requests WHERE status = 'paid'), 0)::NUMERIC as total_platform_revenue,
        COALESCE((SELECT SUM(amount_net) FROM public.payout_requests WHERE status = 'pending'), 0)::NUMERIC as pending_payout_amount,
        (SELECT COUNT(*) FROM public.organizations WHERE verification_status = 'pending')::BIGINT as pending_verifications,
        (SELECT COUNT(*) FROM public.payout_requests WHERE status = 'pending')::BIGINT as pending_payouts;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_admin_stats() TO authenticated;

-- Test the function
SELECT * FROM public.get_admin_stats();
