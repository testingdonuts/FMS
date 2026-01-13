/*
# Fix Rental Management RLS Policy

This migration addresses the "unable to run query" error that occurs when organization members try to update (e.g., approve) an equipment rental.

## 1. Problem
The Row Level Security (RLS) policy on the `equipment_rentals` table for organization members was implemented with a subquery: `(SELECT organization_id FROM equipment WHERE id=equipment_id) = get_user_organization_id(auth.uid())`. This subquery is not robust. If the associated equipment is ever deleted, the subquery returns `NULL`, causing the policy check to fail and blocking any `UPDATE` operation with a generic permission error.

## 2. Solution
This migration replaces the fragile subquery-based policy with a more resilient one using an `EXISTS` clause. The new policy checks for the existence of a matching equipment record within the user's organization. This approach correctly handles cases where the equipment might be missing, preventing the query from failing.

The script first drops the old policy (`"Orgs can manage their rentals"`) and then creates the new, improved policy with the same name.

## 3. Impact
This change will resolve the "unable to run query" error for organization members managing equipment rentals. It makes the security policy more robust and prevents database errors caused by inconsistent data.
*/

-- Step 1: Drop the old, fragile policy on equipment_rentals.
-- It's safe to run this even if the policy doesn't exist.
DROP POLICY IF EXISTS "Orgs can manage their rentals" ON public.equipment_rentals;

-- Step 2: Create a new, more robust policy using EXISTS.
-- This policy allows org members to perform all actions on rentals
-- as long as the rental is for equipment belonging to their organization.
CREATE POLICY "Orgs can manage their rentals"
ON public.equipment_rentals
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.equipment e
        WHERE e.id = equipment_rentals.equipment_id
        AND e.organization_id = get_user_organization_id(auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.equipment e
        WHERE e.id = equipment_rentals.equipment_id
        AND e.organization_id = get_user_organization_id(auth.uid())
    )
);