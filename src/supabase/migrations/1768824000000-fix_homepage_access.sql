/* 
    # Fix Homepage Data Access
    
    1. Problem: 
      - Homepage tries to fetch equipment but might face RLS blocks.
      - Service fetching might also be blocked for "anon" users.
    
    2. Solution:
      - Explicitly enable public read access for `equipment` and `services`.
      - Ensure `availability_status` is correctly handled.
    */

    -- 1. EQUIPMENT: Ensure Public Read Access
    ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public can view available equipment" ON public.equipment;
    DROP POLICY IF EXISTS "Allow public select equipment" ON public.equipment;

    CREATE POLICY "public_view_equipment" ON public.equipment
    FOR SELECT TO anon, authenticated
    USING (availability_status = true OR "availabilityStatus" = true);

    -- 2. SERVICES: Ensure Public Read Access
    ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Public can view active services" ON public.services;
    
    CREATE POLICY "public_view_services" ON public.services
    FOR SELECT TO anon, authenticated
    USING (is_active = true);

    -- 3. PERMISSIONS
    GRANT SELECT ON public.equipment TO anon, authenticated;
    GRANT SELECT ON public.services TO anon, authenticated;