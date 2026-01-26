/* # Fix Equipment Insertion RLS
1. Problem
  - Parents or Organizations attempting to insert equipment receive an RLS violation.
  - This happens because the `organization_id` field in the new row is either NULL or doesn't match the subquery in the RLS policy during the `INSERT` phase.
  - The frontend might be sending `organizationId` (camelCase) while the policy checks `organization_id` (snake_case).

2. Solution
  - Update the `sync_equipment_compatibility_columns` trigger to automatically fetch the `organization_id` from the current user's profile if it's not provided in the insert payload.
  - This ensures that by the time the RLS `WITH CHECK` runs, the column is already populated correctly.
  - Refine the RLS policy to be more resilient.

3. Tables Modified
  - `equipment`
*/

-- 1. Update the Trigger Function to be "RLS-Aware" and Auto-Populate Org ID
CREATE OR REPLACE FUNCTION public.sync_equipment_compatibility_columns() 
RETURNS TRIGGER AS $$ 
DECLARE
  v_user_org_id UUID;
BEGIN 
  -- Fetch the organization_id for the current user once
  SELECT organization_id INTO v_user_org_id FROM public.profiles WHERE id = auth.uid();

  -- Logic for INSERT: Fill gaps and enforce ownership
  IF (TG_OP = 'INSERT') THEN 
    -- 1. Auto-populate organization_id if missing or sync from camelCase
    NEW.organization_id := COALESCE(NEW.organization_id, NEW."organizationId", v_user_org_id);
    NEW."organizationId" := COALESCE(NEW."organizationId", NEW.organization_id);
    
    -- 2. Sync other fields with defaults
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

    -- 3. Security Hardening: Ensure users can't "spoof" another organization's ID
    -- Only allow the override if the user is an admin or the ID matches their own
    IF NEW.organization_id IS DISTINCT FROM v_user_org_id THEN
       NEW.organization_id := v_user_org_id;
       NEW."organizationId" := v_user_org_id;
    END IF;

  -- Logic for UPDATE: Sync changed values
  ELSIF (TG_OP = 'UPDATE') THEN 
    -- Sync Org IDs if changed
    IF (NEW.organization_id IS DISTINCT FROM OLD.organization_id) THEN 
      NEW."organizationId" := NEW.organization_id;
    ELSIF (NEW."organizationId" IS DISTINCT FROM OLD."organizationId") THEN 
      NEW.organization_id := NEW."organizationId";
    END IF;
    
    -- Sync Visibility/Status
    IF (NEW.availability_status IS DISTINCT FROM OLD.availability_status) THEN 
      NEW."availabilityStatus" := NEW.availability_status;
    ELSIF (NEW."availabilityStatus" IS DISTINCT FROM OLD."availabilityStatus") THEN 
      NEW.availability_status := NEW."availabilityStatus"; 
    END IF;
    
    -- Sync Condition
    IF (NEW.current_condition IS DISTINCT FROM OLD.current_condition) THEN 
      NEW."currentCondition" := NEW.current_condition;
    ELSIF (NEW."currentCondition" IS DISTINCT FROM OLD."currentCondition") THEN 
      NEW.current_condition := NEW."currentCondition"; 
    END IF;
  END IF;
  
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Ensure Trigger is correctly attached
DROP TRIGGER IF EXISTS tr_sync_equipment_compatibility ON public.equipment;
CREATE TRIGGER tr_sync_equipment_compatibility 
BEFORE INSERT OR UPDATE ON public.equipment 
FOR EACH ROW EXECUTE FUNCTION public.sync_equipment_compatibility_columns();

-- 3. Simplify and strengthen RLS Policy
-- We drop existing policies to avoid overlapping "OR" conditions that might be broken
DROP POLICY IF EXISTS "org_management_policy" ON public.equipment;
DROP POLICY IF EXISTS "equipment_org_all" ON public.equipment;
DROP POLICY IF EXISTS "Allow org manage equipment" ON public.equipment;
DROP POLICY IF EXISTS "Orgs can manage their equipment" ON public.equipment;

CREATE POLICY "equipment_management_v2" ON public.equipment
FOR ALL TO authenticated
USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
  -- The trigger above ensures organization_id is set correctly before this check runs
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- 4. Ensure public visibility remains intact
DROP POLICY IF EXISTS "Public can view available equipment" ON public.equipment;
DROP POLICY IF EXISTS "public_view_equipment" ON public.equipment;
DROP POLICY IF EXISTS "equipment_public_select" ON public.equipment;

CREATE POLICY "equipment_public_read" ON public.equipment
FOR SELECT TO anon, authenticated
USING (availability_status = true OR "availabilityStatus" = true);