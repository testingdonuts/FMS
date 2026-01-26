/*
# Remove Child Information from Equipment Rentals

This migration removes the `child_name` and `child_age` columns from the `equipment_rentals` table to align the database schema with the updated application logic.

## 1. Problem
The application was updated to no longer collect child information during the equipment rental process. However, the `equipment_rentals` table and its related RPC functions (`get_parent_rentals`, `get_organization_rentals`) still contained these legacy columns. This created a schema-to-code mismatch that could lead to data-fetching errors.

## 2. Solution
This migration performs two actions:
1. **Drops Columns**: It removes the `child_name` and `child_age` columns from the `equipment_rentals` table.
2. **Updates RPC Functions**: It redefines the `get_parent_rentals` and `get_organization_rentals` functions to remove these columns from their return signature and `SELECT` statements.

## 3. Impact
This change brings the database schema and data access layer into alignment with the front-end application, removing unused fields and simplifying the data model for equipment rentals. This resolves potential query failures caused by the data mismatch.
*/

-- Step 1: Remove columns from the equipment_rentals table
ALTER TABLE public.equipment_rentals DROP COLUMN IF EXISTS child_name;
ALTER TABLE public.equipment_rentals DROP COLUMN IF EXISTS child_age;

-- Step 2: Recreate RPC functions without the removed columns

-- Function to get rentals for a specific parent
CREATE OR REPLACE FUNCTION get_parent_rentals(p_parent_id UUID)
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
  WHERE er.parent_id = p_parent_id
  ORDER BY er.start_date DESC;
END;
$$;

-- Function to get rentals for a specific organization
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
  JOIN public.equipment AS e ON er.equipment_id = e.id
  LEFT JOIN public.profiles AS p ON er.parent_id = p.id
  WHERE e.organization_id = p_org_id
  ORDER BY er.start_date DESC;
END;
$$;