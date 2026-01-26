/* 
# Fix RPC Permissions and Signatures
1. Purpose
  - Resolve "unable to run query" errors by ensuring all functions have explicit EXECUTE permissions.
  - Synchronize function return types with the updated equipment_rentals schema (including parent details).
2. Functions Updated
  - `get_parent_rentals`
  - `get_organization_rentals`
  - `check_equipment_availability`
*/

-- Ensure columns exist in the table first (Defensive)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_rentals' AND column_name = 'parent_first_name') THEN
    ALTER TABLE public.equipment_rentals ADD COLUMN parent_first_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_rentals' AND column_name = 'parent_last_name') THEN
    ALTER TABLE public.equipment_rentals ADD COLUMN parent_last_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_rentals' AND column_name = 'contact_phone') THEN
    ALTER TABLE public.equipment_rentals ADD COLUMN contact_phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equipment_rentals' AND column_name = 'parent_address') THEN
    ALTER TABLE public.equipment_rentals ADD COLUMN parent_address TEXT;
  END IF;
END $$;

-- 1. Redefine get_parent_rentals
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
  parent_first_name TEXT,
  parent_last_name TEXT,
  contact_phone TEXT,
  parent_address TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  equipment JSON,
  parent JSON
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT 
    er.id, er.equipment_id, er.parent_id, er.start_date, er.end_date, 
    er.total_price, er.deposit_amount, er.status, er.notes, 
    er.pickup_address, er.return_method, er.payment_status,
    er.parent_first_name, er.parent_last_name, er.contact_phone, er.parent_address,
    er.created_at, er.updated_at,
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

-- 2. Redefine get_organization_rentals
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
  parent_first_name TEXT,
  parent_last_name TEXT,
  contact_phone TEXT,
  parent_address TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  equipment JSON,
  parent JSON
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT 
    er.id, er.equipment_id, er.parent_id, er.start_date, er.end_date, 
    er.total_price, er.deposit_amount, er.status, er.notes, 
    er.pickup_address, er.return_method, er.payment_status,
    er.parent_first_name, er.parent_last_name, er.contact_phone, er.parent_address,
    er.created_at, er.updated_at,
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

-- 3. Redefine availability check with explicit parameters and permissions
CREATE OR REPLACE FUNCTION check_equipment_availability(
  p_equipment_uuid UUID,
  p_start_date DATE,
  p_end_date DATE
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.equipment WHERE id = p_equipment_uuid AND availability_status = true) THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.equipment_rentals 
    WHERE equipment_id = p_equipment_uuid 
    AND status IN ('pending', 'active') 
    AND (p_start_date <= end_date AND p_end_date >= start_date)
  ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- 4. Explicitly GRANT permissions to ensure they are callable via REST API
GRANT EXECUTE ON FUNCTION public.get_parent_rentals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_rentals(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, DATE, DATE) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_parent_rentals(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_organization_rentals(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.check_equipment_availability(UUID, DATE, DATE) TO service_role;