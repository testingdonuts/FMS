/*
# Definitive Fix for Equipment Booking RLS Error

This migration provides a comprehensive and final fix for the recurring "relation does not exist" error that occurs when a parent attempts to book a piece of equipment.

## 1. Problem
When a user tries to rent equipment, the `INSERT` operation into the `equipment_rentals` table fails with `relation "public.profiles_1738744000000" does not exist`. This error indicates that a Row Level Security (RLS) policy check is executing a broken helper function (`get_user_organization_id`) that contains a stale, hardcoded reference to a non-existent table.

This happens because:
1. The old RLS policy for organizations on `equipment_rentals` uses this broken function.
2. The RLS policy for parents was missing a `WITH CHECK` clause, which may cause the database to evaluate other policies, triggering the broken one.

## 2. Solution
This migration takes a definitive two-step approach to resolve the issue permanently:

1.  **Drop Helper Functions**: It explicitly DROPS the broken helper functions (`get_user_organization_id` and `get_user_role`). This is the most critical step, as it removes the source of the invalid SQL and ensures they cannot be called by any policy.
2.  **Recreate All Policies**: It then drops and recreates **all** RLS policies on the `equipment_rentals` table to be complete, correct, and independent of any helper functions.
    - The policy for parents is updated to include a `WITH CHECK` clause, ensuring their inserts are validated correctly.
    - The policy for organizations is rewritten to use a direct subquery, making it robust.

## 3. Impact
This change will resolve the "relation does not exist" error, unblocking the equipment rental workflow for all users. The RLS policies will be more secure, explicit, and resilient against future schema changes.
*/

-- Step 1: Drop all potentially stale helper functions to ensure they cannot be used or cause migration failures.
DROP FUNCTION IF EXISTS public.get_user_organization_id(UUID);
DROP FUNCTION IF EXISTS public.get_user_role(UUID);

-- Step 2: Drop and recreate all RLS policies on `equipment_rentals` for a clean, robust state.

-- Drop existing policies to prevent conflicts.
DROP POLICY IF EXISTS "Parents can manage own rentals" ON public.equipment_rentals;
DROP POLICY IF EXISTS "Orgs can manage their rentals" ON public.equipment_rentals;

-- Recreate the policy for parents, adding the crucial WITH CHECK clause.
CREATE POLICY "Parents can manage own rentals"
ON public.equipment_rentals
FOR ALL
USING (auth.uid() = parent_id)
WITH CHECK (auth.uid() = parent_id);

-- Recreate the policy for organizations using a direct subquery.
CREATE POLICY "Orgs can manage their rentals"
ON public.equipment_rentals
FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.equipment e
        WHERE e.id = equipment_rentals.equipment_id AND e.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.equipment e
        WHERE e.id = equipment_id AND e.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
);