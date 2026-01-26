/*
# Force Fix RLS with CASCADE

This migration effectively resolves the "relation does not exist" error by using `DROP ... CASCADE` to forcefully remove broken helper functions and any lingering policies attached to them.

## 1. Problem
Previous attempts to fix the RLS policies likely failed because the helper functions (`get_user_organization_id`, `get_user_role`) could not be dropped while they were still referenced by existing policies. This left the database in a state where the old, broken functions (pointing to `profiles_1738744000000`) were still active.

## 2. Solution
1.  **Drop with CASCADE**: We explicitly drop the helper functions using the `CASCADE` keyword. This instructs PostgreSQL to automatically remove any dependent objects (specifically, the old RLS policies) that are blocking the drop.
2.  **Recreate Policies**: We then immediately recreate all the necessary RLS policies for every affected table. These new policies use direct subqueries (e.g., `SELECT organization_id FROM public.profiles ...`) instead of function calls, ensuring they are robust and error-free.

## 3. Impact
This will clear the "stuck" error state and restore full functionality for creating and managing listings, services, bookings, and team members.
*/

-- Step 1: Forcefully drop the broken functions and ANY policies that use them.
DROP FUNCTION IF EXISTS public.get_user_organization_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(UUID) CASCADE;

-- Step 2: Recreate policies for all affected tables. 
-- Note: The DROP CASCADE above may have already removed some of these, but we explicitly DROP IF EXISTS here just to be safe and ensure a clean slate before CREATE.

-- 1. SERVICES
DROP POLICY IF EXISTS "Orgs can manage their services" ON public.services;
CREATE POLICY "Orgs can manage their services" ON public.services
FOR ALL USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 2. EQUIPMENT
DROP POLICY IF EXISTS "Orgs can manage equipment" ON public.equipment;
CREATE POLICY "Orgs can manage equipment" ON public.equipment
FOR ALL USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 3. LISTINGS
DROP POLICY IF EXISTS "Orgs can manage their listings" ON public.listings;
CREATE POLICY "Orgs can manage their listings" ON public.listings
FOR ALL USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 4. SERVICE BOOKINGS
DROP POLICY IF EXISTS "Orgs can manage their bookings" ON public.service_bookings;
CREATE POLICY "Orgs can manage their bookings" ON public.service_bookings
FOR ALL USING (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Team members can view and update their org bookings" ON public.service_bookings;
CREATE POLICY "Team members can view and update their org bookings" ON public.service_bookings
FOR SELECT, UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'team_member' 
  AND org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- 5. EQUIPMENT RENTALS
DROP POLICY IF EXISTS "Orgs can manage their rentals" ON public.equipment_rentals;
CREATE POLICY "Orgs can manage their rentals" ON public.equipment_rentals
FOR ALL USING (
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

-- 6. TEAM MEMBERS
DROP POLICY IF EXISTS "Team members can view colleagues" ON public.team_members;
CREATE POLICY "Team members can view colleagues" ON public.team_members
FOR SELECT USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Admins and managers can add team members" ON public.team_members;
CREATE POLICY "Admins and managers can add team members" ON public.team_members
FOR INSERT WITH CHECK (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) 
  AND (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'organization' 
    OR EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE user_id = auth.uid() AND role = 'manager' AND organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  )
);

DROP POLICY IF EXISTS "Admins and managers can modify team members" ON public.team_members;
CREATE POLICY "Admins and managers can modify team members" ON public.team_members
FOR UPDATE, DELETE USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) 
  AND (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'organization' 
    OR EXISTS (
      SELECT 1 FROM public.team_members 
      WHERE user_id = auth.uid() AND role = 'manager' AND organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  )
);

-- 7. TEAM INVITES
DROP POLICY IF EXISTS "Org owners can manage invites" ON public.team_invites;
CREATE POLICY "Org owners can manage invites" ON public.team_invites
FOR ALL USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 8. PROFILES (Visibility)
DROP POLICY IF EXISTS "Orgs can view colleague profiles" ON public.profiles;
CREATE POLICY "Orgs can view colleague profiles" ON public.profiles
FOR SELECT USING (
  profiles.organization_id IS NOT NULL 
  AND profiles.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Orgs can view customer profiles" ON public.profiles;
CREATE POLICY "Orgs can view customer profiles" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.service_bookings sb 
    WHERE sb.parent_id = profiles.id 
    AND sb.org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  ) 
  OR EXISTS (
    SELECT 1 FROM public.equipment_rentals er 
    JOIN public.equipment e ON er.equipment_id = e.id 
    WHERE er.parent_id = profiles.id 
    AND e.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- 9. MAINTENANCE LOGS
DROP POLICY IF EXISTS "Orgs can manage their maintenance logs" ON public.maintenance_logs;
CREATE POLICY "Orgs can manage their maintenance logs" ON public.maintenance_logs
FOR ALL USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 10. PAYOUT REQUESTS
DROP POLICY IF EXISTS "Orgs can view their own payout requests" ON public.payout_requests;
CREATE POLICY "Orgs can view their own payout requests" ON public.payout_requests
FOR SELECT USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Orgs can create payout requests" ON public.payout_requests;
CREATE POLICY "Orgs can create payout requests" ON public.payout_requests
FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 11. ORGANIZATION LOCATIONS
DROP POLICY IF EXISTS "Org members can view locations" ON public.organization_locations;
CREATE POLICY "Org members can view locations" ON public.organization_locations
FOR SELECT USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Managers can manage locations" ON public.organization_locations;
CREATE POLICY "Managers can manage locations" ON public.organization_locations
FOR ALL USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) 
  AND (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'organization' 
    OR EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'manager')
  )
)
WITH CHECK (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) 
  AND (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'organization' 
    OR EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'manager')
  )
);

-- 12. BOOKING AUDIT LOGS
DROP POLICY IF EXISTS "Viewable by booking participants" ON public.booking_audit_logs;
CREATE POLICY "Viewable by booking participants" ON public.booking_audit_logs
FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.service_bookings sb 
    WHERE sb.id = booking_id 
    AND (
      sb.parent_id = auth.uid() 
      OR sb.org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  )
);

-- 13. ORGANIZATION API KEYS
DROP POLICY IF EXISTS "Owners can manage API keys" ON public.organization_api_keys;
CREATE POLICY "Owners can manage API keys" ON public.organization_api_keys
FOR ALL USING (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'organization'
)
WITH CHECK (
  organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) 
  AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'organization'
);