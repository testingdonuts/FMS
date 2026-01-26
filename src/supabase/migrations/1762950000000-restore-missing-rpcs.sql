/* 
# Restore Missing Booking RPC Functions

1. **Problem**: 
   - The functions `get_organization_bookings` and `get_parent_bookings` were dropped in a previous migration (`1762860000000`) but were inadvertently omitted from the re-creation steps. 
   - This causes the Booking Management dashboard to fail (returning 404/Function not found) and display "No bookings match your criteria" because the API call returns null data.

2. **Solution**: 
   - This migration properly defines both functions with the correct return schema, including all necessary fields like `parent_first_name`, `contact_phone`, etc.
   - It also grants the necessary `EXECUTE` permissions to authenticated users.

3. **Functions Restored**:
   - `get_organization_bookings(p_org_id UUID)`
   - `get_parent_bookings(p_parent_id UUID)`
*/

-- 1. Function to get bookings for a specific organization
CREATE OR REPLACE FUNCTION get_organization_bookings(p_org_id UUID)
RETURNS TABLE (
  id UUID,
  org_id UUID,
  service_id UUID,
  parent_id UUID,
  technician_id UUID,
  booking_date TIMESTAMPTZ,
  status TEXT,
  notes TEXT,
  total_price NUMERIC,
  payment_status TEXT,
  parent_first_name TEXT,
  parent_last_name TEXT,
  child_name TEXT,
  child_age INTEGER,
  vehicle_info TEXT,
  service_address TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  service JSON,
  parent JSON,
  technician JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sb.id,
    sb.org_id,
    sb.service_id,
    sb.parent_id,
    sb.technician_id,
    sb.booking_date,
    sb.status,
    sb.notes,
    sb.total_price,
    sb.payment_status,
    sb.parent_first_name,
    sb.parent_last_name,
    sb.child_name,
    sb.child_age,
    sb.vehicle_info,
    sb.service_address,
    sb.contact_phone,
    sb.created_at,
    sb.updated_at,
    -- service object
    json_build_object(
      'id', s.id,
      'name', s.name
    ) AS service,
    -- parent (customer) object
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'email', p.email
    ) AS parent,
    -- technician object with nested profile
    json_build_object(
      'id', tm.id,
      'profile', json_build_object(
        'full_name', tp.full_name
      )
    ) AS technician
  FROM public.service_bookings AS sb
  LEFT JOIN public.services AS s ON sb.service_id = s.id
  LEFT JOIN public.profiles AS p ON sb.parent_id = p.id
  LEFT JOIN public.team_members AS tm ON sb.technician_id = tm.id
  LEFT JOIN public.profiles AS tp ON tm.user_id = tp.id
  WHERE sb.org_id = p_org_id
  ORDER BY sb.booking_date DESC;
END;
$$;

-- 2. Function to get bookings for a specific parent
CREATE OR REPLACE FUNCTION get_parent_bookings(p_parent_id UUID)
RETURNS TABLE (
  id UUID,
  org_id UUID,
  service_id UUID,
  parent_id UUID,
  technician_id UUID,
  booking_date TIMESTAMPTZ,
  status TEXT,
  notes TEXT,
  total_price NUMERIC,
  payment_status TEXT,
  parent_first_name TEXT,
  parent_last_name TEXT,
  child_name TEXT,
  child_age INTEGER,
  vehicle_info TEXT,
  service_address TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  service JSON,
  parent JSON,
  technician JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sb.id,
    sb.org_id,
    sb.service_id,
    sb.parent_id,
    sb.technician_id,
    sb.booking_date,
    sb.status,
    sb.notes,
    sb.total_price,
    sb.payment_status,
    sb.parent_first_name,
    sb.parent_last_name,
    sb.child_name,
    sb.child_age,
    sb.vehicle_info,
    sb.service_address,
    sb.contact_phone,
    sb.created_at,
    sb.updated_at,
    json_build_object('id', s.id, 'name', s.name) AS service,
    json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email) AS parent,
    json_build_object('id', tm.id, 'profile', json_build_object('full_name', tp.full_name)) AS technician
  FROM public.service_bookings AS sb
  LEFT JOIN public.services AS s ON sb.service_id = s.id
  LEFT JOIN public.profiles AS p ON sb.parent_id = p.id
  LEFT JOIN public.team_members AS tm ON sb.technician_id = tm.id
  LEFT JOIN public.profiles AS tp ON tm.user_id = tp.id
  WHERE sb.parent_id = p_parent_id
  ORDER BY sb.booking_date DESC;
END;
$$;

-- 3. Grant Permissions
GRANT EXECUTE ON FUNCTION public.get_organization_bookings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_bookings(UUID) TO service_role;

GRANT EXECUTE ON FUNCTION public.get_parent_bookings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_bookings(UUID) TO service_role;