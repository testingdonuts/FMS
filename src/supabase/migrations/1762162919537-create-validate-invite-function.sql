/*
# Create RPC Function for Invite Validation

This migration creates a new RPC function `validate_invite_code` to securely validate a team invitation code.

## 1. Problem
The previous implementation for validating an invitation code was done on the client-side. This required read access to the `team_invites` table for unauthenticated users. The existing Row Level Security (RLS) policies were too restrictive and blocked these requests, leading to "Invalid or expired invitation code" errors for new users trying to sign up or accept an invite. Opening up the `team_invites` table to public access would be a security risk, potentially exposing sensitive information like email addresses.

## 2. Solution
This migration creates a PostgreSQL function `validate_invite_code` with `SECURITY DEFINER` privileges. This allows the function to bypass RLS policies and query the `team_invites` table with the database owner's permissions. The function takes an `invite_code` as input and returns the relevant invitation details (`email`, `role`, `organization_id`, and `organization_name`) only if the code is valid, pending, and not expired.

By moving this logic to a database function that can be called via RPC, we keep the `team_invites` table secure while providing a safe endpoint for the application to validate codes.

## 3. Security Impact
- The `team_invites` table remains protected by RLS.
- The RPC function only exposes necessary data for valid codes.
- This is a more secure approach than loosening RLS policies on the table itself.
*/

CREATE OR REPLACE FUNCTION validate_invite_code(p_invite_code TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  role TEXT,
  organization_id UUID,
  organization_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ti.id,
    ti.email,
    ti.role,
    ti.organization_id,
    o.name AS organization_name
  FROM public.team_invites ti
  JOIN public.organizations o ON ti.organization_id = o.id
  WHERE ti.invite_code = p_invite_code
    AND ti.status = 'pending'
    AND ti.expires_at > NOW();
END;
$$;