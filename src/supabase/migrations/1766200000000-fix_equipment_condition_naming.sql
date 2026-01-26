/* 
    # Fix Equipment Condition Column Naming
    
    1. New Columns
      - Adds `"currentCondition"` (quoted to preserve camelCase) to the `equipment` table.
    
    2. Changes
      - Populates the new column from the existing `current_condition`.
      - Adds a check constraint to the new column to match business logic.
      - Updates the existing sync trigger to handle the condition columns.
      - Grants permissions to ensure the API can access the new column.
    
    3. Rationale
      - The frontend is sending `currentCondition`, but the DB has `current_condition`.
      - Quoting the column name in PostgreSQL makes it case-sensitive, allowing PostgREST to find it.
    */

    -- 1. Add the camelCase column
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'equipment' 
        AND column_name = 'currentCondition'
      ) THEN
        ALTER TABLE public.equipment ADD COLUMN "currentCondition" TEXT DEFAULT 'Good';
      END IF;
    END $$;

    -- 2. Add the check constraint to the new column
    ALTER TABLE public.equipment DROP CONSTRAINT IF EXISTS equipment_currentCondition_check;
    ALTER TABLE public.equipment ADD CONSTRAINT equipment_currentCondition_check 
      CHECK ("currentCondition" IN ('New', 'Good', 'Used'));

    -- 3. Sync existing data
    UPDATE public.equipment 
    SET "currentCondition" = current_condition 
    WHERE "currentCondition" IS DISTINCT FROM current_condition;

    -- 4. Update the sync trigger function to handle both availability and condition
    CREATE OR REPLACE FUNCTION public.sync_equipment_compatibility_columns()
    RETURNS TRIGGER AS $$
    BEGIN
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

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- 5. Re-attach the trigger (replacing the previous partial sync trigger)
    DROP TRIGGER IF EXISTS tr_sync_equipment_availability ON public.equipment;
    DROP TRIGGER IF EXISTS tr_sync_equipment_compatibility ON public.equipment;
    
    CREATE TRIGGER tr_sync_equipment_compatibility
    BEFORE INSERT OR UPDATE ON public.equipment
    FOR EACH ROW EXECUTE FUNCTION public.sync_equipment_compatibility_columns();

    -- 6. Ensure permissions
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.equipment TO authenticated;
    GRANT SELECT ON TABLE public.equipment TO anon;

    -- Forced cache refresh
    COMMENT ON COLUMN public.equipment."currentCondition" IS 'CamelCase alias for current_condition to satisfy frontend API requests.';