-- Debug Equipment Availability Issues
-- Run this in your Supabase SQL Editor to identify why equipment appears unavailable

-- 1. Check current equipment status
SELECT 
  'EQUIPMENT_STATUS' as debug_type,
  id, 
  name, 
  category,
  availability_status,
  rental_price_per_day
FROM public.equipment 
ORDER BY created_at DESC;

-- 2. Check for conflicting rentals (pending/active)
SELECT 
  'CONFLICTING_RENTALS' as debug_type,
  er.id as rental_id,
  er.equipment_id,
  e.name as equipment_name,
  er.status as rental_status,
  er.start_date,
  er.end_date,
  er.created_at
FROM public.equipment_rentals er
JOIN public.equipment e ON er.equipment_id = e.id
WHERE er.status IN ('pending', 'active')
ORDER BY er.created_at DESC;

-- 3. Test availability check for a specific equipment
-- Replace 'YOUR_EQUIPMENT_ID' with actual equipment UUID
SELECT 
  'AVAILABILITY_TEST' as debug_type,
  * FROM debug_equipment_availability('YOUR_EQUIPMENT_ID', '2024-01-01', '2024-01-05');

-- 4. Check if there are any stuck rentals that need clearing
SELECT 
  'STUCK_RENTALS' as debug_type,
  COUNT(*) as pending_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_only,
  COUNT(*) FILTER (WHERE status = 'active') as active_count
FROM public.equipment_rentals;

-- 5. Clear any stuck pending rentals (uncomment if needed)
-- DELETE FROM public.equipment_rentals WHERE status = 'pending';

SELECT 'Debug complete - review results above' as message;
