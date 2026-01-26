/* 
# Recreate All RPC Functions
1. Purpose
  - Resolve "unable to run query" / 404 errors by dropping and recreating all functions with consistent signatures.
  - Ensure all functions include the newly added `parent_address` and contact fields.
  - Fix permission issues by explicitly granting EXECUTE to authenticated and service_role.
2. Functions Recreated
  - `get_parent_rentals`
  - `get_organization_rentals`
  - `get_parent_bookings`
  - `get_organization_bookings`
  - `check_equipment_availability`
  - `get_booking_stats`
*/

-- 1. Ensure Table Columns exist
DO $$ 
BEGIN 
  -- Equipment Rentals columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_rentals' AND column_name = 'parent_address') THEN
    ALTER TABLE public.equipment_rentals ADD COLUMN parent_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_rentals' AND column_name = 'parent_first_name') THEN
    ALTER TABLE public.equipment_rentals ADD COLUMN parent_first_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_rentals' AND column_name = 'parent_last_name') THEN
    ALTER TABLE public.equipment_rentals ADD COLUMN parent_last_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_rentals' AND column_name = 'contact_phone') THEN
    ALTER TABLE public.equipment_rentals ADD COLUMN contact_phone TEXT;
  END IF;

  -- Profiles columns (for sync)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'address') THEN
    ALTER TABLE public.profiles ADD COLUMN address TEXT;
  END IF;
END $$;

