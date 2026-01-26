/*
# Simplify and Fix Organization Rental Query

This migration addresses the recurring "unable to run query" error by simplifying the logic in the `get_organization_rentals` RPC function.

## 1. Problem
The previous attempts to make the rental query robust against deleted equipment records introduced complex logic (a `LEFT JOIN` combined with a subquery in a `WHERE` clause). This complexity is the likely source of the persistent query failures, potentially due to performance issues or unexpected behavior from the query planner with specific data patterns. The logic was also inherently flawed, as the `WHERE` clause negated the benefit of the `LEFT JOIN`.

## 2. Solution
This migration replaces the complex query with a simple and direct `INNER JOIN`. 
- The function will now join `equipment_rentals` directly with `equipment`.
- It filters the results where `equipment.organization_id` matches the provided ID.

This approach is semantically correct under the assumption that an organization should only see rentals for equipment that currently exists. The database schema's `ON DELETE CASCADE` foreign key constraints on the `equipment_rentals` table are designed to prevent orphaned rental records, making an `INNER JOIN` safe and efficient.

## 3. Impact
This change simplifies the query, which should improve performance and eliminate the edge case causing the "unable to run query" error. Organization dashboards will now correctly and reliably display the list of all current equipment rentals.
*/

CREATE OR REPLACE FUNCTION get_organization_rentals(p_org_id UUID)
RETURNS TABLE (
    id UUID,
    equipment_id UUID,
    parent_id UUID,
    start_date DATE,
    end_date DATE,
    total_price NUMERIC,
    deposit_amount NUMERIC,
    status TEXT,
    notes TEXT,
    pickup_address TEXT,
    return_method TEXT,
    payment_status TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    equipment JSON,
    parent JSON
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT
    er.id,
    er.equipment_id,
    er.parent_id,
    er.start_date,
    er.end_date,
    er.total_price,
    er.deposit_amount,
    er.status,
    er.notes,
    er.pickup_address,
    er.return_method,
    er.payment_status,
    er.created_at,
    er.updated_at,
    json_build_object(
      'id', e.id,
      'name', e.name,
      'category', e.category,
      'image_urls', e.image_urls,
      'rental_price_per_day', e.rental_price_per_day
    ) AS equipment,
    json_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'email', p.email
    ) AS parent
  FROM
    public.equipment_rentals AS er
  JOIN
    public.equipment AS e ON er.equipment_id = e.id
  LEFT JOIN
    public.profiles AS p ON er.parent_id = p.id
  WHERE
    e.organization_id = p_org_id
  ORDER BY
    er.start_date DESC;
END;
$$;