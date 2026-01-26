-- Fix equipment RLS to allow organization owners to view their equipment
-- even if organization_id on profile wasn't set properly

-- Drop existing policies
DROP POLICY IF EXISTS "equipment_public_read_v3" ON public.equipment;
DROP POLICY IF EXISTS "equipment_org_management_v3" ON public.equipment;
DROP POLICY IF EXISTS "equipment_management_v2" ON public.equipment;
DROP POLICY IF EXISTS "equipment_public_read" ON public.equipment;

-- Create a helper function to get the user's organization ID (handles owners + members)
CREATE OR REPLACE FUNCTION public.get_user_org_id_v2(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- First check profile.organization_id (for team members and properly set org owners)
  SELECT organization_id INTO v_org_id 
  FROM public.profiles 
  WHERE id = p_user_id AND organization_id IS NOT NULL;
  
  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;
  
  -- Fallback: check if user owns an organization
  SELECT id INTO v_org_id 
  FROM public.organizations 
  WHERE owner_id = p_user_id
  LIMIT 1;
  
  RETURN v_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- A. Public can view available equipment
CREATE POLICY "equipment_public_view" ON public.equipment
FOR SELECT TO anon, authenticated
USING (
  availability_status = true 
  OR "availabilityStatus" = true
);

-- B. Organization owners and team members can manage their equipment
CREATE POLICY "equipment_org_manage" ON public.equipment
FOR ALL TO authenticated
USING (
  organization_id = get_user_org_id_v2(auth.uid())
)
WITH CHECK (
  organization_id = get_user_org_id_v2(auth.uid())
);

-- Also fix the profiles table if organization_id is null for org owners
-- This updates existing org owners whose profiles don't have organization_id set
UPDATE public.profiles p
SET organization_id = o.id
FROM public.organizations o
WHERE p.id = o.owner_id
  AND p.organization_id IS NULL
  AND p.role = 'organization';

SELECT 'Equipment RLS fixed for organization owners' AS message;
