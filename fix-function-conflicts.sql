-- Fix PostgreSQL function overload conflicts
-- Run this in your Supabase SQL Editor

-- Drop all conflicting functions to avoid signature mismatch errors
DROP FUNCTION IF EXISTS public.get_parent_bookings(UUID);
DROP FUNCTION IF EXISTS public.get_organization_bookings(UUID);
DROP FUNCTION IF EXISTS public.get_parent_rentals(UUID);
DROP FUNCTION IF EXISTS public.get_organization_rentals(UUID);
DROP FUNCTION IF EXISTS public.check_equipment_availability(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.check_equipment_availability(UUID, DATE, DATE);
DROP FUNCTION IF EXISTS public.check_equipment_availability(UUID, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.get_booking_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

-- Recreate the functions with consistent signatures
-- 1. get_parent_bookings
CREATE OR REPLACE FUNCTION get_parent_bookings(p_parent_id UUID)
RETURNS TABLE (
  id UUID, org_id UUID, service_id UUID, parent_id UUID, technician_id UUID, 
  booking_date TIMESTAMPTZ, status TEXT, notes TEXT, total_price NUMERIC, 
  payment_status TEXT, parent_first_name TEXT, parent_last_name TEXT, child_name TEXT, 
  child_age INTEGER, vehicle_info TEXT, service_address TEXT, contact_phone TEXT, 
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  service JSON, parent JSON, technician JSON
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    sb.id, sb.org_id, sb.service_id, sb.parent_id, sb.technician_id, 
    sb.booking_date, sb.status, sb.notes, sb.total_price, sb.payment_status, 
    sb.parent_first_name, sb.parent_last_name, sb.child_name, sb.child_age, 
    sb.vehicle_info, sb.service_address, sb.contact_phone, sb.created_at, sb.updated_at,
    json_build_object('id', s.id, 'name', s.name) AS service,
    json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email) AS parent,
    json_build_object('id', tm.id, 'profile', json_build_object('full_name', tp.full_name)) AS technician
  FROM
    public.service_bookings AS sb
  LEFT JOIN public.services AS s ON sb.service_id = s.id
  LEFT JOIN public.profiles AS p ON sb.parent_id = p.id
  LEFT JOIN public.team_members AS tm ON sb.technician_id = tm.id
  LEFT JOIN public.profiles AS tp ON tm.user_id = tp.id
  WHERE sb.parent_id = p_parent_id
  ORDER BY sb.booking_date DESC;
END;
$$;

-- 2. get_organization_bookings
CREATE OR REPLACE FUNCTION get_organization_bookings(p_org_id UUID)
RETURNS TABLE (
  id UUID, org_id UUID, service_id UUID, parent_id UUID, technician_id UUID, 
  booking_date TIMESTAMPTZ, status TEXT, notes TEXT, total_price NUMERIC, 
  payment_status TEXT, parent_first_name TEXT, parent_last_name TEXT, child_name TEXT, 
  child_age INTEGER, vehicle_info TEXT, service_address TEXT, contact_phone TEXT, 
  created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  service JSON, parent JSON, technician JSON
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    sb.id, sb.org_id, sb.service_id, sb.parent_id, sb.technician_id, 
    sb.booking_date, sb.status, sb.notes, sb.total_price, sb.payment_status, 
    sb.parent_first_name, sb.parent_last_name, sb.child_name, sb.child_age, 
    sb.vehicle_info, sb.service_address, sb.contact_phone, sb.created_at, sb.updated_at,
    json_build_object('id', s.id, 'name', s.name) AS service,
    json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email) AS parent,
    json_build_object('id', tm.id, 'profile', json_build_object('full_name', tp.full_name)) AS technician
  FROM
    public.service_bookings AS sb
  LEFT JOIN public.services AS s ON sb.service_id = s.id
  LEFT JOIN public.profiles AS p ON sb.parent_id = p.id
  LEFT JOIN public.team_members AS tm ON sb.technician_id = tm.id
  LEFT JOIN public.profiles AS tp ON tm.user_id = tp.id
  WHERE sb.org_id = p_org_id
  ORDER BY sb.booking_date DESC;
END;
$$;

-- 3. get_parent_rentals
CREATE OR REPLACE FUNCTION get_parent_rentals(p_parent_id UUID)
RETURNS TABLE (
  id UUID, equipment_id UUID, parent_id UUID, start_date DATE, end_date DATE, 
  total_price NUMERIC, deposit_amount NUMERIC, status TEXT, notes TEXT, 
  child_name TEXT, child_age INTEGER, pickup_address TEXT, return_method TEXT, 
  payment_status TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  equipment JSON, parent JSON
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    er.id, er.equipment_id, er.parent_id, er.start_date, er.end_date, 
    er.total_price, er.deposit_amount, er.status, er.notes, 
    er.child_name, er.child_age, er.pickup_address, er.return_method, er.payment_status, 
    er.created_at, er.updated_at,
    json_build_object('id', e.id, 'name', e.name, 'category', e.category, 'image_urls', e.image_urls, 'rental_price_per_day', e.rental_price_per_day) AS equipment,
    json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email) AS parent
  FROM
    public.equipment_rentals AS er
  LEFT JOIN public.equipment AS e ON er.equipment_id = e.id
  LEFT JOIN public.profiles AS p ON er.parent_id = p.id
  WHERE er.parent_id = p_parent_id
  ORDER BY er.start_date DESC;
END;
$$;

-- 4. get_organization_rentals
CREATE OR REPLACE FUNCTION get_organization_rentals(p_org_id UUID)
RETURNS TABLE (
  id UUID, equipment_id UUID, parent_id UUID, start_date DATE, end_date DATE, 
  total_price NUMERIC, deposit_amount NUMERIC, status TEXT, notes TEXT, 
  child_name TEXT, child_age INTEGER, pickup_address TEXT, return_method TEXT, 
  payment_status TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  equipment JSON, parent JSON
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    er.id, er.equipment_id, er.parent_id, er.start_date, er.end_date, 
    er.total_price, er.deposit_amount, er.status, er.notes, 
    er.child_name, er.child_age, er.pickup_address, er.return_method, er.payment_status, 
    er.created_at, er.updated_at,
    json_build_object('id', e.id, 'name', e.name, 'category', e.category, 'image_urls', e.image_urls, 'rental_price_per_day', e.rental_price_per_day) AS equipment,
    json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email) AS parent
  FROM
    public.equipment_rentals AS er
  INNER JOIN public.equipment AS e ON er.equipment_id = e.id
  LEFT JOIN public.profiles AS p ON er.parent_id = p.id
  WHERE e.organization_id = p_org_id
  ORDER BY er.start_date DESC;
END;
$$;

-- 5. check_equipment_availability
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_parent_bookings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_bookings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_rentals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_rentals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, DATE, DATE) TO authenticated;

SELECT 'Function conflicts resolved successfully!' as message;
