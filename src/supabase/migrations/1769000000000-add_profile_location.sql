/* 
    # Add Location to User Profiles
    
    1. New Columns
       - `location` (JSONB): Stores structured location data (country, city, state, zip) for the user.
         This is designed to match the 'availability' JSON structure used in services and equipment.
    
    2. Details
       - Added to `profiles` table so it applies to parents (and potentially other roles).
       - Default is an empty JSON object.
    */

    ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS location JSONB DEFAULT '{}'::jsonb;
    
    -- Force schema cache refresh
    COMMENT ON COLUMN public.profiles.location IS 'User location preferences (Country, City, etc) for booking matching.';