/*
# Fix Booking Visibility and Joins

This migration addresses two critical issues preventing bookings from appearing in the UI for both parents and organizations.

## 1. Problem

- **Organizations**: Could not see bookings linked to services that were marked as inactive (`is_active = false`). The RLS policy on the `services` table was too restrictive, causing the database join to fail and the entire booking row to be dropped from the results.
- **Parents & Organizations**: The application query to fetch bookings attempted to join the `profiles` table using a foreign key hint (`parent:profiles!parent_id(*)`). However, the foreign key on `service_bookings.parent_id` points to `auth.users`, not `public.profiles`, causing this join to fail and drop the booking row.

## 2. Solution

This migration implements two fixes:

1.  **New RLS Policy for `services`**: A new `SELECT` policy is added to the `services` table. It allows organization members to view **any** service belonging to their organization, regardless of its `is_active` status. This ensures that joins for past bookings on inactive services will succeed.

2.  **New RLS Policy for `profiles`**: A new, more direct `SELECT` policy is added to the `profiles` table. It allows organization members to view the profiles of any user associated with their organization as a team member. This works with the existing customer policy to ensure all related user data is visible.

These database changes, combined with a corresponding update in the application's data service file (`bookingService.js`), will resolve the visibility issues.
*/

-- 1. Add a new RLS policy to allow organizations to view all their own services, active or not.
-- This ensures that joins on `service_bookings` don't fail for bookings linked to inactive services.
CREATE POLICY "Orgs can view their own services"
ON public.services
FOR SELECT
USING (organization_id = get_user_organization_id(auth.uid()));

-- 2. Add a policy to allow org members to see profiles of their teammates.
-- This is a good practice and complements the existing customer visibility policies.
CREATE POLICY "Team members can view colleague profiles"
ON public.profiles
FOR SELECT
USING (
  (COALESCE(organization_id, '00000000-0000-0000-0000-000000000000') = get_user_organization_id(auth.uid()))
);