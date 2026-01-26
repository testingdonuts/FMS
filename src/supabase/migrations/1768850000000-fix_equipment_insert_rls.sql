/* 
    # Fix Equipment Insertion RLS and CamelCase Mapping
    
    1. Problem:
      - Frontend sends `organizationId`, but DB expects `organization_id`.
      - RLS `WITH CHECK` fails because `organization_id` is NULL on insert.
      - Profile lookups in RLS can sometimes be slow or blocked.
    
    2. Solution:
      - Add `"organizationId"` (quoted camelCase) column to the equipment table.
      - Update the sync trigger to bi-directionally sync `organizationId` and `organization_id`.
      - Refactor RLS to be more resilient during the INSERT phase.
    */

    -- 1. Ensure camelCase Organization ID exists
    DO $$ 
    BEGIN 
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'equipment' AND column_name = 'organizationId'
      ) THEN 
        ALTER TABLE public.equipment ADD COLUMN "organizationId" UUID;
      END IF;
    END $$;

    -- 2. Update the Sync Trigger Function to include Organization ID
    CREATE OR REPLACE FUNCTION public.sync_equipment_compatibility_columns() 
    RETURNS TRIGGER AS $$ 
    BEGIN 
      -- Logic for INSERT: Fill gaps in both directions
      IF (TG_OP = 'INSERT') THEN 
        -- Sync Organization ID (Critical for RLS)
        NEW.organization_id := COALESCE(NEW.organization_id, NEW."organizationId");
        NEW."organizationId" := COALESCE(NEW."organizationId", NEW.organization_id);
        
        -- Sync other fields
        NEW.availability_status := COALESCE(NEW.availability_status, NEW."availabilityStatus", true);
        NEW."availabilityStatus" := COALESCE(NEW."availabilityStatus", NEW.availability_status, true);
        NEW.current_condition := COALESCE(NEW.current_condition, NEW."currentCondition", 'Good');
        NEW."currentCondition" := COALESCE(NEW."currentCondition", NEW.current_condition, 'Good');
        NEW.deposit_amount := COALESCE(NEW.deposit_amount, NEW."depositAmount", 0);
        NEW."depositAmount" := COALESCE(NEW."depositAmount", NEW.deposit_amount, 0);
        NEW.rental_price_per_day := COALESCE(NEW.rental_price_per_day, NEW."rentalPricePerDay", 0);
        NEW."rentalPricePerDay" := COALESCE(NEW."rentalPricePerDay", NEW.rental_price_per_day, 0);
        NEW.image_urls := COALESCE(NEW.image_urls, NEW."imageUrls", '{}');
        NEW."imageUrls" := COALESCE(NEW."imageUrls", NEW.image_urls, '{}');

      -- Logic for UPDATE: Sync changed values
      ELSIF (TG_OP = 'UPDATE') THEN 
        IF (NEW.organization_id IS DISTINCT FROM OLD.organization_id) THEN 
          NEW."organizationId" := NEW.organization_id;
        ELSIF (NEW."organizationId" IS DISTINCT FROM OLD."organizationId") THEN 
          NEW.organization_id := NEW."organizationId";
        END IF;
        
        -- Sync other fields
        IF (NEW.availability_status IS DISTINCT FROM OLD.availability_status) THEN NEW."availabilityStatus" := NEW.availability_status;
        ELSIF (NEW."availabilityStatus" IS DISTINCT FROM OLD."availabilityStatus") THEN NEW.availability_status := NEW."availabilityStatus"; END IF;
        
        IF (NEW.current_condition IS DISTINCT FROM OLD.current_condition) THEN NEW."currentCondition" := NEW.current_condition;
        ELSIF (NEW."currentCondition" IS DISTINCT FROM OLD."currentCondition") THEN NEW.current_condition := NEW."currentCondition"; END IF;
      END IF;
      
      RETURN NEW; 
    END; 
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- 3. Reset and Fix RLS Policies
    ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

    -- Drop existing to ensure clean slate
    DROP POLICY IF EXISTS "equipment_org_all" ON public.equipment;
    DROP POLICY IF EXISTS "Allow org manage equipment" ON public.equipment;
    DROP POLICY IF EXISTS "Orgs can manage their equipment" ON public.equipment;
    DROP POLICY IF EXISTS "Org Management Policy" ON public.equipment;

    -- Create robust combined policy
    CREATE POLICY "org_management_policy" ON public.equipment
    FOR ALL TO authenticated
    USING (
      organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      OR 
      "organizationId" = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
    WITH CHECK (
      -- During INSERT, the trigger hasn't run yet, so we check both possible fields
      organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      OR 
      "organizationId" = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

    -- 4. Ensure permissions
    GRANT ALL ON public.equipment TO authenticated;
    GRANT SELECT ON public.equipment TO anon;