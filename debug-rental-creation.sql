-- Debug Equipment Rental Creation Issues
-- Run this in your Supabase SQL Editor to identify the exact schema

-- 1. Check the actual equipment_rentals table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'equipment_rentals' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check what columns actually exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'equipment_rentals' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Try a manual insert to see the exact error
-- Replace with actual test values
INSERT INTO public.equipment_rentals (
  equipment_id, 
  renter_id, 
  rental_start_date, 
  rental_end_date, 
  total_price, 
  status
) VALUES (
  'test-equipment-id', 
  'test-renter-id', 
  '2024-01-01', 
  '2024-01-02', 
  100.00, 
  'pending'
);

-- 4. If that fails, try without the rental_ prefix
INSERT INTO public.equipment_rentals (
  equipment_id, 
  renter_id, 
  start_date, 
  end_date, 
  total_price, 
  status
) VALUES (
  'test-equipment-id', 
  'test-renter-id', 
  '2024-01-01', 
  '2024-01-02', 
  100.00, 
  'pending'
);

-- Clean up test data
DELETE FROM public.equipment_rentals 
WHERE equipment_id = 'test-equipment-id';
