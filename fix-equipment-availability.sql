-- Fix Equipment Availability Status
-- Run this in your Supabase SQL Editor
-- This script enables all equipment for booking by setting availability_status = true

-- Update all equipment to be available
UPDATE public.equipment 
SET availability_status = true 
WHERE availability_status = false;

-- Optional: If you want to check which equipment was unavailable before
SELECT 
  id, 
  name, 
  category,
  availability_status,
  rental_price_per_day
FROM public.equipment 
WHERE availability_status = false;

SELECT 'Equipment availability status updated successfully!' as message;
