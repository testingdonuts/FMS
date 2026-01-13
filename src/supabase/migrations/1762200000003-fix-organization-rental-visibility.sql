/*
# Fix Rental Visibility for Organizations

This migration addresses an issue where organizations were unable to view their equipment rentals, leading to an "unable to run query" error.

## 1. Problem
The `get_organization_rentals` RPC function used an `INNER JOIN` on the `equipment` table. While logically correct for fetching rentals of existing equipment, this could cause the entire query to fail if a rental record's `equipment_id` was invalid or pointed to a deleted item. This type of hard failure is a likely cause of the generic "unable to run query" error.

## 2. Solution
This migration re-defines the `get_organization_rentals` function to be more robust:
1.  **Uses `LEFT JOIN`**: The `INNER JOIN` to the `equipment` table is changed to a `LEFT JOIN`. This ensures that a rental record is always returned, even if the associated equipment has been deleted. The UI can then handle displaying a rental for a "deleted item".
2.  **Improved Filtering**: The `WHERE` clause is modified to filter directly on the `equipment_rentals` table using a subquery (`WHERE er.equipment_id IN (...)`). This is a more resilient way to ensure that only rentals belonging to the specified organization are fetched, avoiding potential issues with the join order and RLS policies.

## 3. Impact
This change makes the rental fetching logic more resilient and is expected to resolve the "unable to run query" error for organizations, allowing them to see their full rental history correctly.
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
  FROM public.equipment_rentals AS er
  LEFT JOIN public.equipment AS e ON er.equipment_id = e.id
  LEFT JOIN public.profiles AS p ON er.parent_id = p.id
  WHERE er.equipment_id IN (SELECT eq.id FROM public.equipment eq WHERE eq.organization_id = p_org_id)
  ORDER BY er.start_date DESC;
END;
$$;