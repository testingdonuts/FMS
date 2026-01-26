/* 
    # Final Database Reconciliation
    
    1. Restore missing columns used by frontend forms:
      - `service_bookings`: Restore `child_name`, `child_age` (required by form).
      - `equipment_rentals`: Restore `child_name`, `child_age` (required by form).
    
    2. Fix RPC Function:
      - Re-defines `check_equipment_availability` to accept `TEXT` for dates to match JavaScript ISO strings.
    
    3. Reset RLS:
      - Wipes all policies for bookings and rentals to ensure no conflicts.
      - Sets up clean, robust policies for parents and organizations.
    */

    -- 1. Restore required columns for form compatibility
    ALTER TABLE public.service_bookings 
      ADD COLUMN IF NOT EXISTS "child_name" TEXT,
      ADD COLUMN IF NOT EXISTS "child_age" INTEGER,
      ADD COLUMN IF NOT EXISTS "parent_first_name" TEXT,
      ADD COLUMN IF NOT EXISTS "parent_last_name" TEXT,
      ADD COLUMN IF NOT EXISTS "contact_phone" TEXT,
      ADD COLUMN IF NOT EXISTS "vehicle_info" TEXT,
      ADD COLUMN IF NOT EXISTS "service_address" TEXT;

    ALTER TABLE public.equipment_rentals 
      ADD COLUMN IF NOT EXISTS "child_name" TEXT,
      ADD COLUMN IF NOT EXISTS "child_age" INTEGER,
      ADD COLUMN IF NOT EXISTS "parent_first_name" TEXT,
      ADD COLUMN IF NOT EXISTS "parent_last_name" TEXT,
      ADD COLUMN IF NOT EXISTS "contact_phone" TEXT;

    -- 2. Fix the Availability RPC (Accept TEXT for dates)
    DROP FUNCTION IF EXISTS public.check_equipment_availability(UUID, DATE, DATE);
    DROP FUNCTION IF EXISTS public.check_equipment_availability(UUID, TEXT, TEXT);

    CREATE OR REPLACE FUNCTION public.check_equipment_availability(
      p_equipment_uuid UUID,
      p_start_date TEXT,
      p_end_date TEXT
    ) RETURNS BOOLEAN 
    LANGUAGE plpgsql 
    SECURITY DEFINER 
    AS $$
    DECLARE
      v_start DATE;
      v_end DATE;
    BEGIN
      v_start := p_start_date::DATE;
      v_end := p_end_date::DATE;

      IF NOT EXISTS (SELECT 1 FROM public.equipment WHERE id = p_equipment_uuid AND availability_status = true) THEN
        RETURN false;
      END IF;

      IF EXISTS (
        SELECT 1 FROM public.equipment_rentals 
        WHERE equipment_id = p_equipment_uuid 
        AND status IN ('pending', 'active') 
        AND (v_start <= end_date AND v_end >= start_date)
      ) THEN
        RETURN false;
      END IF;

      RETURN true;
    END;
    $$;

    -- 3. Reset RLS for both tables
    ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.equipment_rentals ENABLE ROW LEVEL SECURITY;

    DO $$ 
    DECLARE 
      pol RECORD;
    BEGIN 
      -- Clean service_bookings
      FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'service_bookings' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.service_bookings', pol.policyname);
      END LOOP;
      -- Clean equipment_rentals
      FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'equipment_rentals' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.equipment_rentals', pol.policyname);
      END LOOP;
    END $$;

    -- 4. Create Clean Policies
    
    -- Bookings
    CREATE POLICY "sb_parent_all" ON public.service_bookings FOR ALL TO authenticated USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
    CREATE POLICY "sb_org_all" ON public.service_bookings FOR ALL TO authenticated USING (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

    -- Rentals
    CREATE POLICY "er_parent_all" ON public.equipment_rentals FOR ALL TO authenticated USING (auth.uid() = parent_id) WITH CHECK (auth.uid() = parent_id);
    CREATE POLICY "er_org_all" ON public.equipment_rentals FOR ALL TO authenticated USING (
      EXISTS (SELECT 1 FROM public.equipment e WHERE e.id = equipment_id AND e.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
    );

    -- 5. Permissions
    GRANT ALL ON public.service_bookings TO authenticated;
    GRANT ALL ON public.equipment_rentals TO authenticated;
    GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, TEXT, TEXT) TO authenticated;