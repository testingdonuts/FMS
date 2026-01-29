-- ============================================================================
-- ADD LATITUDE & LONGITUDE COLUMNS TO LISTINGS TABLE
-- Run this in Supabase SQL Editor to enable location-based search
-- ============================================================================

-- Add latitude column
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;

-- Add longitude column
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Add a composite index for faster geo queries
CREATE INDEX IF NOT EXISTS idx_listings_coordinates 
ON public.listings (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Comment the columns for documentation
COMMENT ON COLUMN public.listings.latitude IS 'GPS latitude coordinate for location-based search';
COMMENT ON COLUMN public.listings.longitude IS 'GPS longitude coordinate for location-based search';

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify the columns were added:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'listings' 
AND column_name IN ('latitude', 'longitude');
