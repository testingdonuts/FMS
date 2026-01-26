/* 
    # Final Equipment Visibility & Schema Fix
    
    1. Force-Sync Columns: Ensures both snake_case and camelCase columns exist and have data.
    2. RLS Reset: Drops all restrictions and allows public reading of available items.
    3. Seed Data: Inserts a guaranteed test item if the table is empty.
    4. API Refresh: Forces the Supabase API to recognize the new columns.
    */

    -- 1. Ensure columns exist with correct types and defaults
    ALTER TABLE public.equipment 
    ADD COLUMN IF NOT EXISTS "availabilityStatus" BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS "currentCondition" TEXT DEFAULT 'Good',
    ADD COLUMN IF NOT EXISTS "rentalPricePerDay" NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "depositAmount" NUMERIC(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] DEFAULT '{}';

    -- 2. Backfill NULL values (NULLs cause filtered queries to return nothing)
    UPDATE public.equipment 
    SET 
      "availabilityStatus" = COALESCE("availabilityStatus", availability_status, true),
      availability_status = COALESCE(availability_status, "availabilityStatus", true),
      "currentCondition" = COALESCE("currentCondition", current_condition, 'Good'),
      current_condition = COALESCE(current_condition, "currentCondition", 'Good'),
      "rentalPricePerDay" = COALESCE("rentalPricePerDay", rental_price_per_day, 0),
      rental_price_per_day = COALESCE(rental_price_per_day, "rentalPricePerDay", 0),
      "imageUrls" = COALESCE("imageUrls", image_urls, '{}'),
      image_urls = COALESCE(image_urls, "imageUrls", '{}');

    -- 3. Reset RLS Policies
    ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

    -- Drop existing policies one by one (safer than loops in some dashboards)
    DROP POLICY IF EXISTS "Allow public select equipment" ON public.equipment;
    DROP POLICY IF EXISTS "Visibility Diagnostic Policy" ON public.equipment;
    DROP POLICY IF EXISTS "Public can view available equipment" ON public.equipment;
    DROP POLICY IF EXISTS "Orgs can manage their equipment" ON public.equipment;
    DROP POLICY IF EXISTS "Org Management Policy" ON public.equipment;

    -- Simple, broad SELECT policy for the frontend
    CREATE POLICY "equipment_public_select" ON public.equipment
    FOR SELECT TO anon, authenticated
    USING (COALESCE("availabilityStatus", true) = true);

    -- Management policy for Organizations
    CREATE POLICY "equipment_org_all" ON public.equipment
    FOR ALL TO authenticated
    USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

    -- 4. Seed a Diagnostic Item (if table is empty)
    -- This helps confirm if the issue is 'no data' or 'visibility'
    INSERT INTO public.equipment (
      name, category, description, "rentalPricePerDay", "depositAmount", "currentCondition", "availabilityStatus", "imageUrls"
    )
    SELECT 
      'Verified Test Car Seat', 
      'Safety Gear', 
      'If you see this, your database connection and visibility settings are working correctly.', 
      15.00, 50.00, 'Good', true, 
      ARRAY['https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=800']
    WHERE NOT EXISTS (SELECT 1 FROM public.equipment LIMIT 1);

    -- 5. Force API Schema Reload
    COMMENT ON TABLE public.equipment IS 'Equipment inventory - Refreshed at 1766900000000';
    
    -- Grant Permissions
    GRANT SELECT ON public.equipment TO anon, authenticated;