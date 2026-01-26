-- If team members are still not loading, run this to fix RLS
-- This creates the helper function and explicit policies for organization members

-- Step 1: Create the helper function if it doesn't exist
CREATE OR REPLACE FUNCTION public.get_user_organization_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM public.profiles
  WHERE id = user_id
  LIMIT 1;
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Enable RLS on team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop the old combined policy if it exists
DROP POLICY IF EXISTS "Org members can fully manage their team" ON team_members;

-- Step 4: Create separate policies for better clarity
CREATE POLICY "Users can view team members of their org"
ON team_members
FOR SELECT
USING (
  organization_id = public.get_user_organization_id(auth.uid())
);

CREATE POLICY "Org members can insert team members"
ON team_members
FOR INSERT
WITH CHECK (
  organization_id = public.get_user_organization_id(auth.uid())
);

CREATE POLICY "Org members can update team members"
ON team_members
FOR UPDATE
USING (organization_id = public.get_user_organization_id(auth.uid()))
WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));

CREATE POLICY "Org members can delete team members"
ON team_members
FOR DELETE
USING (organization_id = public.get_user_organization_id(auth.uid()));

-- Step 5: Verify the policies are in place
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'team_members';
