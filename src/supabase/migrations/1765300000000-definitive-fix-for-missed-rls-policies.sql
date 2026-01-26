/*
# Definitive Fix for Missed RLS Policies

This migration provides a comprehensive and final fix for the recurring "unable to run query" and "relation does not exist" errors by eliminating all remaining dependencies on broken helper functions within the database's Row Level Security (RLS) policies.

## 1. Problem
Despite previous refactoring efforts,some RLS policies were missed and still contained calls to helper functions (`get_user_organization_id`, `get_user_role`) that reference a non-existent table (`public.profiles_1738744000000`). This causes any query that triggers these policies to fail.

The two policies causing the current errors are:
1.  **On `booking_audit_logs`**: The policy to determine if a user can view an audit trail for a booking.
2.  **On `organization_api_keys`**: The policy to check if a user can manage API keys for their organization.

## 2. Solution
This migration takes a definitive two-step approach to resolve the issue permanently:

1.  **Drop Helper Functions**: It explicitly DROPS the broken helper functions. This is the most critical step,as it removes the source of the invalid SQL and ensures they cannot be called by any policy.
2.  **Recreate Missed Policies**: It then drops and recreates the two faulty RLS policies using direct,self-contained subqueries. This makes the policies robust and independent of any helper functions,guaranteeing they query against the correct `public.profiles` table.

## 3. Impact
This change will resolve the final "unable to run query" errors,unblocking the "Activity History" and "Developer API" sections of the application. The RLS policies will be more secure,explicit,and resilient against future schema changes.
*/

-- Step 1: Drop all potentially stale helper functions to ensure they cannot be used or cause migration failures.
DROP FUNCTION IF EXISTS public.get_user_organization_id(UUID);
DROP FUNCTION IF EXISTS public.get_user_role(UUID);

-- Step 2: Refactor the RLS policy for `booking_audit_logs`.
DROP POLICY IF EXISTS "Viewable by booking participants" ON public.booking_audit_logs;
CREATE POLICY "Viewable by booking participants"
ON public.booking_audit_logs
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.service_bookings sb
    WHERE sb.id = booking_id AND (
      sb.parent_id = auth.uid()
      OR sb.org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
  )
);

-- Step 3: Refactor the RLS policy for `organization_api_keys`.
DROP POLICY IF EXISTS "Owners can manage API keys" ON public.organization_api_keys;
CREATE POLICY "Owners can manage API keys"
ON public.organization_api_keys
FOR ALL
USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'organization'
)
WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'organization'
);