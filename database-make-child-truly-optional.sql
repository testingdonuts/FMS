-- Make child information truly optional in service_bookings
-- Run this in your Supabase SQL Editor

-- 1. Remove NOT NULL constraints from child fields if they exist
DO $$ 
BEGIN
  -- Remove NOT NULL constraint from child_name
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_bookings' 
    AND column_name = 'child_name' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE service_bookings ALTER COLUMN child_name DROP NOT NULL;
  END IF;

  -- Remove NOT NULL constraint from child_age
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_bookings' 
    AND column_name = 'child_age' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE service_bookings ALTER COLUMN child_age DROP NOT NULL;
  END IF;
END $$;

-- 2. Update existing records with empty strings to NULL
UPDATE service_bookings 
SET child_name = NULL 
WHERE child_name = '' OR child_name = ' ' OR child_name = 'N/A';

UPDATE service_bookings 
SET child_age = NULL 
WHERE child_age = 0 OR child_age < 0 OR child_age > 18;

-- 3. Add helpful comments
COMMENT ON COLUMN service_bookings.child_name IS 'Optional - Child name for the service (can be NULL if not applicable)';
COMMENT ON COLUMN service_bookings.child_age IS 'Optional - Child age for the service (can be NULL if not applicable)';

-- 4. Create a check constraint to ensure valid age when provided
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_bookings_child_age_check'
  ) THEN
    ALTER TABLE service_bookings DROP CONSTRAINT service_book_child_age_check;
  END IF;

  -- Add new constraint that allows NULL but validates when not NULL
  ALTER TABLE service_bookings 
  ADD CONSTRAINT service_bookings_child_age_check 
  CHECK (child_age IS NULL OR (child_age >= 0 AND child_age <= 18));
END $$;

-- 5. Verify the changes
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'service_bookings' 
  AND column_name IN ('child_name', 'child_age')
ORDER BY column_name;

-- 6. Test with sample data to ensure NULL values work
INSERT INTO service_bookings (
  service_id,
  parent_id,
  org_id,
  booking_date,
  status,
  parent_first_name,
  parent_last_name,
  contact_phone,
  vehicle_info,
  service_address,
  child_name,  -- This will be NULL
  child_age    -- This will be NULL
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',  -- service_id
  '550e8400-e29b-41d4-a716-446655440000',  -- parent_id  
  '550e8400-e29b-41d4-a716-446655440000',  -- org_id
  NOW() + INTERVAL '1 day',                -- booking_date
  'pending',                                -- status
  'Test',                                   -- parent_first_name
  'Parent',                                 -- parent_last_name
  '555-123-4567',                          -- contact_phone
  '2020 Honda CR-V',                       -- vehicle_info
  '123 Test Street',                       -- service_address
  NULL,                                     -- child_name (NULL is OK)
  NULL                                      -- child_age (NULL is OK)
) ON CONFLICT DO NOTHING;

-- 7. Clean up test data
DELETE FROM service_bookings 
WHERE parent_first_name = 'Test' AND parent_last_name = 'Parent';

SELECT 'Child information fields are now truly optional in service_bookings table!' as message;

-- 8. Show current structure
SELECT 
  'Column: ' || column_name || ' | Nullable: ' || is_nullable as column_info
FROM information_schema.columns 
WHERE table_name = 'service_bookings' 
  AND column_name IN ('child_name', 'child_age')
ORDER BY column_name;