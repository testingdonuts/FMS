-- Fix services table to add missing category column
-- Run this in your Supabase SQL Editor

-- Add the category column to services table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='services' AND column_name='category'
  ) THEN 
    ALTER TABLE services ADD COLUMN category TEXT;
  END IF;
END $$;

-- Update existing services to have a default category if they don't have one
UPDATE services 
SET category = 'Car Seat Services' 
WHERE category IS NULL OR category = '';

-- Add a check constraint for category values (optional but recommended)
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name='services_category_check'
  ) THEN
    ALTER TABLE services DROP CONSTRAINT services_category_check;
  END IF;
  
  -- Add new constraint with common service categories
  ALTER TABLE services ADD CONSTRAINT services_category_check 
  CHECK (category IN (
    'Car Seat Services',
    'Safety Services', 
    'Installation Services',
    'Education Services',
    'Consultation Services',
    'Mobile Services',
    'General Services'
  ));
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_services_category ON services (category);

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name='services' AND column_name='category';

SELECT 'Services table updated with category column!' as message;