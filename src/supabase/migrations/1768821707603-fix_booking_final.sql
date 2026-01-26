/* 
    # Final Booking System Restoration
    
    1. Problem: 
      - Previous migrations dropped `child_name` and `child_age`.
      - The frontend form still sends these fields, causing "Column not found" errors.
      - RLS policies may be conflicting or missing for the `INSERT` operation.
    
    2. Solution:
      - Restore `child_name` and `child_age` to the `service_bookings` table.
      - Ensure all required columns for the booking form exist.
      - Reset RLS policies to a clean, subquery-based state.
    */

    -- 1. Restore required columns
    ALTER TABLE public.service_bookings 
      ADD COLUMN IF NOT EXISTS "child_name" TEXT,
      ADD COLUMN IF NOT EXISTS "child_age" INTEGER,
      ADD COLUMN IF NOT EXISTS "parent_first_name" TEXT,
      ADD COLUMN IF NOT EXISTS "parent_last_name" TEXT,
      ADD COLUMN IF NOT EXISTS "contact_phone" TEXT,
      ADD COLUMN IF NOT EXISTS "vehicle_info" TEXT,
      ADD COLUMN IF NOT EXISTS "service_address" TEXT;

    -- 2. Reset RLS State
    ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

    -- Drop all existing policies to avoid conflicts
    DO $$ 
    DECLARE 
      pol RECORD;
    BEGIN 
      FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'service_bookings' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.service_bookings', pol.policyname);
      END LOOP;
    END $$;

    -- 3. Create Robust Policies (Using direct subqueries to avoid helper function errors)
    
    -- Allow parents to insert their own bookings
    CREATE POLICY "allow_parent_insert" ON public.service_bookings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = parent_id);

    -- Allow parents to see their own bookings
    CREATE POLICY "allow_parent_select" ON public.service_bookings
    FOR SELECT TO authenticated
    USING (auth.uid() = parent_id);

    -- Allow organizations to view and manage their bookings
    CREATE POLICY "allow_org_manage" ON public.service_bookings
    FOR ALL TO authenticated
    USING (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

    -- 4. Grant Permissions
    GRANT ALL ON public.service_bookings TO authenticated;
    GRANT SELECT ON public.service_bookings TO anon;

    -- 5. Force Schema Refresh
    COMMENT ON TABLE public.service_bookings IS 'Service bookings table restored with legacy columns for form compatibility.';