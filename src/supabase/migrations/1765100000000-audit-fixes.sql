/*
# Comprehensive Audit Fixes

This migration addresses all issues identified during the project audit, ensuring consistency across the database schema, API, and frontend.

### 1. Functional Fixes
- **Add Parent Phone to Rental RPCs**: The `get_parent_rentals` and `get_organization_rentals` functions have been updated to include the parent's `phone` number in the returned `parent` JSON object, making it available on the frontend `RentalCard`.

### 2. Schema Cleanup (Drift Removal)
- **Remove Unused Booking Columns**: The legacy `child_name` and `child_age` columns have been dropped from the `service_bookings` table. The `get_parent_bookings` and `get_organization_bookings` RPCs have been updated accordingly to remove these fields.
- **Remove Unused Listing Columns**: The unused `fax` and `services` columns have been dropped from the `listings` table.

This single migration resolves multiple inconsistencies, improves data integrity, and removes obsolete schema elements.
*/

-- Step 1: Drop unused columns from tables
ALTER TABLE public.service_bookings
DROP COLUMN IF EXISTS child_name,
DROP COLUMN IF EXISTS child_age;

ALTER TABLE public.listings
DROP COLUMN IF EXISTS fax,
DROP COLUMN IF EXISTS services;

-- Step 2: Update RPC functions to reflect schema changes and add missing data

-- Drop existing functions to avoid signature conflicts
DROP FUNCTION IF EXISTS public.get_organization_bookings(UUID);
DROP FUNCTION IF EXISTS public.get_parent_bookings(UUID);
DROP FUNCTION IF EXISTS public.get_parent_rentals(UUID);
DROP FUNCTION IF EXISTS public.get_organization_rentals(UUID);

-- Recreate function to get bookings for a specific organization (without child info)
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
    vehicle_info TEXT,
    service_address TEXT,
    contact_phone TEXT,
    reminder_sent BOOLEAN,
    last_reminder_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    service JSON,
    parent JSON,
    technician JSON
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
RETURN QUERY
SELECT
    sb.id, sb.org_id, sb.service_id, sb.parent_id, sb.technician_id, sb.booking_date,
    sb.status, sb.notes, sb.total_price, COALESCE(sb.platform_fee, 0) AS platform_fee,
    sb.payment_status, sb.parent_first_name, sb.parent_last_name, sb.vehicle_info,
    sb.service_address, sb.contact_phone, COALESCE(sb.reminder_sent, false) AS reminder_sent,
    sb.last_reminder_at, sb.created_at, sb.updated_at,
    json_build_object('id', s.id, 'name', s.name, 'description', s.description, 'price', s.price) AS service,
    json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email, 'phone', p.phone) AS parent,
    json_build_object('id', tm.id, 'role', tm.role, 'profile', json_build_object('full_name', tp.full_name)) AS technician
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

-- Recreate function to get bookings for a specific parent (without child info)
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
    vehicle_info TEXT,
    service_address TEXT,
    contact_phone TEXT,
    reminder_sent BOOLEAN,
    last_reminder_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    service JSON,
    parent JSON,
    technician JSON
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
RETURN QUERY
SELECT
    sb.id, sb.org_id, sb.service_id, sb.parent_id, sb.technician_id, sb.booking_date,
    sb.status, sb.notes, sb.total_price, COALESCE(sb.platform_fee, 0) AS platform_fee,
    sb.payment_status, sb.parent_first_name, sb.parent_last_name, sb.vehicle_info,
    sb.service_address, sb.contact_phone, COALESCE(sb.reminder_sent, false) AS reminder_sent,
    sb.last_reminder_at, sb.created_at, sb.updated_at,
    json_build_object('id', s.id, 'name', s.name, 'description', s.description, 'price', s.price) AS service,
    json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email, 'phone', p.phone) AS parent,
    json_build_object('id', tm.id, 'role', tm.role, 'profile', json_build_object('full_name', tp.full_name)) AS technician
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

-- Recreate function to get rentals for a specific parent (with phone)
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
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
RETURN QUERY
SELECT
    er.id, er.equipment_id, er.parent_id, er.start_date, er.end_date, er.total_price,
    er.deposit_amount, er.status, er.notes, er.pickup_address, er.return_method,
    er.payment_status, er.parent_first_name, er.parent_last_name, er.contact_phone,
    er.parent_address, er.created_at, er.updated_at,
    json_build_object(
        'id', e.id, 'name', e.name, 'category', e.category, 'image_urls', e.image_urls,
        'rental_price_per_day', e.rental_price_per_day
    ) AS equipment,
    json_build_object(
        'id', p.id, 'full_name', p.full_name, 'email', p.email, 'phone', p.phone
    ) AS parent
FROM
    public.equipment_rentals AS er
LEFT JOIN public.equipment AS e ON er.equipment_id = e.id
LEFT JOIN public.profiles AS p ON er.parent_id = p.id
WHERE er.parent_id = p_parent_id
ORDER BY er.start_date DESC;
END;
$$;

-- Recreate function to get rentals for a specific organization (with phone)
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
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
RETURN QUERY
SELECT
    er.id, er.equipment_id, er.parent_id, er.start_date, er.end_date, er.total_price,
    er.deposit_amount, er.status, er.notes, er.pickup_address, er.return_method,
    er.payment_status, er.parent_first_name, er.parent_last_name, er.contact_phone,
    er.parent_address, er.created_at, er.updated_at,
    json_build_object(
        'id', e.id, 'name', e.name, 'category', e.category, 'image_urls', e.image_urls,
        'rental_price_per_day', e.rental_price_per_day
    ) AS equipment,
    json_build_object(
        'id', p.id, 'full_name', p.full_name, 'email', p.email, 'phone', p.phone
    ) AS parent
FROM
    public.equipment_rentals AS er
INNER JOIN public.equipment AS e ON er.equipment_id = e.id
LEFT JOIN public.profiles AS p ON er.parent_id = p.id
WHERE e.organization_id = p_org_id
ORDER BY er.start_date DESC;
END;
$$;

-- Step 3: Grant permissions on the recreated functions
GRANT EXECUTE ON FUNCTION public.get_organization_bookings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_bookings(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_parent_bookings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_bookings(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_parent_rentals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_rentals(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_organization_rentals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_rentals(UUID) TO service_role;