/*
# Fix RLS Policies for Data Visibility

This migration addresses critical data visibility issues for both parents and organizations by refining the Row Level Security (RLS) policies.

## 1. Problem
- **Parents**: Parents were unable to see their past or current bookings if the associated service was later deactivated by the organization. The existing RLS policy on the `services` table only allowed viewing of `active` services.
- **Organizations**: Organizations could not see the full profile details (like name and email) of the parents who booked services with them. The RLS policy on the `profiles` table was too restrictive, only allowing users to see their own profile.

## 2. Solution
This migration introduces new, more permissive `SELECT` policies that work in conjunction with the existing ones. Since multiple `SELECT` policies are combined with an `OR` condition, a user can see a row if they meet the criteria of *any* of the policies.

### New Policies Added:
1.  **On `services` table**:
    - A new policy allows users to view services that are linked to their own bookings, regardless of the service's `is_active` status. This ensures parents can always see their complete booking history.

2.  **On `profiles` table**:
    - A new policy allows organization members to view the profiles of any user who has a booking with their organization.
    - A corresponding policy is added for equipment rentals to ensure customer profiles are also visible there.
    - A policy to allow team members to see profiles of other members in the same organization.

## 3. Security Impact
These changes expand read access in specific, controlled scenarios, resolving the data visibility bugs without compromising the overall security model. Users can still only see data that is relevant to them.
*/

-- Allow users to see services linked to their own bookings, even if inactive
CREATE POLICY "Users can view services linked to their bookings" ON public.services
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.service_bookings
    WHERE service_bookings.service_id = services.id AND service_bookings.parent_id = auth.uid()
  )
);

-- Allow organization members to view profiles of users who have booked with them
CREATE POLICY "Orgs can view profiles of their customers (bookings)" ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.service_bookings
    WHERE service_bookings.parent_id = profiles.id AND service_bookings.org_id = get_user_organization_id(auth.uid())
  )
);

-- Allow organization members to view profiles of users who have rented from them
CREATE POLICY "Orgs can view profiles of their customers (rentals)" ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.equipment_rentals
    JOIN public.equipment ON equipment_rentals.equipment_id = equipment.id
    WHERE equipment_rentals.parent_id = profiles.id AND equipment.organization_id = get_user_organization_id(auth.uid())
  )
);

-- Allow team members to view profiles of other members in the same organization
CREATE POLICY "Team members can view profiles of their colleagues" ON public.profiles
FOR SELECT
USING (
    profiles.organization_id IS NOT NULL AND
    profiles.organization_id = get_user_organization_id(auth.uid())
);