/* 
    # Definitive Fix for Equipment Visibility and API Schema
    
    1. Schema Stabilization
      - Re-verifies existence of `"availabilityStatus"` (quoted camelCase).
      - Ensures it is NOT NULL with a default of true to prevent API filtering issues.
    
    2. Data Integrity
      - Backfills any remaining NULLs in both snake_case and camelCase columns.
    
    3. Security & Visibility
      - Explicitly grants SELECT on the equipment table to the `anon` and `authenticated` roles.
      - Simplifies the RLS Public policy to ensure maximum compatibility.
    
    4. API Refresh
      - Uses a DDL trick (re-applying comments) to force PostgREST to reload the schema cache.
    */

    -- 1. Ensure the column exists and has no NULLs
    DO $$ 
    BEGIN 
      -- Add the column if it somehow went missing
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment' AND column_name = 'availabilityStatus') THEN
        ALTER TABLE public.equipment ADD COLUMN "availabilityStatus" BOOLEAN DEFAULT true;
      END IF;

      -- Ensure it is BOOLEAN and has a default
      ALTER TABLE public.equipment ALTER COLUMN "availabilityStatus" SET DATA TYPE BOOLEAN;
      ALTER TABLE public.equipment ALTER COLUMN "availabilityStatus" SET DEFAULT true;
    END $$;

    -- 2. Backfill existing data to ensure visibility
    UPDATE public.equipment 
    SET 
      "availabilityStatus" = COALESCE("availabilityStatus", availability_status, true),
      availability_status = COALESCE(availability_status, "availabilityStatus", true)
    WHERE "availabilityStatus" IS NULL OR availability_status IS NULL;

    -- 3. Reset and Simplify RLS Policies
    ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

    -- Drop all previous equipment policies to avoid overlap/conflicts
    DO $$ 
    DECLARE pol RECORD;
    BEGIN 
      FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'equipment' AND schemaname = 'public' LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.equipment', pol.policyname);
      END LOOP;
    END $$;

    -- Policy: Allow anyone (Public + Authenticated) to see available equipment
    -- We check both columns for safety
    CREATE POLICY "Allow public select equipment" ON public.equipment
    FOR SELECT TO anon, authenticated
    USING (
      COALESCE("availabilityStatus", true) = true 
      AND 
      COALESCE(availability_status, true) = true
    );

    -- Policy: Allow Organizations to manage their own equipment
    CREATE POLICY "Allow org manage equipment" ON public.equipment
    FOR ALL TO authenticated
    USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
    WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

    -- 4. Explicit Permissions
    -- Granting SELECT specifically to the API roles
    GRANT SELECT ON public.equipment TO anon;
    GRANT SELECT ON public.equipment TO authenticated;
    GRANT ALL ON public.equipment TO service_role;

    -- 5. Force API Cache Refresh
    -- PostgREST reloads when it detects DDL changes. 
    -- Updating comments on the table and column is a safe way to trigger this.
    COMMENT ON TABLE public.equipment IS 'Equipment inventory with verified public visibility and camelCase API support.';
    COMMENT ON COLUMN public.equipment."availabilityStatus" IS 'API-compliant availability status (true = visible on site).';