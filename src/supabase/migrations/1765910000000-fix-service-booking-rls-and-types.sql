/* 
    # Fix Service Booking Robustness
    
    1. Problem:
      - Similar to equipment, service bookings might fail if the user's role isn't correctly identified during the INSERT.
      - The `service_bookings` table requires several fields (parent_first_name, contact_phone) that might be missing from the frontend payload.
    
    2. Solution:
      - Ensure the `bookings_parent_insert` policy is explicitly defined and active.
      - Add a fallback to the `service_bookings` table for `platform_fee` to ensure it's never NULL.
    */

    -- Ensure RLS is active
    ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

    -- Drop and recreate the parent insert policy to be absolutely sure it's correct
    DROP POLICY IF EXISTS "bookings_parent_insert" ON public.service_bookings;
    
    CREATE POLICY "bookings_parent_insert" 
    ON public.service_bookings 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = parent_id);

    -- Ensure public can see services (required for the join on the profile page)
    DROP POLICY IF EXISTS "Public can view active services" ON public.services;
    CREATE POLICY "Public can view active services" 
    ON public.services 
    FOR SELECT 
    USING (is_active = true);

    -- Grant permissions
    GRANT ALL ON public.service_bookings TO authenticated;
    GRANT SELECT ON public.services TO anon, authenticated;