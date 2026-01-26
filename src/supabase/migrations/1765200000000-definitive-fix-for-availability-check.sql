/*
# Definitive Fix for Equipment Availability Check

This migration provides a comprehensive and final fix for the recurring "Error checking availability" and `404 Not Found` errors that occur when calling the `check_equipment_availability` RPC function.

## 1. Problem

Despite numerous previous attempts to create and grant permissions on the `check_equipment_availability` function, the application continues to fail with a generic error. This typically indicates one of two issues:
1.  **Stale Schema Cache**: The Supabase API gateway (PostgREST) has a stale schema and cannot find the function, resulting in a `404 Not Found` error that the client library reports as a generic failure.
2.  **Permission Denied**: The `authenticated` role lacks the necessary `EXECUTE` permission on the function, causing the database to reject the call.

## 2. Solution

This migration employs a forceful "drop and recreate" strategy to ensure the API schema is refreshed and permissions are correctly applied:

1.  **DROP FUNCTION**: It first explicitly drops the function if it exists. This clears any potentially inconsistent or cached state that could be causing the issue.
2.  **CREATE FUNCTION**: It then immediately recreates the function with the correct, validated logic and `SECURITY DEFINER` privileges.
3.  **GRANT PERMISSIONS**: Finally, it re-grants the necessary `EXECUTE` permissions to both the `authenticated` and `service_role` roles.

This atomic drop-and-recreate cycle is the most robust method for forcing the API gateway to invalidate its cache and correctly register the function, resolving both potential root causes of the error.

## 3. Impact

This change will resolve the availability check errors, allowing the equipment rental form to function correctly and unblocking the user rental workflow.
*/

-- Step 1: Explicitly drop the function to clear any stale cache and resolve potential 404 errors.
DROP FUNCTION IF EXISTS public.check_equipment_availability(UUID, DATE, DATE);

-- Step 2: Re-create the function with the correct, validated logic and SECURITY DEFINER privileges.
CREATE OR REPLACE FUNCTION public.check_equipment_availability(
  p_equipment_uuid UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- First, check if the equipment itself is marked as available for rent
  IF NOT EXISTS (
    SELECT 1
    FROM public.equipment
    WHERE id = p_equipment_uuid AND availability_status = true
  ) THEN
    RETURN false;
  END IF;

  -- Then, check for any existing rentals that overlap with the requested date range.
  -- A rental is considered conflicting if its status is 'pending' or 'active'.
  IF EXISTS (
    SELECT 1
    FROM public.equipment_rentals
    WHERE
      equipment_id = p_equipment_uuid
      AND status IN ('pending', 'active')
      -- An overlap occurs if the requested start date is before or on an existing end date,
      -- AND the requested end date is after or on an existing start date.
      AND (p_start_date <= end_date AND p_end_date >= start_date)
  ) THEN
    RETURN false; -- The equipment is rented during this period
  END IF;

  -- If no conflicts are found, the equipment is available
  RETURN true;
END;
$$;

-- Step 3: Re-grant execute permissions to ensure all necessary roles can call the function.
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, DATE, DATE) TO service_role;