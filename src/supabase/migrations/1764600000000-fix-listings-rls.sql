/*
# Refactor `listings` RLS Policy for Robustness

This migration refactors the Row Level Security (RLS) policy on the `listings` table to resolve a "relation does not exist" error when creating a new listing.

## 1. Problem

When creating a listing, the operation fails with `relation "public.profiles_1738744000000" does not exist`. This indicates that the RLS policy's `WITH CHECK` clause is relying on a broken helper function that references an old, non-existent table name. This is the same root cause that previously affected other tables.

## 2. Solution

This migration replaces the dependency on any potentially faulty helper functions within the `listings` RLS policy. It uses a direct, self-contained subquery to fetch the user's organization ID from their profile: `(SELECT organization_id FROM public.profiles WHERE id=auth.uid())`.

This pattern is more robust as it has no external dependencies, directly resolving the source of the error.

### Changes:
- The old, potentially problematic policy on the `listings` table is dropped.
- A new, robust `FOR ALL` policy is created using the direct subquery pattern, ensuring correct permission checks.

## 3. Impact

This change will resolve the permission errors and allow organization members to create and manage their listings reliably.
*/

-- Drop the old policy to replace it. It is safe to run this even if the policy name varies or doesn't exist.
DROP POLICY IF EXISTS "Orgs can manage their listings" ON public.listings;

-- Create a new, robust policy using a direct subquery to avoid function-related issues.
CREATE POLICY "Orgs can manage their listings" ON public.listings
  FOR ALL
  USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );