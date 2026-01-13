/*
# Recreate and Secure Equipment Availability Function

This migration provides a definitive fix for the `404 Not Found` error when calling the `check_equipment_availability` RPC function.

## 1. Problem
The application is unable to call the `check_equipment_availability` function, receiving a `404 Not Found` error. This indicates that the Supabase API gateway (PostgREST) cannot find the function in the database schema. This can happen due to a stale schema cache or a previously failed migration that left the function in an inconsistent state.

## 2. Solution
This migration script takes two corrective actions in a single, atomic operation:

1.  **Recreate the Function**: It uses `CREATE OR REPLACE` to redefine the `check_equipment_availability` function. This ensures the function exists, has the most up-to-date logic (using explicit date comparisons and `SECURITY DEFINER`), and forces the API gateway to recognize it.
2.  **Grant Permissions**: Immediately after creating the function, it grants `EXECUTE` permission to the `authenticated` role. This guarantees that logged-in users are able to call it.

This approach is idempotent and robust, directly addressing the "Not Found" error by ensuring the function is correctly defined and accessible.

## 3. Impact
This change will resolve the `404` error and allow the equipment rental form to correctly check for availability, unblocking the user rental workflow.
*/

-- Step 1: Re-create the function to ensure it exists and is correctly defined.
CREATE OR REPLACE FUNCTION check_equipment_availability(
    p_equipment_uuid UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- First, check if the equipment itself is marked as available
    IF NOT EXISTS (
        SELECT 1 FROM public.equipment
        WHERE id = p_equipment_uuid AND availability_status = true
    ) THEN
        RETURN false;
    END IF;

    -- Then, check for any overlapping rentals using an explicit condition
    IF EXISTS (
        SELECT 1
        FROM public.equipment_rentals
        WHERE
            equipment_id = p_equipment_uuid
            AND status IN ('pending', 'active')
            -- Explicitly check for overlapping date ranges.
            AND (p_start_date <= end_date AND p_end_date >= start_date)
    ) THEN
        RETURN false; -- The equipment is rented during this period
    END IF;

    -- If no overlaps are found, the equipment is available
    RETURN true;
END;
$$;

-- Step 2: Grant execute permission to ensure the authenticated role can call it.
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, DATE, DATE) TO service_role;