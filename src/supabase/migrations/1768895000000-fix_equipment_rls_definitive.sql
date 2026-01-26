/* 
    # Definitive Fix for Equipment RLS Violation
    
    1. Problem: 
      - `createEquipment` fails with RLS violation (42501).
      - Previous policies were either too restrictive or had failing subqueries during the INSERT phase.
    
    2. Solution:
      - Forcefully drop ALL existing policies on the equipment table to prevent conflicts.
      - Update the trigger function to be "Security Definer" to ensure it can always read the profiles table.
      - Implement a single, robust RLS policy that uses 'IN' for subqueries (more resilient than '=') and handles both snake_case and camelCase fields.
    
    3. Tables Modified:
      - `equipment`
    */

    -- 1. Re-define the Trigger Function with maximum reliability
    CREATE OR REPLACE FUNCTION public.sync_equipment_compatibility_columns() 
    RETURNS TRIGGER AS $$ 
    DECLARE
      v_user_org_id UUID;
    BEGIN 
      -- Get the current user's organization_id from their profile
      -- Using SECURITY DEFINER on the function ensures this always works
      SELECT organization_id INTO v_user_org_id FROM public.profiles WHERE id = auth.uid();

      -- Logic for INSERT: Ensure organization identity is correctly set
      IF (TG_OP = 'INSERT') THEN 
        -- If no organization ID was provided, or if it doesn't match the user's actual org, force the correct one.
        -- This prevents spoofing and fixes missing values from the frontend.
        NEW.organization_id := v_user_org_id;
        NEW."organizationId" := v_user_org_id;
        
        -- Sync other fields with sensible defaults
        NEW.availability_status := COALESCE(NEW.availability_status, NEW."availabilityStatus", true);
        NEW."availabilityStatus" := NEW.availability_status;
        
        NEW.current_condition := COALESCE(NEW.current_condition, NEW."currentCondition", 'Good');
        NEW."currentCondition" := NEW.current_condition;
        
        NEW.deposit_amount := COALESCE(NEW.deposit_amount, NEW."depositAmount", 0);
        NEW."depositAmount" := NEW.deposit_amount;
        
        NEW.rental_price_per_day := COALESCE(NEW.rental_price_per_day, NEW."rentalPricePerDay", 0);
        NEW."rentalPricePerDay" := NEW.rental_price_per_day;

        NEW.image_urls := COALESCE(NEW.image_urls, NEW."imageUrls", '{}');
        NEW."imageUrls" := NEW.image_urls;

      -- Logic for UPDATE: Keep both naming conventions in sync
      ELSIF (TG_OP = 'UPDATE') THEN 
        IF (NEW.availability_status IS DISTINCT FROM OLD.availability_status) THEN 
          NEW."availabilityStatus" := NEW.availability_status;
        ELSIF (NEW."availabilityStatus" IS DISTINCT FROM OLD."availabilityStatus") THEN 
          NEW.availability_status := NEW."availabilityStatus"; 
        END IF;
        
        IF (NEW.current_condition IS DISTINCT FROM OLD.current_condition) THEN 
          NEW."currentCondition" := NEW.current_condition;
        ELSIF (NEW."currentCondition" IS DISTINCT FROM OLD."currentCondition") THEN 
          NEW.current_condition := NEW."currentCondition"; 
        END IF;
      END IF;
      
      RETURN NEW; 
    END; 
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 2. Re-attach the trigger
    DROP TRIGGER IF EXISTS tr_sync_equipment_compatibility ON public.equipment;
    CREATE TRIGGER tr_sync_equipment_compatibility 
    BEFORE INSERT OR UPDATE ON public.equipment 
    FOR EACH ROW EXECUTE FUNCTION public.sync_equipment_compatibility_columns();

    -- 3. Reset RLS Policies systematically
    ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

    -- Drop every possible known policy name to ensure a clean state
    DO $$ 
    DECLARE 
      pol RECORD;
    BEGIN 
      FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'equipment' AND schemaname = 'public' 
      LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.equipment', pol.policyname);
      END LOOP;
    END $$;

    -- 4. Create the final, resilient policy
    -- This policy allows Organizations to manage their data
    -- and Parents/Public to view available equipment.
    
    -- A. Public Visibility
    CREATE POLICY "equipment_public_read_v3" ON public.equipment
    FOR SELECT TO anon, authenticated
    USING (availability_status = true OR "availabilityStatus" = true);

    -- B. Organization Management (INSERT/UPDATE/DELETE/SELECT)
    -- We use a subquery that checks the user's role and organization ID.
    -- The trigger above handles the actual data sanitization.
    CREATE POLICY "equipment_org_management_v3" ON public.equipment
    FOR ALL TO authenticated
    USING (
      organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      OR
      "organizationId" IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      OR
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
    )
    WITH CHECK (
      -- During INSERT, the trigger forces the correct ID, so we check if the user HAS an org
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND organization_id IS NOT NULL 
        AND role IN ('organization', 'team_member', 'admin')
      )
    );

    -- 5. Permissions
    GRANT ALL ON public.equipment TO authenticated;
    GRANT SELECT ON public.equipment TO anon;
    
    -- Force Cache Refresh
    COMMENT ON TABLE public.equipment IS 'Equipment table: RLS fully reset and trigger-enforced organization ownership.';