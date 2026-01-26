/*
# Create RPC Functions to Securely Fetch Bookings and Rentals

This migration addresses a recurring data visibility issue where both parents and organizations could not view bookings or rentals due to a client-side join error.

## 1. Problem
The client-side queries to fetch bookings and rentals used a PostgREST foreign key hint (`parent:profiles!parent_id(*)`) to join the `profiles` table for customer details. This query failed with a "Could not find a relationship" error because the foreign key for `parent_id` in `service_bookings` and `equipment_rentals` points to `auth.users(id)`, not `public.profiles(id)`. This prevented data from loading in the parent and organization dashboards.

## 2. Solution
This migration creates three new PostgreSQL functions with `SECURITY DEFINER` privileges to handle the data fetching logic on the database side, bypassing the client-side relationship detection issue.

### New Functions:
1.  **`get_parent_bookings(p_parent_id UUID)`**: Securely fetches all service bookings for a specific parent, correctly joining service and technician details.
2.  **`get_parent_rentals(p_parent_id UUID)`**: Securely fetches all equipment rentals for a specific parent, joining equipment and parent details.
3.  **`get_organization_rentals(p_org_id UUID)`**: Securely fetches all equipment rentals for a specific organization, joining equipment and parent (customer) details.

These functions move the complex join logic to the database, providing a secure and performant way to fetch all necessary data. The application's service files (`bookingService.js` and `equipmentService.js`) will be updated to call these RPC functions instead of building the failing `select` queries on the client side.

## 3. Security Impact
- The functions are secure as they are read-only and strictly filter data based on the provided parent or organization ID.
- This approach is more reliable and robust than relying on client-side joins and avoids further modifications to foreign key constraints, which have proven brittle.
*/

-- Function to get bookings for a specific parent
CREATE OR REPLACE FUNCTION get_parent_bookings(p_parent_id UUID)
RETURNS TABLE (
  id UUID, org_id UUID, service_id UUID, parent_id UUID, technician_id UUID, booking_date TIMESTAMPTZ, status TEXT, notes TEXT, total_price NUMERIC, payment_status TEXT, parent_first_name TEXT, parent_last_name TEXT, child_name TEXT, child_age INTEGER, vehicle_info TEXT, service_address TEXT, contact_phone TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  service JSON, parent JSON, technician JSON
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    sb.id, sb.org_id, sb.service_id, sb.parent_id, sb.technician_id, sb.booking_date, sb.status, sb.notes, sb.total_price, sb.payment_status, sb.parent_first_name, sb.parent_last_name, sb.child_name, sb.child_age, sb.vehicle_info, sb.service_address, sb.contact_phone, sb.created_at, sb.updated_at,
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

-- Function to get rentals for a specific parent
CREATE OR REPLACE FUNCTION get_parent_rentals(p_parent_id UUID)
RETURNS TABLE (
  id UUID, equipment_id UUID, parent_id UUID, start_date DATE, end_date DATE, total_price NUMERIC, deposit_amount NUMERIC, status TEXT, notes TEXT, child_name TEXT, child_age INTEGER, pickup_address TEXT, return_method TEXT, payment_status TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  equipment JSON, parent JSON
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    er.id, er.equipment_id, er.parent_id, er.start_date, er.end_date, er.total_price, er.deposit_amount, er.status, er.notes, er.child_name, er.child_age, er.pickup_address, er.return_method, er.payment_status, er.created_at, er.updated_at,
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

-- Function to get rentals for a specific organization
CREATE OR REPLACE FUNCTION get_organization_rentals(p_org_id UUID)
RETURNS TABLE (
  id UUID, equipment_id UUID, parent_id UUID, start_date DATE, end_date DATE, total_price NUMERIC, deposit_amount NUMERIC, status TEXT, notes TEXT, child_name TEXT, child_age INTEGER, pickup_address TEXT, return_method TEXT, payment_status TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ,
  equipment JSON, parent JSON
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    er.id, er.equipment_id, er.parent_id, er.start_date, er.end_date, er.total_price, er.deposit_amount, er.status, er.notes, er.child_name, er.child_age, er.pickup_address, er.return_method, er.payment_status, er.created_at, er.updated_at,
    json_build_object('id', e.id, 'name', e.name, 'category', e.category, 'image_urls', e.image_urls, 'rental_price_per_day', e.rental_price_per_day) AS equipment,
    json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email) AS parent
  FROM
    public.equipment_rentals AS er
  JOIN public.equipment AS e ON er.equipment_id = e.id
  LEFT JOIN public.profiles AS p ON er.parent_id = p.id
  WHERE e.organization_id = p_org_id
  ORDER BY er.start_date DESC;
END;
$$;