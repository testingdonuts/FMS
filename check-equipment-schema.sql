-- Check Equipment Rentals Table Schema
-- Run this in your Supabase SQL Editor to see actual column names

-- Get column information for equipment_rentals table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'equipment_rentals' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if there are any equipment rentals tables with suffixes
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'equipment_rentals%' 
  AND table_schema = 'public'
ORDER BY table_name;

-- Show sample data structure if table exists
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'equipment_rentals_fm7x9k2p1q' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