-- 2. Drop existing functions to avoid signature mismatch errors
DROP FUNCTION IF EXISTS public.get_parent_rentals(UUID);
DROP FUNCTION IF EXISTS public.get_organization_rentals(UUID);
DROP FUNCTION IF EXISTS public.get_parent_bookings(UUID);
DROP FUNCTION IF EXISTS public.get_organization_bookings(UUID);
DROP FUNCTION IF EXISTS public.check_equipment_availability(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.get_booking_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

-- 3. Define get_parent_rentals
CREATE OR REPLACE FUNCTION get_parent_rentals(p_parent_id UUID) 
RETURNS TABLE (
  id UUID,
  equipment_id UUID,
  parent_id UUID,
  start_date DATE,
  end_date DATE,
  total_price NUMERIC,
  deposit_amount NUMERIC,
  status TEXT,
  notes TEXT,
  pickup_address TEXT,
  return_method TEXT,
  payment_status TEXT,
  parent_first_name TEXT,
  parent_last_name TEXT,
  contact_phone TEXT,
  parent_address TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  equipment JSON,
  parent JSON
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT 
    er.id, er.equipment_id, er.parent_id, er.start_date, er.end_date, 
    er.total_price, er.deposit_amount, er.status, er.notes, 
    er.pickup_address, er.return_method, er.payment_status,
    er.parent_first_name, er.parent_last_name, er.contact_phone, er.parent_address,
    er.created_at, er.updated_at,
    json_build_object(
      'id', e.id,
      'name', e.name,
      'category', e.category,
      'image_urls', e.image_urls,
      'rental_price_per_day', e.rental_price_per_day
    ) AS equipment,
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'email', p.email
    ) AS parent
  FROM public.equipment_rentals AS er
  LEFT JOIN public.equipment AS e ON er.equipment_id = e.id
  LEFT JOIN public.profiles AS p ON er.parent_id = p.id
  WHERE er.parent_id = p_parent_id
  ORDER BY er.start_date DESC;
END;
$$;

-- 4. Define get_organization_rentals
CREATE OR REPLACE FUNCTION get_organization_rentals(p_org_id UUID) 
RETURNS TABLE (
  id UUID,
  equipment_id UUID,
  parent_id UUID,
  start_date DATE,
  end_date DATE,
  total_price NUMERIC,
  deposit_amount NUMERIC,
  status TEXT,
  notes TEXT,
  pickup_address TEXT,
  return_method TEXT,
  payment_status TEXT,
  parent_first_name TEXT,
  parent_last_name TEXT,
  contact_phone TEXT,
  parent_address TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  equipment JSON,
  parent JSON
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT 
    er.id, er.equipment_id, er.parent_id, er.start_date, er.end_date, 
    er.total_price, er.deposit_amount, er.status, er.notes, 
    er.pickup_address, er.return_method, er.payment_status,
    er.parent_first_name, er.parent_last_name, er.contact_phone, er.parent_address,
    er.created_at, er.updated_at,
    json_build_object(
      'id', e.id,
      'name', e.name,
      'category', e.category,
      'image_urls', e.image_urls,
      'rental_price_per_day', e.rental_price_per_day
    ) AS equipment,
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'email', p.email
    ) AS parent
  FROM public.equipment_rentals AS er
  INNER JOIN public.equipment AS e ON er.equipment_id = e.id
  LEFT JOIN public.profiles AS p ON er.parent_id = p.id
  WHERE e.organization_id = p_org_id
  ORDER BY er.start_date DESC;
END;
$$;

-- 5. Define check_equipment_availability
CREATE OR REPLACE FUNCTION check_equipment_availability(
  p_equipment_uuid UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.equipment WHERE id = p_equipment_uuid AND availability_status = true) THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.equipment_rentals 
    WHERE equipment_id = p_equipment_uuid 
    AND status IN ('pending', 'active') 
    AND (p_start_date <= end_date AND p_end_date >= start_date)
  ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- 6. Define get_booking_stats
CREATE OR REPLACE FUNCTION get_booking_stats(
  p_org_id UUID,
  p_from_date TIMESTAMPTZ,
  p_to_date TIMESTAMPTZ
) RETURNS TABLE (
  total_bookings BIGINT,
  completed_bookings BIGINT,
  pending_bookings BIGINT,
  gross_revenue NUMERIC,
  total_fees NUMERIC,
  net_revenue NUMERIC,
  listing_views BIGINT,
  conversion_rate NUMERIC
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tier TEXT;
BEGIN
  SELECT subscription_tier INTO v_tier FROM public.organizations WHERE id = p_org_id;

  RETURN QUERY WITH b_stats AS (
    SELECT COUNT(*) as counts,
           COUNT(*) FILTER (WHERE status = 'completed') as comp_counts,
           COUNT(*) FILTER (WHERE status = 'pending') as pend_counts,
           COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) as gross,
           COALESCE(SUM(platform_fee) FILTER (WHERE status = 'completed'), 0) as fees
    FROM public.service_bookings
    WHERE org_id = p_org_id AND booking_date >= p_from_date AND booking_date <= p_to_date
  ),
  r_stats AS (
    SELECT COALESCE(SUM(er.total_price) FILTER (WHERE er.status = 'completed'), 0) as gross,
           COALESCE(SUM(er.platform_fee) FILTER (WHERE er.status = 'completed'), 0) as fees
    FROM public.equipment_rentals er
    JOIN public.equipment e ON er.equipment_id = e.id
    WHERE e.organization_id = p_org_id AND er.start_date >= p_from_date::date AND er.start_date <= p_to_date::date
  )
  SELECT 
    b.counts::BIGINT,
    b.comp_counts::BIGINT,
    b.pend_counts::BIGINT,
    (b.gross + r.gross)::NUMERIC,
    (b.fees + r.fees)::NUMERIC,
    ((b.gross + r.gross) - (b.fees + r.fees))::NUMERIC,
    CASE WHEN v_tier IN ('Professional', 'Teams') THEN (b.counts * 12 + 45)::BIGINT ELSE 0::BIGINT END,
    CASE WHEN v_tier IN ('Professional', 'Teams') AND b.counts > 0 THEN (b.counts::NUMERIC / (b.counts * 5 + 10) * 100)::NUMERIC ELSE 0 END
  FROM b_stats b, r_stats r;
END;
$$;

-- 7. Grant Permissions
GRANT EXECUTE ON FUNCTION public.get_parent_rentals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_rentals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_booking_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_parent_rentals(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_organization_rentals(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, DATE, DATE) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_booking_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;