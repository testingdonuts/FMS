/*
# Re-Grant RPC Function Permissions

This migration addresses the "unable to run query" error by re-applying all necessary `EXECUTE` permissions on the database's Remote Procedure Call (RPC) functions.

## 1. Problem
The application is failing with a generic "unable to run query" error, which typically indicates that the current user's role (e.g., `authenticated`) does not have permission to execute a specific database function it is trying to call. While a previous migration was intended to grant these permissions, this re-grant ensures that the security configuration is correct and up-to-date, resolving any potential inconsistencies.

## 2. Solution
This script explicitly grants `EXECUTE` permissions on all client-facing RPC functions to the appropriate roles. This is a non-destructive, idempotent change that corrects the security configuration without altering any data or business logic.

- **`authenticated` role**: Granted access to all functions required by logged-in users.
- **`anon` role**: Granted access to functions required by unauthenticated users (like invite validation).

## 3. Impact
This change is expected to resolve all "unable to run query" errors related to RPC calls, allowing the application's dashboards and core features to function correctly.
*/

-- Grant permissions for functions used by authenticated users
GRANT EXECUTE ON FUNCTION public.get_booking_stats(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_bookings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_bookings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_rentals(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_rentals(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(uuid, date, date) TO authenticated;

-- Grant permissions for functions that can be called by anonymous users
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO anon;

-- Also grant to service_role for backend access, which is good practice
GRANT EXECUTE ON FUNCTION public.get_booking_stats(uuid, timestamptz, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_organization_bookings(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_parent_bookings(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_parent_rentals(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_organization_rentals(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(uuid, date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO service_role;