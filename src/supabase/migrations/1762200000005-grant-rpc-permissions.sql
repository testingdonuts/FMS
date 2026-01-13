/*
# Grant RPC Function Permissions

This migration addresses the root cause of the persistent "unable to run query" errors by granting the necessary execution permissions on several Remote Procedure Call (RPC) functions.

## 1. Problem
While the logic of the RPC functions was correct and they were defined with `SECURITY DEFINER` to bypass Row Level Security (RLS), the database roles used by the application (like `authenticated` and `anon`) were never explicitly given permission to *execute* these functions. This is a common oversight in PostgreSQL database management. When the application attempted to call an RPC function, the database would reject the request due to lack of permissions, resulting in a generic failure that the client library reported as "unable to run query".

## 2. Solution
This migration script explicitly grants `EXECUTE` permissions on all client-facing RPC functions to the appropriate roles:
- **`authenticated` role**: Granted access to functions required by logged-in users on their dashboards (e.g., fetching bookings, rentals, stats).
- **`anon` role**: Granted access to the `validate_invite_code` function, which is required by unauthenticated users during the team invitation acceptance process.

This is a non-destructive, idempotent change that corrects the security configuration without altering any data or business logic.

## 3. Impact
This change is expected to resolve all "unable to run query" errors related to RPC calls. The application's dashboards and invitation flows should now function correctly and reliably for all users.
*/

-- Grant permissions for functions used by authenticated users
GRANT EXECUTE ON FUNCTION public.get_booking_stats(uuid, timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_bookings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_bookings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_rentals(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_rentals(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(uuid, date, date) TO authenticated;

-- Grant permissions for functions that can be called by anonymous users (e.g., invite page)
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO anon;

-- Also grant to service_role for backend access, which is good practice
GRANT EXECUTE ON FUNCTION public.get_booking_stats(uuid, timestamptz, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_organization_bookings(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_parent_bookings(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_parent_rentals(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_organization_rentals(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(uuid, date, date) TO service_role;
GRANT EXECUTE ON FUNCTION public.validate_invite_code(text) TO service_role;