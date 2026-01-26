/* 
    # Fix Equipment Table CamelCase Compatibility
    
    1. New Columns
      - Adds `"depositAmount"` (quoted camelCase)
      - Adds `"rentalPricePerDay"` (quoted camelCase)
      - Adds `"imageUrls"` (quoted camelCase)
    
    2. Logic
      - Populates new columns from existing snake_case data.
      - Updates the synchronization trigger to handle these new fields.
      - Ensures permissions are granted for API access.
    
    3. Rationale
      - Resolves PGRST204 errors where the frontend sends camelCase but the DB uses snake_case.
      - Maintains data integrity by syncing both naming conventions.
    */

    -- 1. Add the missing camelCase columns
    DO $$ 
    BEGIN 
      -- depositAmount
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'depositAmount') THEN
        ALTER TABLE public.equipment ADD COLUMN "depositAmount" NUMERIC(10,2) DEFAULT 0;
      END IF;

      -- rentalPricePerDay
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'rentalPricePerDay') THEN
        ALTER TABLE public.equipment ADD COLUMN "rentalPricePerDay" NUMERIC(10,2) DEFAULT 0;
      END IF;

      -- imageUrls
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'imageUrls') THEN
        ALTER TABLE public.equipment ADD COLUMN "imageUrls" TEXT[];
      END IF;
    END $$;

    -- 2. Initial Data Sync
    UPDATE public.equipment 
    SET 
      "depositAmount" = COALESCE(deposit_amount, 0),
      "rentalPricePerDay" = COALESCE(rental_price_per_day, 0),
      "imageUrls" = image_urls;

    -- 3. Update the Sync Trigger Function to handle ALL fields
    CREATE OR REPLACE FUNCTION public.sync_equipment_compatibility_columns()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Availability Sync
      IF (NEW.availability_status IS DISTINCT FROM OLD.availability_status OR TG_OP = 'INSERT') THEN
         NEW."availabilityStatus" := NEW.availability_status;
      ELSIF (NEW."availabilityStatus" IS DISTINCT FROM OLD."availabilityStatus") THEN
         NEW.availability_status := NEW."availabilityStatus";
      END IF;

      -- Condition Sync
      IF (NEW.current_condition IS DISTINCT FROM OLD.current_condition OR TG_OP = 'INSERT') THEN
         NEW."currentCondition" := NEW.current_condition;
      ELSIF (NEW."currentCondition" IS DISTINCT FROM OLD."currentCondition") THEN
         NEW.current_condition := NEW."currentCondition";
      END IF;

      -- Deposit Amount Sync
      IF (NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount OR TG_OP = 'INSERT') THEN
         NEW."depositAmount" := NEW.deposit_amount;
      ELSIF (NEW."depositAmount" IS DISTINCT FROM OLD."depositAmount") THEN
         NEW.deposit_amount := NEW."depositAmount";
      END IF;

      -- Rental Price Sync
      IF (NEW.rental_price_per_day IS DISTINCT FROM OLD.rental_price_per_day OR TG_OP = 'INSERT') THEN
         NEW."rentalPricePerDay" := NEW.rental_price_per_day;
      ELSIF (NEW."rentalPricePerDay" IS DISTINCT FROM OLD."rentalPricePerDay") THEN
         NEW.rental_price_per_day := NEW."rentalPricePerDay";
      END IF;

      -- Image URLs Sync
      IF (NEW.image_urls IS DISTINCT FROM OLD.image_urls OR TG_OP = 'INSERT') THEN
         NEW."imageUrls" := NEW.image_urls;
      ELSIF (NEW."imageUrls" IS DISTINCT FROM OLD."imageUrls") THEN
         NEW.image_urls := NEW."imageUrls";
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- 4. Ensure Trigger is attached
    DROP TRIGGER IF EXISTS tr_sync_equipment_compatibility ON public.equipment;
    CREATE TRIGGER tr_sync_equipment_compatibility
    BEFORE INSERT OR UPDATE ON public.equipment
    FOR EACH ROW EXECUTE FUNCTION public.sync_equipment_compatibility_columns();

    -- 5. Permissions and Cache Refresh
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.equipment TO authenticated;
    GRANT SELECT ON TABLE public.equipment TO anon;

    COMMENT ON TABLE public.equipment IS 'Equipment table with full camelCase and snake_case compatibility.';