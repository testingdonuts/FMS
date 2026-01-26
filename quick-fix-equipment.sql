-- Quick Fix: Clear Stuck Rentals and Ensure Equipment Availability
-- Run this in your Supabase SQL Editor

-- 1. Clear all pending rentals (these block availability)
DELETE FROM public.equipment_rentals WHERE status = 'pending';

-- 2. Ensure all equipment is marked as available
UPDATE public.equipment 
SET availability_status = true;

-- 3. Verify equipment is now available
SELECT 
  'EQUIPMENT_AFTER_FIX' as status,
  id, 
  name, 
  category,
  availability_status
FROM public.equipment 
LIMIT 5;

-- 4. Verify no blocking rentals exist
SELECT 
  'RENTALS_AFTER_FIX' as status,
  COUNT(*) as total_rentals,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'active') as active_count
FROM public.equipment_rentals;

SELECT 'Equipment availability fixed - try booking again!' as message;
