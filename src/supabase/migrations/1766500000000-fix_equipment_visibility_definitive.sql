/* 
    # Definitive Fix for Equipment Visibility
    
    1. Schema Adjustments
      - Ensures all camelCase columns (`availabilityStatus`, `currentCondition`, `depositAmount`, `rentalPricePerDay`, `imageUrls`) exist.
      - These are quoted to ensure PostgREST maps them correctly from the frontend.
    
    2. Data Synchronization
      - Updates the sync trigger to bi-directionally handle all fields.
      - Ensures `INSERT` operations prioritize whichever field (camelCase or snake_case) is provided.
    
    3. Security & Visibility (The "Not Showing" Fix)
      - Explicitly enables RLS on the equipment table.
      - Restores the "Public/Parent Select" policy so non-organization users can view available equipment.
      - Fixes the Organization management policy.
    
    4. Permissions
      - Grants EXECUTE and SELECT to all roles.
    */

    -- 1. Ensure all camelCase columns exist (Quoted for case-sensitivity)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'availabilityStatus') THEN
        ALTER TABLE public.equipment ADD COLUMN "availabilityStatus" BOOLEAN DEFAULT true;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'currentCondition') THEN
        ALTER TABLE public.equipment ADD COLUMN "currentCondition" TEXT DEFAULT 'Good';
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'depositAmount') THEN
        ALTER TABLE public.equipment ADD COLUMN "depositAmount" NUMERIC(10,2) DEFAULT 0;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'rentalPricePerDay') THEN
        ALTER TABLE public.equipment ADD COLUMN "rentalPricePerDay" NUMERIC(10,2) DEFAULT 0;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'imageUrls') THEN
        ALTER TABLE public.equipment ADD COLUMN "imageUrls" TEXT[];
      END IF;
    END $$;

    -- 2. Robust Sync Trigger Function
    CREATE OR REPLACE FUNCTION public.sync_equipment_compatibility_columns()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Logic for INSERT: Fill gaps in both directions
      IF (TG_OP = 'INSERT') THEN
        NEW.availability_status  := COALESCE(NEW.availability_status, NEW."availabilityStatus", true);
        NEW."availabilityStatus" := COALESCE(NEW."availabilityStatus", NEW.availability_status, true);

        NEW.current_condition    := COALESCE(NEW.current_condition, NEW."currentCondition", 'Good');
        NEW."currentCondition"   := COALESCE(NEW."currentCondition", NEW.current_condition, 'Good');

        NEW.deposit_amount       := COALESCE(NEW.deposit_amount, NEW."depositAmount", 0);
        NEW."depositAmount"      := COALESCE(NEW."depositAmount", NEW.deposit_amount, 0);

        NEW.rental_price_per_day := COALESCE(NEW.rental_price_per_day, NEW."rentalPricePerDay", 0);
        NEW."rentalPricePerDay"  := COALESCE(NEW."rentalPricePerDay", NEW.rental_price_per_day, 0);

        NEW.image_urls           := COALESCE(NEW.image_urls, NEW."imageUrls");
        NEW."imageUrls"          := COALESCE(NEW."imageUrls", NEW.image_urls);

      -- Logic for UPDATE: Sync changed values
      ELSIF (TG_OP = 'UPDATE') THEN
        -- Availability
        IF (NEW.availability_status IS DISTINCT FROM OLD.availability_status) THEN
          NEW."availabilityStatus" := NEW.availability_status;
        ELSIF (NEW."availabilityStatus" IS DISTINCT FROM OLD."availabilityStatus") THEN
          NEW.availability_status := NEW."availabilityStatus";
        END IF;

        -- Condition
        IF (NEW.current_condition IS DISTINCT FROM OLD.current_condition) THEN
          NEW."currentCondition" := NEW.current_condition;
        ELSIF (NEW."currentCondition" IS DISTINCT FROM OLD."currentCondition") THEN
          NEW.current_condition := NEW."currentCondition";
        END IF;

        -- Deposit
        IF (NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount) THEN
          NEW."depositAmount" := NEW.deposit_amount;
        ELSIF (NEW."depositAmount" IS DISTINCT FROM OLD."depositAmount") THEN
          NEW.deposit_amount := NEW."depositAmount";
        END IF;

        -- Rental Price
        IF (NEW.rental_price_per_day IS DISTINCT FROM OLD.rental_price_per_day) THEN
          NEW."rentalPricePerDay" := NEW.rental_price_per_day;
        ELSIF (NEW."rentalPricePerDay" IS DISTINCT FROM OLD."rentalPricePerDay") THEN
          NEW.rental_price_per_day := NEW."rentalPricePerDay";
        END IF;

        -- Images
        IF (NEW.image_urls IS DISTINCT FROM OLD.image_urls) THEN
          NEW."imageUrls" := NEW.image_urls;
        ELSIF (NEW."imageUrls" IS DISTINCT FROM OLD."imageUrls") THEN
          NEW.image_urls := NEW."imageUrls";
        END IF;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 3. Re-attach Trigger
    DROP TRIGGER IF EXISTS tr_sync_equipment_compatibility ON public.equipment;
    CREATE TRIGGER tr_sync_equipment_compatibility
    BEFORE INSERT OR UPDATE ON public.equipment
    FOR EACH ROW EXECUTE FUNCTION public.sync_equipment_compatibility_columns();

    -- 4. Fix RLS Policies for Visibility
    ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

    -- Drop all existing equipment policies to ensure a clean state
    DO $$ 
    DECLARE pol RECORD;
    BEGIN 
      FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'equipment' AND schemaname = 'public' LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.equipment', pol.policyname);
      END LOOP;
    END $$;

    -- Policy A: Public Visibility (CRITICAL for Home/Listing pages)
    CREATE POLICY "Public can view available equipment" ON public.equipment
    FOR SELECT TO anon, authenticated
    USING (COALESCE("availabilityStatus", availability_status, true) = true);

    -- Policy B: Organization Management
    CREATE POLICY "Orgs can manage their equipment" ON public.equipment
    FOR ALL TO authenticated
    USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

    -- 5. Final Permissions & Cache Refresh
    GRANT SELECT ON public.equipment TO anon;
    GRANT ALL ON public.equipment TO authenticated;
    GRANT ALL ON public.equipment TO service_role;

    -- Force schema cache refresh
    COMMENT ON TABLE public.equipment IS 'Equipment inventory with full API compatibility and public visibility policies.';