/* 
    # Fix Booking Slots and Schema Integrity
    
    1. Table Synchronization:
      - Ensures all contact and vehicle fields exist on `service_bookings`.
      - Adds defaults to prevent NULL pointer errors in the UI.
    
    2. RLS Optimization:
      - Ensures parents can insert bookings (critical for the booking form).
      - Ensures organizations can read all bookings.
    */

    -- 1. Ensure all columns exist on service_bookings
    ALTER TABLE public.service_bookings 
      ADD COLUMN IF NOT EXISTS "parent_first_name" TEXT,
      ADD COLUMN IF NOT EXISTS "parent_last_name" TEXT,
      ADD COLUMN IF NOT EXISTS "contact_phone" TEXT,
      ADD COLUMN IF NOT EXISTS "vehicle_info" TEXT,
      ADD COLUMN IF NOT EXISTS "service_address" TEXT,
      ADD COLUMN IF NOT EXISTS "notes" TEXT;

    -- 2. Reset and Clean RLS Policies for service_bookings
    ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "bookings_parent_insert" ON public.service_bookings;
    DROP POLICY IF EXISTS "bookings_parent_select" ON public.service_bookings;
    DROP POLICY IF EXISTS "bookings_org_select" ON public.service_bookings;

    -- Allow parents to create their own bookings
    CREATE POLICY "bookings_parent_insert" ON public.service_bookings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = parent_id);

    -- Allow parents to view their own bookings
    CREATE POLICY "bookings_parent_select" ON public.service_bookings
    FOR SELECT TO authenticated
    USING (auth.uid() = parent_id);

    -- Allow organizations to view their own bookings
    CREATE POLICY "bookings_org_select" ON public.service_bookings
    FOR SELECT TO authenticated
    USING (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

    -- 3. Grant Permissions
    GRANT ALL ON public.service_bookings TO authenticated;
    GRANT SELECT ON public.service_bookings TO anon;