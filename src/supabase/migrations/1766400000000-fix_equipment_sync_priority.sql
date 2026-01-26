/* 
    # Fix Equipment Sync Priority and Null Constraint
    
    1. Problem
      - The `rental_price_per_day` column has a NOT NULL constraint.
      - On INSERT, the frontend sends `"rentalPricePerDay"`.
      - The existing trigger was overwriting the provided `"rentalPricePerDay"` with a NULL `rental_price_per_day`, causing a crash.
    
    2. Solution
      - Redefine the sync trigger to use `COALESCE` during INSERT.
      - Prioritize whichever field (camelCase or snake_case) has data.
      - Ensure all fields (Availability, Condition, Deposit, Price, Images) are handled correctly.
    
    3. Security
      - Maintains existing RLS and permissions.
    */

    -- 1. Ensure all columns exist (Idempotent)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'rentalPricePerDay') THEN
        ALTER TABLE public.equipment ADD COLUMN "rentalPricePerDay" NUMERIC(10,2);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'depositAmount') THEN
        ALTER TABLE public.equipment ADD COLUMN "depositAmount" NUMERIC(10,2);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'availabilityStatus') THEN
        ALTER TABLE public.equipment ADD COLUMN "availabilityStatus" BOOLEAN;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'currentCondition') THEN
        ALTER TABLE public.equipment ADD COLUMN "currentCondition" TEXT;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'imageUrls') THEN
        ALTER TABLE public.equipment ADD COLUMN "imageUrls" TEXT[];
      END IF;
    END $$;

    -- 2. Redefine the Sync Trigger Function with Smart Priority
    CREATE OR REPLACE FUNCTION public.sync_equipment_compatibility_columns()
    RETURNS TRIGGER AS $$
    BEGIN
      IF (TG_OP = 'INSERT') THEN
        -- Prioritize values provided in the INSERT payload
        NEW.rental_price_per_day := COALESCE(NEW.rental_price_per_day, NEW."rentalPricePerDay");
        NEW."rentalPricePerDay"  := COALESCE(NEW."rentalPricePerDay", NEW.rental_price_per_day);

        NEW.deposit_amount       := COALESCE(NEW.deposit_amount, NEW."depositAmount");
        NEW."depositAmount"      := COALESCE(NEW."depositAmount", NEW.deposit_amount);

        NEW.availability_status  := COALESCE(NEW.availability_status, NEW."availabilityStatus");
        NEW."availabilityStatus" := COALESCE(NEW."availabilityStatus", NEW.availability_status);

        NEW.current_condition    := COALESCE(NEW.current_condition, NEW."currentCondition");
        NEW."currentCondition"   := COALESCE(NEW."currentCondition", NEW.current_condition);

        NEW.image_urls           := COALESCE(NEW.image_urls, NEW."imageUrls");
        NEW."imageUrls"          := COALESCE(NEW."imageUrls", NEW.image_urls);

      ELSIF (TG_OP = 'UPDATE') THEN
        -- Handle Rental Price Sync
        IF (NEW.rental_price_per_day IS DISTINCT FROM OLD.rental_price_per_day) THEN
          NEW."rentalPricePerDay" := NEW.rental_price_per_day;
        ELSIF (NEW."rentalPricePerDay" IS DISTINCT FROM OLD."rentalPricePerDay") THEN
          NEW.rental_price_per_day := NEW."rentalPricePerDay";
        END IF;

        -- Handle Deposit Sync
        IF (NEW.deposit_amount IS DISTINCT FROM OLD.deposit_amount) THEN
          NEW."depositAmount" := NEW.deposit_amount;
        ELSIF (NEW."depositAmount" IS DISTINCT FROM OLD."depositAmount") THEN
          NEW.deposit_amount := NEW."depositAmount";
        END IF;

        -- Handle Availability Sync
        IF (NEW.availability_status IS DISTINCT FROM OLD.availability_status) THEN
          NEW."availabilityStatus" := NEW.availability_status;
        ELSIF (NEW."availabilityStatus" IS DISTINCT FROM OLD."availabilityStatus") THEN
          NEW.availability_status := NEW."availabilityStatus";
        END IF;

        -- Handle Condition Sync
        IF (NEW.current_condition IS DISTINCT FROM OLD.current_condition) THEN
          NEW."currentCondition" := NEW.current_condition;
        ELSIF (NEW."currentCondition" IS DISTINCT FROM OLD."currentCondition") THEN
          NEW.current_condition := NEW."currentCondition";
        END IF;

        -- Handle Image URLs Sync
        IF (NEW.image_urls IS DISTINCT FROM OLD.image_urls) THEN
          NEW."imageUrls" := NEW.image_urls;
        ELSIF (NEW."imageUrls" IS DISTINCT FROM OLD."imageUrls") THEN
          NEW.image_urls := NEW."imageUrls";
        END IF;
      END IF;

      -- Final safety check for NOT NULL constraint
      IF NEW.rental_price_per_day IS NULL THEN
        NEW.rental_price_per_day := 0;
      END IF;
      IF NEW."rentalPricePerDay" IS NULL THEN
        NEW."rentalPricePerDay" := 0;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- 3. Reset the Trigger
    DROP TRIGGER IF EXISTS tr_sync_equipment_compatibility ON public.equipment;
    CREATE TRIGGER tr_sync_equipment_compatibility
    BEFORE INSERT OR UPDATE ON public.equipment
    FOR EACH ROW EXECUTE FUNCTION public.sync_equipment_compatibility_columns();

    -- 4. Permissions
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.equipment TO authenticated;
    GRANT SELECT ON TABLE public.equipment TO anon;
    
    -- Refresh cache
    COMMENT ON TABLE public.equipment IS 'Equipment table with robust camelCase and snake_case synchronization.';