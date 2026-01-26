/* 
    # Fix Equipment Visibility and CamelCase Sync
    
    1. Schema Stabilization
      - Ensures all camelCase columns used by the frontend (`availabilityStatus`, `currentCondition`, `rentalPricePerDay`, `depositAmount`, `imageUrls`) exist.
      - Sets appropriate defaults to avoid NULL constraint violations.
    
    2. Data Backfill
      - Synchronizes existing data from snake_case columns to camelCase columns for all historical records.
    
    3. RLS Policy Refinement
      - Refreshes the "Public View" policy to ensure unauthenticated users can see available equipment.
      - Simplifies the "Organization Management" policy for better performance and reliability.
    
    4. Permissions
      - Explicitly grants SELECT permissions to the `anon` and `authenticated` roles.
    */

    -- 1. Ensure camelCase columns exist with correct types and defaults
    ALTER TABLE public.equipment 
      ADD COLUMN IF NOT EXISTS "availabilityStatus" BOOLEAN DEFAULT true,
      ADD COLUMN IF NOT EXISTS "currentCondition" TEXT DEFAULT 'Good',
      ADD COLUMN IF NOT EXISTS "rentalPricePerDay" NUMERIC(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "depositAmount" NUMERIC(10,2) DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] DEFAULT '{}';

    -- 2. Backfill existing data to ensure no rows have NULLs in these columns
    UPDATE public.equipment
    SET 
      "availabilityStatus" = COALESCE("availabilityStatus", availability_status, true),
      "currentCondition" = COALESCE("currentCondition", current_condition, 'Good'),
      "rentalPricePerDay" = COALESCE("rentalPricePerDay", rental_price_per_day, 0),
      "depositAmount" = COALESCE("depositAmount", deposit_amount, 0),
      "imageUrls" = COALESCE("imageUrls", image_urls, '{}')
    WHERE 
      "availabilityStatus" IS NULL OR 
      "currentCondition" IS NULL OR 
      "rentalPricePerDay" IS NULL OR 
      "depositAmount" IS NULL OR 
      "imageUrls" IS NULL;

    -- 3. Update the Sync Trigger to be even more robust
    CREATE OR REPLACE FUNCTION public.sync_equipment_compatibility_columns()
    RETURNS TRIGGER AS $$
    BEGIN
      -- On INSERT or UPDATE, ensure both sets of columns stay in sync
      -- We prioritize the camelCase fields if they are provided, otherwise fallback to snake_case
      
      NEW.availability_status  := COALESCE(NEW."availabilityStatus", NEW.availability_status, true);
      NEW."availabilityStatus" := NEW.availability_status;

      NEW.current_condition    := COALESCE(NEW."currentCondition", NEW.current_condition, 'Good');
      NEW."currentCondition"   := NEW.current_condition;

      NEW.rental_price_per_day := COALESCE(NEW."rentalPricePerDay", NEW.rental_price_per_day, 0);
      NEW."rentalPricePerDay"  := NEW.rental_price_per_day;

      NEW.deposit_amount       := COALESCE(NEW."depositAmount", NEW.deposit_amount, 0);
      NEW."depositAmount"      := NEW.deposit_amount;

      NEW.image_urls           := COALESCE(NEW."imageUrls", NEW.image_urls, '{}');
      NEW."imageUrls"          := NEW.image_urls;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 4. Re-verify Trigger Attachment
    DROP TRIGGER IF EXISTS tr_sync_equipment_compatibility ON public.equipment;
    CREATE TRIGGER tr_sync_equipment_compatibility
    BEFORE INSERT OR UPDATE ON public.equipment
    FOR EACH ROW EXECUTE FUNCTION public.sync_equipment_compatibility_columns();

    -- 5. Restore and Clean RLS Policies
    ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

    -- Remove any conflicting policies
    DROP POLICY IF EXISTS "Public can view available equipment" ON public.equipment;
    DROP POLICY IF EXISTS "Orgs can manage their equipment" ON public.equipment;
    DROP POLICY IF EXISTS "Allow public select published" ON public.equipment;

    -- Policy for Public Visibility (Home and Listing Pages)
    CREATE POLICY "Public can view available equipment" ON public.equipment
    FOR SELECT TO anon, authenticated
    USING (availability_status = true OR "availabilityStatus" = true);

    -- Policy for Organization Management (Dashboard)
    CREATE POLICY "Orgs can manage their equipment" ON public.equipment
    FOR ALL TO authenticated
    USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

    -- 6. Grant Permissions and Force Cache Refresh
    GRANT SELECT ON public.equipment TO anon;
    GRANT ALL ON public.equipment TO authenticated;
    GRANT ALL ON public.equipment TO service_role;

    -- Force schema cache refresh by updating the table comment
    COMMENT ON TABLE public.equipment IS 'Equipment inventory with synchronized camelCase columns and verified public visibility.';