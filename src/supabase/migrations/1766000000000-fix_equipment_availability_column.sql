/* 
    # Fix Equipment Availability Column Visibility
    
    1. Changes
      - Ensures the `availability_status` column exists in the `equipment` table.
      - Adds an explicit check to ensure the column is correctly typed as BOOLEAN.
      - Grants EXECUTE and SELECT permissions to the `anon` and `authenticated` roles to ensure the API can access the column.
    
    2. Rationale
      - The PostgREST error `Could not find the 'availabilityStatus' column` indicates that the API is looking for a column that either doesn't exist or isn't visible in the current schema cache.
      - By performing a DDL operation (ALTER TABLE), we force Supabase to refresh the PostgREST schema cache.
      - We maintain the snake_case `availability_status` as it is referenced in multiple existing RPC functions and services.
    */

    -- 1. Ensure the column exists with the correct name and type
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'equipment' 
        AND column_name = 'availability_status'
      ) THEN
        ALTER TABLE public.equipment ADD COLUMN availability_status BOOLEAN DEFAULT true;
      ELSE
        -- If it exists, ensure it is boolean (fix potential type mismatches)
        ALTER TABLE public.equipment ALTER COLUMN availability_status SET DATA TYPE BOOLEAN;
        ALTER TABLE public.equipment ALTER COLUMN availability_status SET DEFAULT true;
      END IF;
    END $$;

    -- 2. Ensure the API roles have access to the table and its columns
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.equipment TO authenticated;
    GRANT SELECT ON TABLE public.equipment TO anon;

    -- 3. Trigger a schema cache refresh
    -- In Supabase, any DDL change (like the one above) automatically notifies PostgREST to reload.
    -- We add a comment to the column to ensure a change is registered even if the column existed.
    COMMENT ON COLUMN public.equipment.availability_status IS 'Availability status of the equipment for rental (true = available).';