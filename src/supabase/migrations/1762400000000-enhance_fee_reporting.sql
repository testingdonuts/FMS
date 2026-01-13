/* # Enhance Fee Reporting Logic
1. Changes
- Updates `get_booking_stats` to return detailed financial metrics.
- Adds columns for gross revenue, total fees, and net revenue.
- Includes both service bookings and equipment rentals in the calculation.

2. Rationale
Organizations need to see exactly how much is being deducted per tier to manage their business effectively.
*/

CREATE OR REPLACE FUNCTION get_booking_stats(
  org_id UUID,
  from_date TIMESTAMPTZ,
  to_date TIMESTAMPTZ
) RETURNS TABLE (
  total_bookings BIGINT,
  completed_bookings BIGINT,
  pending_bookings BIGINT,
  gross_revenue NUMERIC,
  total_fees NUMERIC,
  net_revenue NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH booking_stats AS (
    SELECT 
      COUNT(*) as cnt,
      COUNT(*) FILTER (WHERE status = 'completed') as comp_cnt,
      COUNT(*) FILTER (WHERE status = 'pending') as pend_cnt,
      COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) as gross,
      COALESCE(SUM(platform_fee) FILTER (WHERE status = 'completed'), 0) as fees
    FROM service_bookings
    WHERE service_bookings.org_id = get_booking_stats.org_id
    AND service_bookings.booking_date >= get_booking_stats.from_date
    AND service_bookings.booking_date <= get_booking_stats.to_date
  ),
  rental_stats AS (
    SELECT 
      COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) as gross,
      COALESCE(SUM(platform_fee) FILTER (WHERE status = 'completed'), 0) as fees
    FROM equipment_rentals
    JOIN equipment ON equipment_rentals.equipment_id = equipment.id
    WHERE equipment.organization_id = get_booking_stats.org_id
    AND equipment_rentals.start_date >= get_booking_stats.from_date::date
    AND equipment_rentals.start_date <= get_booking_stats.to_date::date
  )
  SELECT 
    b.cnt::BIGINT,
    b.comp_cnt::BIGINT,
    b.pend_cnt::BIGINT,
    (b.gross + r.gross)::NUMERIC as gross_revenue,
    (b.fees + r.fees)::NUMERIC as total_fees,
    ((b.gross + r.gross) - (b.fees + r.fees))::NUMERIC as net_revenue
  FROM booking_stats b, rental_stats r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;