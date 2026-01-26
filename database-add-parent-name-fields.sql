-- Add parent first and last name fields to service_bookings table
-- Run this in your Supabase SQL Editor

-- Add parent name columns to service_bookings table
DO $$
BEGIN
  -- Add parent_first_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_bookings' AND column_name = 'parent_first_name'
  ) THEN
    ALTER TABLE public.service_bookings 
    ADD COLUMN parent_first_name TEXT;
  END IF;

  -- Add parent_last_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_bookings' AND column_name = 'parent_last_name'
  ) THEN
    ALTER TABLE public.service_bookings 
    ADD COLUMN parent_last_name TEXT;
  END IF;
END $$;

-- Create index for better performance on parent name searches
CREATE INDEX IF NOT EXISTS idx_service_bookings_parent_names 
ON public.service_bookings (parent_first_name, parent_last_name);

-- Update any existing bookings to extract names from profile data if available
-- This is optional and only works if you have existing profile data
UPDATE public.service_bookings 
SET 
  parent_first_name = SPLIT_PART(
    (SELECT full_name FROM profiles WHERE id = service_bookings.parent_id), 
    ' ', 1
  ),
  parent_last_name = SPLIT_PART(
    (SELECT full_name FROM profiles WHERE id = service_bookings.parent_id), 
    ' ', 2
  )
WHERE parent_first_name IS NULL 
  AND parent_last_name IS NULL
  AND EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = service_bookings.parent_id 
    AND full_name IS NOT NULL
  );

SELECT 'Parent name fields added to service_bookings table successfully!' as message;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'service_bookings' 
  AND column_name IN ('parent_first_name', 'parent_last_name')
ORDER BY column_name;