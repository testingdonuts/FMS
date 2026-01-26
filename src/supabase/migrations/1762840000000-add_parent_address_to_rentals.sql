/* 
# Add Parent Address to Equipment Rentals
1. New Columns
  - `parent_address` (text): The home/billing address of the parent renting the equipment.
2. Rationale
  - Organizations need the parent's official address for liability and records, 
    which may differ from the temporary pickup/delivery address.
*/

ALTER TABLE public.equipment_rentals 
ADD COLUMN IF NOT EXISTS parent_address TEXT;

-- Update the RPC functions to include the new parent_address column
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