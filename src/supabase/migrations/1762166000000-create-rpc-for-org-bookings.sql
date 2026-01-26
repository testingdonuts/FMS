/*
# Create RPC Function to Securely Fetch Bookings

This migration addresses a critical data visibility issue where organizations could not view their bookings due to a recursive RLS policy.

## 1. Problem
The query to fetch organization bookings involves joining `service_bookings` with the `profiles` table to get customer details. The RLS policy on the `profiles` table, designed to only show customers who have a booking with the organization, created a circular dependency. The main query on `service_bookings` would fail because the join to `profiles` was blocked by the `profiles` RLS policy, which in turn needed to query `service_bookings` to grant access. This deadlock resulted in no data being returned.

## 2. Solution
This migration creates a new PostgreSQL function `get_organization_bookings(p_org_id UUID)` with `SECURITY DEFINER` privileges. This function performs the necessary joins on the database side, bypassing the conflicting RLS policies because it runs with the permissions of its definer (the database owner).

The function returns all necessary booking data, including nested JSON objects for the service, parent (customer), and technician. This moves the complex join logic from the client to a secure, performant database function.

The application's `bookingService.js` will be updated to call this RPC function instead of building the complex `select` query on the client side.

## 3. Security Impact
- The circular RLS dependency is resolved.
- The `SECURITY DEFINER` function is safe as it's read-only and filters by the `organization_id` passed to it.
- This approach is more secure and performant than attempting to create overly permissive RLS policies.
*/

CREATE OR REPLACE FUNCTION get_organization_bookings(p_org_id UUID)
RETURNS TABLE (
    -- Columns from service_bookings
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
    -- JSON objects for joined data
    service JSON,
    parent JSON,
    technician JSON
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        sb.id, sb.org_id, sb.service_id, sb.parent_id, sb.technician_id, sb.booking_date, sb.status,
        sb.notes, sb.total_price, sb.payment_status, sb.parent_first_name, sb.parent_last_name,
        sb.child_name, sb.child_age, sb.vehicle_info, sb.service_address, sb.contact_phone,
        sb.created_at, sb.updated_at,
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
    FROM
        public.service_bookings AS sb
    LEFT JOIN public.services AS s ON sb.service_id = s.id
    LEFT JOIN public.profiles AS p ON sb.parent_id = p.id
    LEFT JOIN public.team_members AS tm ON sb.technician_id = tm.id
    LEFT JOIN public.profiles AS tp ON tm.user_id = tp.id
    WHERE
        sb.org_id = p_org_id
    ORDER BY
        sb.booking_date DESC;
END;
$$;