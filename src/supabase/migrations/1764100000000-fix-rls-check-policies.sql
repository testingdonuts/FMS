/*
    # Refactor RLS Policies for Robustness

    This migration refactors the Row Level Security (RLS) policies on the `services` and `equipment` tables to resolve persistent "permission denied" errors when creating or managing records.

    ## 1. Problem
    The existing `INSERT` and `UPDATE` policies relied on a helper function (`get_user_organization_id`) to verify permissions. In some environments, this function reference can become stale or point to an incorrect schema object, causing the RLS check to fail unexpectedly. The user reported that a fix for this function did not solve the problem, indicating a more resilient solution is needed.

    ## 2. Solution
    This migration replaces the dependency on the helper function within the RLS policies. Instead, it uses a direct, self-contained subquery to fetch the user's organization ID from their profile:
    `(SELECT organization_id FROM public.profiles WHERE id = auth.uid())`

    This pattern is already used in other policies (e.g., on the `listings` table) and is more robust because it has no external function dependencies, directly resolving the source of the error.

    ### Changes:
    1.  **On `services` table**:
        - The old, function-dependent policy is dropped.
        - A new, robust `FOR ALL` policy is created using the subquery pattern.

    2.  **On `equipment` table**:
        - The old, function-dependent policy is dropped.
        - A new, robust `FOR ALL` policy is created using the same subquery pattern.

    ## 3. Impact
    This change will resolve the permission errors and allow organization members to create and manage their services and equipment reliably.
    */

    -- Step 1: Refactor RLS policy for the `services` table.

    -- Drop the old policies to replace them.
    DROP POLICY IF EXISTS "Org team can manage services" ON public.services;
    DROP POLICY IF EXISTS "Orgs can manage their services" ON public.services;

    -- Create a new, robust policy using the subquery pattern, consistent with the `listings` table.
    CREATE POLICY "Orgs can manage their services"
    ON public.services
    FOR ALL
    USING (
      organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
    WITH CHECK (
      organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );


    -- Step 2: Refactor RLS policy for the `equipment` table.

    -- Drop the old, function-dependent policy.
    DROP POLICY IF EXISTS "Orgs can manage equipment" ON public.equipment;

    -- Create a new, robust policy using the subquery pattern.
    CREATE POLICY "Orgs can manage equipment"
    ON public.equipment
    FOR ALL
    USING (
      organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    )
    WITH CHECK (
      organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );