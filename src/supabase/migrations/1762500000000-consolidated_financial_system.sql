/* # Consolidated Financial & Fee System
1. Changes
- Adds `subscription_tier` to organizations if missing.
- Adds `platform_fee` columns to bookings and rentals.
- Drops and recreates `get_booking_stats` with full financial metrics.
- Grants execute permissions to the authenticated role.

2. Rationale
Ensures the database schema and RPC functions match the application's reporting requirements exactly.
*/

-- 1. Table Schema Updates
DO $$ 
BEGIN 
    -- Add subscription_tier to organizations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'subscription_tier') THEN
        ALTER TABLE public.organizations ADD COLUMN subscription_tier TEXT DEFAULT 'Free' CHECK (subscription_tier IN ('Free', 'Professional', 'Teams'));
    END IF;

    -- Add platform_fee to service_bookings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'service_bookings' AND column_name = 'platform_fee') THEN
        ALTER TABLE public.service_bookings ADD COLUMN platform_fee NUMERIC(10,2) DEFAULT 0;
    END IF;

    -- Add platform_fee to equipment_rentals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_rentals' AND column_name = 'platform_fee') THEN
        ALTER TABLE public.equipment_rentals ADD COLUMN platform_fee NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

-- 2. Financial Reporting Function
-- We drop first to avoid "return type mismatch" errors if the schema changed
DROP FUNCTION IF EXISTS get_booking_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION get_booking_stats(
  org_id UUID,
  from_date TIMESTAMPTZ,
  to_date TIMESTAMPTZ
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
  WITH booking_stats AS (
    SELECT 
      COUNT(*) as cnt,
      COUNT(*) FILTER (WHERE status = 'completed') as comp_cnt,
      COUNT(*) FILTER (WHERE status = 'pending') as pend_cnt,
      COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) as gross,
      COALESCE(SUM(platform_fee) FILTER (WHERE status = 'completed'), 0) as fees
    FROM public.service_bookings
    WHERE public.service_bookings.org_id = get_booking_stats.org_id
    AND public.service_bookings.booking_date >= get_booking_stats.from_date
    AND public.service_bookings.booking_date <= get_booking_stats.to_date
  ),
  rental_stats AS (
    SELECT 
      COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) as gross,
      COALESCE(SUM(platform_fee) FILTER (WHERE status = 'completed'), 0) as fees
    FROM public.equipment_rentals
    JOIN public.equipment ON public.equipment_rentals.equipment_id = public.equipment.id
    WHERE public.equipment.organization_id = get_booking_stats.org_id
    AND public.equipment_rentals.start_date >= get_booking_stats.from_date::date
    AND public.equipment_rentals.start_date <= get_booking_stats.to_date::date
  )
  SELECT 
    b.cnt::BIGINT,
    b.comp_cnt::BIGINT,
    b.pend_cnt::BIGINT,
    (b.gross + r.gross)::NUMERIC as gross_revenue,
    (b.fees + r.fees)::NUMERIC as total_fees,
    ((b.gross + r.gross) - (b.fees + r.fees))::NUMERIC as net_revenue
  FROM booking_stats b, rental_stats r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Permissions
GRANT EXECUTE ON FUNCTION public.get_booking_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;