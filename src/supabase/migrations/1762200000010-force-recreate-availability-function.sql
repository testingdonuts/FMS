/*
# Force Recreate Availability Function to Fix 404 Error

This migration provides a definitive fix for the persistent `404 Not Found` error when calling the `check_equipment_availability` RPC function.

## 1. Problem
Despite previous attempts to create and grant permissions on the `check_equipment_availability` function, the application continues to receive a `404 Not Found` error. This indicates a persistent issue where the Supabase API gateway (PostgREST) has a stale schema cache and has not recognized the function's existence.

## 2. Solution
This migration employs a more forceful "drop and recreate" strategy to ensure the API schema is refreshed:
1.  **DROP FUNCTION**: It first explicitly drops the function if it exists. This clears any potentially inconsistent or cached state.
2.  **CREATE FUNCTION**: It then immediately recreates the function with the correct logic and `SECURITY DEFINER` privileges.
3.  **GRANT PERMISSIONS**: Finally, it re-grants the necessary `EXECUTE` permissions to the `authenticated` and `service_role` roles.

This atomic drop-and-recreate cycle is a robust method for forcing the API gateway to invalidate its cache and correctly register the function.

## 3. Impact
This change will resolve the `404` error, allowing the equipment rental form to successfully check for availability and unblocking the user rental workflow.
*/

-- Step 1: Explicitly drop the function to clear any stale cache.
DROP FUNCTION IF EXISTS public.check_equipment_availability(UUID, DATE, DATE);

-- Step 2: Re-create the function with the correct, validated logic.
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

-- Step 3: Re-grant execute permissions to ensure it's callable.
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, DATE, DATE) TO service_role;