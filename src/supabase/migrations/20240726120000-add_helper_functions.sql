/*
# Add Helper Functions

This migration adds essential helper functions to the database to support application logic and RLS policies.

1.  **New Functions**
    -   `get_booking_stats(org_id, from_date, to_date)`: This function calculates key metrics for the organization dashboard, including total bookings, completed bookings, pending bookings, and total revenue within a specified date range. This was missing and caused RPC errors.
    -   `get_user_role(user_id)`: A utility function to securely retrieve a user's role from their profile. This is useful for building more complex Row Level Security policies.

2.  **Security**
    -   Both functions are created with `SECURITY DEFINER` to ensure they can access the necessary tables without being blocked by the calling user's RLS policies.
*/

-- Function to get booking statistics for the organization dashboard
CREATE OR REPLACE FUNCTION get_booking_stats(
  org_id UUID,
  from_date TIMESTAMPTZ,
  to_date TIMESTAMPTZ
) RETURNS TABLE (
  totalBookings BIGINT,
  completedBookings BIGINT,
  pendingBookings BIGINT,
  totalRevenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) AS totalBookings,
    COUNT(*) FILTER (WHERE sb.status = 'completed') AS completedBookings,
    COUNT(*) FILTER (WHERE sb.status = 'pending') AS pendingBookings,
    COALESCE(SUM(sb.total_price) FILTER (WHERE sb.status = 'completed'), 0) AS totalRevenue
  FROM
    service_bookings sb
  WHERE
    sb.org_id = get_booking_stats.org_id
    AND sb.booking_date >= get_booking_stats.from_date
    AND sb.booking_date <= get_booking_stats.to_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get a user's role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role
  INTO user_role
  FROM public.profiles
  WHERE id = user_id;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;