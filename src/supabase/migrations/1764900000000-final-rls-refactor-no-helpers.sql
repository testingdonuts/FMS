/*
# Final RLS Refactor to Eliminate All Helper Function Dependencies

This migration provides a definitive and comprehensive fix for recurring "unable to run query" and "relation does not exist" errors by systematically removing **all** dependencies on helper functions from Row Level Security (RLS) policies.

## 1. Problem

Despite previous fixes, errors persist, indicating that RLS policies still rely on stale or broken helper functions (`get_user_organization_id`, `get_user_role`) that contain invalid references to old table names. This creates a fragile system where a single point of failure can block essential operations. The failure of the previous migration script itself indicates that even the act of creating a policy that references a broken function causes an error.

## 2. Solution

This migration takes the most robust approach possible:

1.  **Drop All Helper Functions**: It begins by explicitly dropping `get_user_organization_id` and `get_user_role` to ensure they can no longer be used.
2.  **Refactor All Policies**: It then refactors **every** organization-related RLS policy to use direct, self-contained subqueries instead of function calls.
    - `get_user_organization_id(auth.uid())` is replaced with `(SELECT organization_id FROM public.profiles WHERE id = auth.uid())`
    - `get_user_role(auth.uid())` is replaced with `(SELECT role FROM public.profiles WHERE id = auth.uid())`
3.  **Explicit `WITH CHECK`**: All `FOR ALL` policies now include an explicit `WITH CHECK` clause for clarity and correctness, ensuring `INSERT` and `UPDATE` operations are secure.

This completely removes the points of failure, making the security policies independent and resilient.

## 3. Impact

This definitive fix will resolve the persistent permission errors across the entire application, ensuring that all data access checks are reliable, correct, and no longer dependent on potentially stale database objects.
*/

-- Step 1: Drop all potentially stale helper functions to ensure they are not used.
DROP FUNCTION IF EXISTS public.get_user_organization_id(UUID);
DROP FUNCTION IF EXISTS public.get_user_role(UUID);

-- Step 2: Re-apply all RLS policies using only direct subqueries.

-- == Refactor RLS for `services` ==
DROP POLICY IF EXISTS "Orgs can manage their services" ON public.services;
CREATE POLICY "Orgs can manage their services"
  ON public.services FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- == Refactor RLS for `equipment` ==
DROP POLICY IF EXISTS "Orgs can manage equipment" ON public.equipment;
CREATE POLICY "Orgs can manage equipment"
  ON public.equipment FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- == Refactor RLS for `listings` ==
DROP POLICY IF EXISTS "Orgs can manage their listings" ON public.listings;
CREATE POLICY "Orgs can manage their listings"
  ON public.listings FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- == Refactor RLS for `service_bookings` ==
DROP POLICY IF EXISTS "Orgs can manage their bookings" ON public.service_bookings;
CREATE POLICY "Orgs can manage their bookings"
  ON public.service_bookings FOR ALL
  USING (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Team members can view and update their org bookings" ON public.service_bookings;
CREATE POLICY "Team members can view and update their org bookings"
  ON public.service_bookings FOR SELECT, UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'team_member' AND
    org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- == Refactor RLS for `equipment_rentals` ==
DROP POLICY IF EXISTS "Orgs can manage their rentals" ON public.equipment_rentals;
CREATE POLICY "Orgs can manage their rentals"
  ON public.equipment_rentals FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.equipment e
      WHERE e.id = equipment_rentals.equipment_id
      AND e.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.equipment e
      WHERE e.id = equipment_id
      AND e.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- == Refactor RLS for `team_members` ==
DROP POLICY IF EXISTS "Team members can view colleagues" ON public.team_members;
CREATE POLICY "Team members can view colleagues"
  ON public.team_members FOR SELECT
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins and managers can add team members" ON public.team_members;
CREATE POLICY "Admins and managers can add team members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) AND
    (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'organization' OR
      EXISTS (
        SELECT 1 FROM public.team_members
        WHERE user_id = auth.uid()
        AND role = 'manager'
        AND organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS "Admins and managers can modify team members" ON public.team_members;
CREATE POLICY "Admins and managers can modify team members"
  ON public.team_members FOR UPDATE, DELETE
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) AND
    (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'organization' OR
      EXISTS (
        SELECT 1 FROM public.team_members
        WHERE user_id = auth.uid()
        AND role = 'manager'
        AND organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
      )
    )
  );

-- == Refactor RLS for `team_invites` ==
DROP POLICY IF EXISTS "Org owners can manage invites" ON public.team_invites;
CREATE POLICY "Org owners can manage invites"
  ON public.team_invites FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- == Refactor RLS for `profiles` (visibility policies) ==
DROP POLICY IF EXISTS "Orgs can view colleague profiles" ON public.profiles;
CREATE POLICY "Orgs can view colleague profiles"
  ON public.profiles FOR SELECT
  USING (
    profiles.organization_id IS NOT NULL AND
    profiles.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Orgs can view customer profiles" ON public.profiles;
CREATE POLICY "Orgs can view customer profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_bookings sb
      WHERE sb.parent_id = profiles.id
      AND sb.org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM public.equipment_rentals er
      JOIN public.equipment e ON er.equipment_id = e.id
      WHERE er.parent_id = profiles.id
      AND e.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- == Refactor RLS for `maintenance_logs` ==
DROP POLICY IF EXISTS "Orgs can manage their maintenance logs" ON public.maintenance_logs;
CREATE POLICY "Orgs can manage their maintenance logs"
  ON public.maintenance_logs FOR ALL
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- == Refactor RLS for `payout_requests` ==
DROP POLICY IF EXISTS "Orgs can view their own payout requests" ON public.payout_requests;
CREATE POLICY "Orgs can view their own payout requests"
  ON public.payout_requests FOR SELECT
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Orgs can create payout requests" ON public.payout_requests;
CREATE POLICY "Orgs can create payout requests"
  ON public.payout_requests FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- == Refactor RLS for `organization_locations` ==
DROP POLICY IF EXISTS "Org members can view locations" ON public.organization_locations;
CREATE POLICY "Org members can view locations"
  ON public.organization_locations FOR SELECT
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Managers can manage locations" ON public.organization_locations;
CREATE POLICY "Managers can manage locations"
  ON public.organization_locations FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) AND
    (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'organization' OR
      EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'manager')
    )
  )
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) AND
    (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'organization' OR
      EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'manager')
    )
  );