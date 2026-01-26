/* 
    # Fix Equipment Availability RPC Type Mismatch
    
    1. Problem:
      - The frontend sends dates as Strings (TEXT).
      - The DB function expects `DATE` types.
      - Supabase/PostgREST fails to find the function signature (404/Function not found), 
        leading to the "Error checking availability" message in the UI.
    
    2. Solution:
      - Drop existing variants of the function.
      - Recreate the function to accept `TEXT` for date parameters.
      - Cast the text to `DATE` inside the function logic.
      - Use `SECURITY DEFINER` and explicit `search_path` for maximum reliability.
    */

    -- 1. Drop ALL possible variants to avoid signature confusion
    DROP FUNCTION IF EXISTS public.check_equipment_availability(UUID, DATE, DATE);
    DROP FUNCTION IF EXISTS public.check_equipment_availability(UUID, TEXT, TEXT);

    -- 2. Create the robust version that accepts TEXT
    CREATE OR REPLACE FUNCTION public.check_equipment_availability(
      p_equipment_uuid UUID,
      p_start_date TEXT, -- Changed to TEXT to match JS payloads
      p_end_date TEXT    -- Changed to TEXT to match JS payloads
    ) 
    RETURNS BOOLEAN 
    LANGUAGE plpgsql 
    SECURITY DEFINER
    SET search_path = public, pg_catalog
    AS $$
    DECLARE
      v_start DATE;
      v_end DATE;
    BEGIN
      -- Cast input strings to dates safely
      v_start := p_start_date::DATE;
      v_end := p_end_date::DATE;

      -- Check if the equipment exists and is available for rent
      IF NOT EXISTS (
        SELECT 1 FROM public.equipment 
        WHERE id = p_equipment_uuid 
        AND availability_status = true
      ) THEN
        RETURN false;
      END IF;

      -- Check for overlapping rentals
      -- (p_start <= end_date AND p_end >= start_date)
      IF EXISTS (
        SELECT 1 FROM public.equipment_rentals
        WHERE equipment_id = p_equipment_uuid
        AND status IN ('pending', 'active')
        AND (v_start <= end_date AND v_end >= start_date)
      ) THEN
        RETURN false; -- Conflict found
      END IF;

      -- No conflicts, equipment is available
      RETURN true;
    EXCEPTION WHEN OTHERS THEN
      -- Fallback for invalid date formats
      RETURN false;
    END;
    $$;

    -- 3. Re-grant permissions
    GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, TEXT, TEXT) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, TEXT, TEXT) TO anon;
    GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, TEXT, TEXT) TO service_role;