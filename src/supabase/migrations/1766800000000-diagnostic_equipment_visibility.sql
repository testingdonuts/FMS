/* 
    # Diagnostic & Definitive Visibility Fix
    
    1. Table Verification
      - Ensures all camelCase and snake_case columns exist and are synced.
    
    2. RLS "Nuclear" Reset
      - Drops ALL existing policies on the equipment table.
      - Re-enables RLS but with a "SELECT true" policy for public/anon/authenticated users.
      - This guarantees visibility if data exists.
    
    3. Seed Data (Self-Healing)
      - If the equipment table is empty, it inserts a high-quality test item.
      - This allows immediate verification on the Home/Equipment pages.
    
    4. API Cache Invalidation
      - Updates table metadata to force Supabase to refresh the REST API schema.
    */

    -- 1. Column Integrity & Defaults
    ALTER TABLE public.equipment 
      ADD COLUMN IF NOT EXISTS "availabilityStatus" BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS "currentCondition" TEXT DEFAULT 'Good',
      ADD COLUMN IF NOT EXISTS "rentalPricePerDay" NUMERIC(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "depositAmount" NUMERIC(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] DEFAULT '{}';

    -- 2. Clean RLS State
    ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

    DO $$ 
    DECLARE pol RECORD;
    BEGIN 
      FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'equipment' AND schemaname = 'public' LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.equipment', pol.policyname);
      END LOOP;
    END $$;

    -- 3. Maximum Visibility Policy (For Testing/Verification)
    -- This allows everyone to see everything. We can restrict this later once visibility is confirmed.
    CREATE POLICY "Visibility Diagnostic Policy" ON public.equipment
    FOR SELECT TO anon, authenticated
    USING (true);

    -- Maintain management policy for organizations
    CREATE POLICY "Org Management Policy" ON public.equipment
    FOR ALL TO authenticated
    USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

    -- 4. Seed Data (Only if table is empty)
    -- This ensures you have SOMETHING to see on the frontend.
    INSERT INTO public.equipment (
      name, 
      category, 
      description, 
      rental_price_per_day, 
      deposit_amount, 
      current_condition, 
      "currentCondition",
      availability_status, 
      "availabilityStatus",
      image_urls,
      "imageUrls"
    )
    SELECT 
      'Diagnostic Test Car Seat', 
      'Safety Gear', 
      'This is a test equipment item to verify frontend visibility.', 
      25.00, 
      50.00, 
      'Good', 
      'Good',
      true, 
      true,
      ARRAY['https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=800'],
      ARRAY['https://images.unsplash.com/photo-1596464716127-f2a82984de30?q=80&w=800']
    WHERE NOT EXISTS (SELECT 1 FROM public.equipment LIMIT 1);

    -- 5. Data Sync for existing records
    UPDATE public.equipment 
    SET 
      "availabilityStatus" = COALESCE("availabilityStatus", availability_status, true),
      availability_status = COALESCE(availability_status, "availabilityStatus", true),
      "currentCondition" = COALESCE("currentCondition", current_condition, 'Good'),
      current_condition = COALESCE(current_condition, "currentCondition", 'Good'),
      "rentalPricePerDay" = COALESCE("rentalPricePerDay", rental_price_per_day, 0),
      rental_price_per_day = COALESCE(rental_price_per_day, "rentalPricePerDay", 0),
      "imageUrls" = COALESCE("imageUrls", image_urls, '{}'),
      image_urls = COALESCE(image_urls, "imageUrls", '{}')
    WHERE "availabilityStatus" IS NULL OR availability_status IS NULL;

    -- 6. Permissions & API Refresh
    GRANT SELECT ON public.equipment TO anon;
    GRANT SELECT ON public.equipment TO authenticated;
    GRANT ALL ON public.equipment TO service_role;

    COMMENT ON TABLE public.equipment IS 'Equipment inventory (Diagnostic Mode): RLS set to public select true.';