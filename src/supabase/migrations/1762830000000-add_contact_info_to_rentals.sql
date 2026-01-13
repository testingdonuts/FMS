/* 
# Add Contact Information to Equipment Rentals
1. New Columns
  - `parent_first_name` (text): Captured at time of rental
  - `parent_last_name` (text): Captured at time of rental
  - `contact_phone` (text): Captured at time of rental
2. Rationale
  - Organizations need immediate access to the renter's contact details without 
    performing complex joins, especially if the user updates their profile later.
*/

ALTER TABLE public.equipment_rentals 
ADD COLUMN IF NOT EXISTS parent_first_name TEXT,
ADD COLUMN IF NOT EXISTS parent_last_name TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Update the RPC functions to include these new columns in the return set
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
    er.parent_first_name, er.parent_last_name, er.contact_phone,
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
    er.parent_first_name, er.parent_last_name, er.contact_phone,
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