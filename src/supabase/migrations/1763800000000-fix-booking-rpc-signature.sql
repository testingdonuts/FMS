/*
# Fix Booking RPC Function Signature Mismatch

This migration addresses a "structure of query does not match function result type" error that occurs when fetching bookings.

## 1. Problem
The `get_organization_bookings` and `get_parent_bookings` RPC functions have a mismatch between their declared return type and the actual columns being selected in the query. This commonly happens when:
- A column was added to the `service_bookings` table after the function was created
- The function's return signature wasn't updated to match

## 2. Solution
This migration drops and recreates both booking RPC functions with the **complete and accurate** return signature that matches the current `service_bookings` table schema, including:
- `platform_fee` column (added in fee tracking migration)
- All contact/parent information fields
- Proper JSON object structures for joined data

## 3. Impact
This resolves the query structure error and allows both parents and organizations to successfully fetch their booking data.
*/

-- Drop existing functions to avoid signature conflicts
DROP FUNCTION IF EXISTS public.get_organization_bookings(UUID);
DROP FUNCTION IF EXISTS public.get_parent_bookings(UUID);

-- Function to get bookings for a specific organization
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
  platform_fee NUMERIC,
  payment_status TEXT,
  parent_first_name TEXT,
  parent_last_name TEXT,
  child_name TEXT,
  child_age INTEGER,
  vehicle_info TEXT,
  service_address TEXT,
  contact_phone TEXT,
  location_id UUID,
  reminder_sent BOOLEAN,
  last_reminder_at TIMESTAMPTZ,
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
    COALESCE(sb.platform_fee, 0) AS platform_fee,
    sb.payment_status,
    sb.parent_first_name,
    sb.parent_last_name,
    sb.child_name,
    sb.child_age,
    sb.vehicle_info,
    sb.service_address,
    sb.contact_phone,
    sb.location_id,
    COALESCE(sb.reminder_sent, false) AS reminder_sent,
    sb.last_reminder_at,
    sb.created_at,
    sb.updated_at,
    -- service object
    json_build_object(
      'id', s.id,
      'name', s.name,
      'description', s.description,
      'price', s.price
    ) AS service,
    -- parent (customer) object
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'email', p.email,
      'phone', p.phone
    ) AS parent,
    -- technician object with nested profile
    json_build_object(
      'id', tm.id,
      'role', tm.role,
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

-- Function to get bookings for a specific parent
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
  platform_fee NUMERIC,
  payment_status TEXT,
  parent_first_name TEXT,
  parent_last_name TEXT,
  child_name TEXT,
  child_age INTEGER,
  vehicle_info TEXT,
  service_address TEXT,
  contact_phone TEXT,
  location_id UUID,
  reminder_sent BOOLEAN,
  last_reminder_at TIMESTAMPTZ,
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
    COALESCE(sb.platform_fee, 0) AS platform_fee,
    sb.payment_status,
    sb.parent_first_name,
    sb.parent_last_name,
    sb.child_name,
    sb.child_age,
    sb.vehicle_info,
    sb.service_address,
    sb.contact_phone,
    sb.location_id,
    COALESCE(sb.reminder_sent, false) AS reminder_sent,
    sb.last_reminder_at,
    sb.created_at,
    sb.updated_at,
    -- service object
    json_build_object(
      'id', s.id,
      'name', s.name,
      'description', s.description,
      'price', s.price
    ) AS service,
    -- parent (customer) object
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'email', p.email,
      'phone', p.phone
    ) AS parent,
    -- technician object with nested profile
    json_build_object(
      'id', tm.id,
      'role', tm.role,
      'profile', json_build_object(
        'full_name', tp.full_name
      )
    ) AS technician
  FROM public.service_bookings AS sb
  LEFT JOIN public.services AS s ON sb.service_id = s.id
  LEFT JOIN public.profiles AS p ON sb.parent_id = p.id
  LEFT JOIN public.team_members AS tm ON sb.technician_id = tm.id
  LEFT JOIN public.profiles AS tp ON tm.user_id = tp.id
  WHERE sb.parent_id = p_parent_id
  ORDER BY sb.booking_date DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_organization_bookings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_bookings(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_parent_bookings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_bookings(UUID) TO service_role;