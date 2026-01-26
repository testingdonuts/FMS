-- Update service_bookings table to make child information optional
-- Run this in your Supabase SQL Editor

-- Remove NOT NULL constraints from child-related columns if they exist
ALTER TABLE service_bookings 
ALTER COLUMN child_name DROP NOT NULL;

ALTER TABLE service_bookings 
ALTER COLUMN child_age DROP NOT NULL;

-- Update any existing records with empty strings to NULL for better data consistency
UPDATE service_bookings 
SET child_name = NULL 
WHERE child_name = '' OR child_name = ' ';

UPDATE service_book

-- Add comments to document the optional nature
COMMENT ON COLUMN service_bookings.child_name IS 'Optional - Child name for the service (can be NULL if not applicable)';
COMMENT ON COLUMN service_bookings.child_age IS 'Optional - Child age for the service (can be NULL if not applicable)';

-- Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'service_bookings' 
  AND column_name IN ('child_name', 'child_age')
ORDER BY column_name;

SELECT 'Child information fields updated to be optional in service_bookings table!' as message;