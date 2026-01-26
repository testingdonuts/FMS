/* 
    # Consolidated Booking System Fix
    
    1. Table Integrity:
      - Restores all columns required by the ServiceBookingForm.
      - Ensures `child_name` and `child_age` exist (restoring from audit cleanup).
      - Ensures contact and vehicle fields exist.
    
    2. RLS Security:
      - Drops all existing booking policies to prevent conflicts.
      - Creates a clean, robust INSERT policy for parents.
      - Creates a clean SELECT policy for parents and organizations.
    */

    -- 1. Ensure Table Columns exist
    ALTER TABLE public.service_bookings 
      ADD COLUMN IF NOT EXISTS "org_id" UUID REFERENCES public.organizations(id),
      ADD COLUMN IF NOT EXISTS "parent_id" UUID REFERENCES auth.users(id),
      ADD COLUMN IF NOT EXISTS "service_id" UUID REFERENCES public.services(id),
      ADD COLUMN IF NOT EXISTS "parent_first_name" TEXT,
      ADD COLUMN IF NOT EXISTS "parent_last_name" TEXT,
      ADD COLUMN IF NOT EXISTS "child_name" TEXT,
      ADD COLUMN IF NOT EXISTS "child_age" INTEGER,
      ADD COLUMN IF NOT EXISTS "contact_phone" TEXT,
      ADD COLUMN IF NOT EXISTS "vehicle_info" TEXT,
      ADD COLUMN IF NOT EXISTS "service_address" TEXT,
      ADD COLUMN IF NOT EXISTS "notes" TEXT,
      ADD COLUMN IF NOT EXISTS "platform_fee" NUMERIC(10,2) DEFAULT 0;

    -- 2. Reset RLS State
    ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

    DO $$ 
    DECLARE 
      pol RECORD;
    BEGIN 
      FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'service_bookings' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.service_bookings', pol.policyname);
      END LOOP;
    END $$;

    -- 3. Create Clean Policies
    
    -- Allow parents to book (INSERT)
    CREATE POLICY "bookings_parent_insert" ON public.service_bookings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = parent_id);

    -- Allow parents to see their own bookings
    CREATE POLICY "bookings_parent_select" ON public.service_bookings
    FOR SELECT TO authenticated
    USING (auth.uid() = parent_id);

    -- Allow organizations to view and update their own bookings
    CREATE POLICY "bookings_org_access" ON public.service_bookings
    FOR ALL TO authenticated
    USING (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

    -- 4. Grant Permissions
    GRANT ALL ON public.service_bookings TO authenticated;
    GRANT SELECT ON public.service_bookings TO anon;