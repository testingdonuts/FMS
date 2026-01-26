/* 
    # Fix Equipment Availability Column Naming Case
    
    1. New Columns
      - Adds `"availabilityStatus"` (quoted to preserve camelCase) to the `equipment` table.
    
    2. Changes
      - Populates the new column from the existing `availability_status`.
      - Adds a trigger to keep both columns in sync automatically.
      - Grants permissions to ensure the API can access the new column.
    
    3. Rationale
      - PostgREST throws a "Could not find column" error if the requested name (availabilityStatus) doesn't exist exactly in the schema.
      - Keeping both columns ensures backward compatibility with existing RPC functions.
    */

    -- 1. Add the camelCase column (quoted to enforce case sensitivity in the API)
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'equipment' 
        AND column_name = 'availabilityStatus'
      ) THEN
        ALTER TABLE public.equipment ADD COLUMN "availabilityStatus" BOOLEAN DEFAULT true;
      END IF;
    END $$;

    -- 2. Sync existing data
    UPDATE public.equipment 
    SET "availabilityStatus" = availability_status 
    WHERE "availabilityStatus" IS DISTINCT FROM availability_status;

    -- 3. Create a sync trigger function to keep both columns identical
    CREATE OR REPLACE FUNCTION public.sync_equipment_availability_columns()
    RETURNS TRIGGER AS $$
    BEGIN
      -- If snake_case changes, update camelCase
      IF (TG_OP = 'INSERT' OR NEW.availability_status IS DISTINCT FROM OLD.availability_status) THEN
        NEW."availabilityStatus" := NEW.availability_status;
      -- If camelCase changes, update snake_case
      ELSIF (NEW."availabilityStatus" IS DISTINCT FROM OLD."availabilityStatus") THEN
        NEW.availability_status := NEW."availabilityStatus";
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- 4. Attach the trigger
    DROP TRIGGER IF EXISTS tr_sync_equipment_availability ON public.equipment;
    CREATE TRIGGER tr_sync_equipment_availability
    BEFORE INSERT OR UPDATE ON public.equipment
    FOR EACH ROW EXECUTE FUNCTION public.sync_equipment_availability_columns();

    -- 5. Ensure permissions and refresh cache
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.equipment TO authenticated;
    GRANT SELECT ON TABLE public.equipment TO anon;

    -- Forced cache refresh via comment
    COMMENT ON TABLE public.equipment IS 'Equipment inventory with dual-case availability columns for API compatibility.';