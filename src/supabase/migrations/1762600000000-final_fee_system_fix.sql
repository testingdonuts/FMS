/* # Final Financial & Fee System Alignment
1. Changes
- Ensures `subscription_tier` column exists and is populated.
- Ensures `platform_fee` columns exist in bookings and rentals.
- Recreates `get_booking_stats` with explicit schema references to prevent ambiguity.
- Grants execute permissions to all relevant roles.

2. Rationale
Matches the frontend payload requirements and ensures historical accuracy in reporting.
*/

-- 1. Table Schema Integrity
DO $$ 
BEGIN 
    -- Organization Tier
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'subscription_tier') THEN
        ALTER TABLE public.organizations ADD COLUMN subscription_tier TEXT DEFAULT 'Free' CHECK (subscription_tier IN ('Free', 'Professional', 'Teams'));
    END IF;

    -- Booking Fees
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'platform_fee') THEN
        ALTER TABLE public.service_bookings ADD COLUMN platform_fee NUMERIC(10,2) DEFAULT 0;
    END IF;

    -- Rental Fees
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_rentals' AND column_name = 'platform_fee') THEN
        ALTER TABLE public.equipment_rentals ADD COLUMN platform_fee NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

-- 2. Populate missing tiers for existing orgs
UPDATE public.organizations SET subscription_tier = 'Free' WHERE subscription_tier IS NULL;

-- 3. Consolidated Statistics Function
DROP FUNCTION IF EXISTS public.get_booking_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION public.get_booking_stats(
  p_org_id UUID,
  p_from_date TIMESTAMPTZ,
  p_to_date TIMESTAMPTZ
) RETURNS TABLE (
  total_bookings BIGINT,
  completed_bookings BIGINT,
  pending_bookings BIGINT,
  gross_revenue NUMERIC,
  total_fees NUMERIC,
  net_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH b_stats AS (
    SELECT 
      COUNT(*) as counts,
      COUNT(*) FILTER (WHERE status = 'completed') as comp_counts,
      COUNT(*) FILTER (WHERE status = 'pending') as pend_counts,
      COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) as gross,
      COALESCE(SUM(platform_fee) FILTER (WHERE status = 'completed'), 0) as fees
    FROM public.service_bookings
    WHERE org_id = p_org_id
    AND booking_date >= p_from_date
    AND booking_date <= p_to_date
  ),
  r_stats AS (
    SELECT 
      COALESCE(SUM(er.total_price) FILTER (WHERE er.status = 'completed'), 0) as gross,
      COALESCE(SUM(er.platform_fee) FILTER (WHERE er.status = 'completed'), 0) as fees
    FROM public.equipment_rentals er
    JOIN public.equipment e ON er.equipment_id = e.id
    WHERE e.organization_id = p_org_id
    AND er.start_date >= p_from_date::date
    AND er.start_date <= p_to_date::date
  )
  SELECT 
    b.counts::BIGINT,
    b.comp_counts::BIGINT,
    b.pend_counts::BIGINT,
    (b.gross + r.gross)::NUMERIC,
    (b.fees + r.fees)::NUMERIC,
    ((b.gross + r.gross) - (b.fees + r.fees))::NUMERIC
  FROM b_stats b, r_stats r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Secure Access
GRANT EXECUTE ON FUNCTION public.get_booking_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;