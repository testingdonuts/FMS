-- Fix Rentals RPC Schema Mismatch (removes references to er.child_name / er.child_age)
-- Run this in your Supabase SQL Editor

-- Drop old functions that may still reference removed columns
DROP FUNCTION IF EXISTS public.get_parent_rentals(UUID);
DROP FUNCTION IF EXISTS public.get_organization_rentals(UUID);

-- Recreate get_parent_rentals with the current equipment_rentals schema
CREATE OR REPLACE FUNCTION public.get_parent_rentals(p_parent_id UUID)
RETURNS TABLE (
  id UUID,
  equipment_id UUID,
  parent_id UUID,
  start_date DATE,
  end_date DATE,
  total_price NUMERIC,
  platform_fee NUMERIC,
  deposit_amount NUMERIC,
  status TEXT,
  payment_status TEXT,
  pickup_address TEXT,
  return_method TEXT,
  parent_first_name TEXT,
  parent_last_name TEXT,
  contact_phone TEXT,
  parent_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  equipment JSON,
  parent JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    er.id,
    er.equipment_id,
    er.parent_id,
    er.start_date,
    er.end_date,
    er.total_price,
    er.platform_fee,
    er.deposit_amount,
    er.status,
    er.payment_status,
    er.pickup_address,
    er.return_method,
    er.parent_first_name,
    er.parent_last_name,
    er.contact_phone,
    er.parent_address,
    er.notes,
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
  FROM public.equipment_rentals er
  LEFT JOIN public.equipment e ON e.id = er.equipment_id
  LEFT JOIN public.profiles p ON p.id = er.parent_id
  WHERE er.parent_id = p_parent_id
  ORDER BY er.start_date DESC;
END;
$$;

-- Recreate get_organization_rentals with the current equipment_rentals schema
CREATE OR REPLACE FUNCTION public.get_organization_rentals(p_org_id UUID)
RETURNS TABLE (
  id UUID,
  equipment_id UUID,
  parent_id UUID,
  start_date DATE,
  end_date DATE,
  total_price NUMERIC,
  platform_fee NUMERIC,
  deposit_amount NUMERIC,
  status TEXT,
  payment_status TEXT,
  pickup_address TEXT,
  return_method TEXT,
  parent_first_name TEXT,
  parent_last_name TEXT,
  contact_phone TEXT,
  parent_address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  equipment JSON,
  parent JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    er.id,
    er.equipment_id,
    er.parent_id,
    er.start_date,
    er.end_date,
    er.total_price,
    er.platform_fee,
    er.deposit_amount,
    er.status,
    er.payment_status,
    er.pickup_address,
    er.return_method,
    er.parent_first_name,
    er.parent_last_name,
    er.contact_phone,
    er.parent_address,
    er.notes,
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
  FROM public.equipment_rentals er
  INNER JOIN public.equipment e ON e.id = er.equipment_id
  LEFT JOIN public.profiles p ON p.id = er.parent_id
  WHERE e.organization_id = p_org_id
  ORDER BY er.start_date DESC;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.get_parent_rentals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_rentals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_parent_rentals(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_organization_rentals(UUID) TO service_role;

SELECT 'RPCs recreated: get_parent_rentals / get_organization_rentals' AS message;
