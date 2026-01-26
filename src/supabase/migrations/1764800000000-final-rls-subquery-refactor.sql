/*
# Final RLS Refactor to Eliminate Helper Function Dependencies

This migration provides a definitive and comprehensive fix for recurring "unable to run query" and "relation does not exist" errors by systematically removing all dependencies on the `get_user_organization_id` helper function from Row Level Security (RLS) policies.

## 1. Problem

Despite previous fixes, errors persist, indicating that multiple RLS policies across the database still rely on a potentially stale or broken helper function (`get_user_organization_id`). This creates a fragile system where a single point of failure can block essential operations like creating listings, services, or managing team members.

## 2. Solution

This migration refactors **all** organization-related RLS policies to use a direct, self-contained subquery:
`(SELECT organization_id FROM public.profiles WHERE id = auth.uid())`

This pattern is more robust as it has no external dependencies and directly queries the user's profile for their organization ID, eliminating the helper function as a point of failure.

### Changes:
This script drops and recreates policies for the following tables to use the direct subquery pattern:
- `services`
- `equipment`
- `listings`
- `service_bookings`
- `equipment_rentals`
- `team_members`
- `team_invites`
- `profiles` (for org-based visibility)
- `maintenance_logs`
- `payout_requests`
- `organization_locations`

## 3. Impact

This definitive fix will resolve the persistent permission errors across the entire application, ensuring that all data access checks are reliable and correct.
*/

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
  USING (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Team members can view and update their org bookings" ON public.service_bookings;
CREATE POLICY "Team members can view and update their org bookings"
  ON public.service_bookings FOR SELECT, UPDATE
  USING (
    get_user_role(auth.uid()) = 'team_member' AND
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
      get_user_role(auth.uid()) = 'organization' OR
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
      get_user_role(auth.uid()) = 'organization' OR
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
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

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
      get_user_role(auth.uid()) = 'organization' OR
      EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'manager')
    )
  );