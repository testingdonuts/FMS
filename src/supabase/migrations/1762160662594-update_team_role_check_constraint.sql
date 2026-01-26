/*
# Fix Team Role Check Constraints

This migration addresses a bug where sending a team invitation failed due to a `CHECK` constraint violation on the `role` column.

## 1. Problem

The `team_invites_role_check` and `team_members_role_check` constraints were not being correctly enforced, causing valid roles like 'technician' to be rejected upon insertion. This prevented new team members from being invited.

## 2. Solution

This script provides a definitive fix by dropping the existing constraints on both the `team_invites` and `team_members` tables and then re-creating them with the correct, explicit list of allowed values: 'technician', 'manager', and 'staff'.

This ensures the database schema is perfectly aligned with the application's business logic, resolving the invitation failure. The operations are idempotent and safe to run.
*/

-- Step 1: Correct the CHECK constraint for the `team_invites` table.
-- Drop the existing constraint if it exists to prevent errors on re-run.
ALTER TABLE public.team_invites DROP CONSTRAINT IF EXISTS team_invites_role_check;

-- Re-add the constraint with the correct, explicit list of allowed roles.
ALTER TABLE public.team_invites ADD CONSTRAINT team_invites_role_check
CHECK (role IN ('technician', 'manager', 'staff'));

-- Step 2: Correct the CHECK constraint for the `team_members` table.
-- Drop the existing constraint if it exists.
ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_role_check;

-- Re-add the constraint to ensure consistency.
ALTER TABLE public.team_members ADD CONSTRAINT team_members_role_check
CHECK (role IN ('technician', 'manager', 'staff'));