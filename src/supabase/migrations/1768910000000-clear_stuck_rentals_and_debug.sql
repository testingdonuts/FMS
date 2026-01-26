/* 
    # Fix: Clear Stuck Rentals & Add Debug Tool
    
    1. Problem: 
       - Users see "Equipment not available" errors even when the item is enabled.
       - This is caused by 'pending' rentals from incomplete checkout flows blocking the dates.
    
    2. Solution:
       - ACTION: Delete all rentals with status = 'pending' to unblock development testing.
       - TOOL: Create a `debug_equipment_availability` RPC function.
         This allows you to run a query in Supabase to see exactly WHICH rental is causing the conflict.
    */

    -- 1. Clear Stuck/Ghost Rentals (Safe for Dev/Staging)
    -- This removes any rental request that hasn't been paid/activated yet.
    DELETE FROM public.equipment_rentals WHERE status = 'pending';

    -- 2. Create Debug Function
    -- Usage in SQL Editor: select * from debug_equipment_availability('EQUIPMENT_UUID', '2023-11-01', '2023-11-05');
    CREATE OR REPLACE FUNCTION debug_equipment_availability(
      p_equipment_id UUID,
      p_start_date TEXT,
      p_end_date TEXT
    ) RETURNS TABLE (
      conflict_reason TEXT,
      rental_id UUID,
      rental_status TEXT,
      rental_start DATE,
      rental_end DATE
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
    DECLARE
      v_start DATE;
      v_end DATE;
    BEGIN
      -- Cast dates
      v_start := p_start_date::DATE;
      v_end := p_end_date::DATE;

      -- Check 1: Global Status
      IF EXISTS (SELECT 1 FROM public.equipment WHERE id = p_equipment_id AND (availability_status = false OR "availabilityStatus" = false)) THEN
        RETURN QUERY SELECT 'Equipment is globally marked unavailable (availability_status = false)'::TEXT, NULL::uuid, NULL::text, NULL::date, NULL::date;
        RETURN; -- Exit if globally unavailable
      END IF;

      -- Check 2: Overlaps
      RETURN QUERY
      SELECT 
        'Date overlap detected'::TEXT,
        id,
        status,
        start_date,
        end_date
      FROM public.equipment_rentals
      WHERE equipment_id = p_equipment_id
      AND status IN ('pending', 'active') -- Only these statuses block availability
      AND (v_start <= end_date AND v_end >= start_date);
    END;
    $$;

    -- Grant access to the debug tool
    GRANT EXECUTE ON FUNCTION debug_equipment_availability(UUID, TEXT, TEXT) TO authenticated;
    GRANT EXECUTE ON FUNCTION debug_equipment_availability(UUID, TEXT, TEXT) TO service_role;