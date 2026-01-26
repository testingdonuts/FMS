-- Update Supabase SQL schema for service bookings - Fit My Seat platform
-- Run this in your Supabase SQL Editor

-- 1. First, let's check what tables and constraints exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('service_bookings', 'services', 'organizations', 'team_members');

-- 2. Create services table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  duration_minutes INTEGER DEFAULT 60 CHECK (duration_minutes > 0),
  category TEXT,
  service_type TEXT CHECK (service_type IN (
    'installation',
    'inspection', 
    'education',
    'workshop',
    'virtual_consultation',
    'mobile_installation'
  )) DEFAULT 'installation',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT services_pkey PRIMARY KEY (id)
);

-- Add foreign key constraint for services.org_id -> organizations.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'services_org_id_fkey'
  ) THEN
    ALTER TABLE public.services 
    ADD CONSTRAINT services_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Update service_bookings table structure
-- First, add org_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_bookings' AND column_name = 'org_id'
  ) THEN
    ALTER TABLE public.service_bookings 
    ADD COLUMN org_id UUID;
  END IF;
END $$;

-- 4. Remove existing foreign key constraints that we need to update
-- Drop technician_id constraint if it references profiles
DO $$
BEGIN
  -- Check if the constraint exists and drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'service_bookings' 
    AND kcu.column_name = 'technician_id'
    AND tc.constraint_type = 'FOREIGN KEY'
  ) THEN
    -- Get the constraint name and drop it
    DECLARE 
      constraint_name_var TEXT;
    BEGIN
      SELECT tc.constraint_name INTO constraint_name_var
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = 'service_bookings' 
      AND kcu.column_name = 'technician_id'
      AND tc.constraint_type = 'FOREIGN KEY'
      LIMIT 1;
      
      IF constraint_name_var IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.service_bookings DROP CONSTRAINT IF EXISTS ' || constraint_name_var;
      END IF;
    END;
  END IF;
END $$;

-- 5. Add new foreign key constraints
-- Add org_id foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_bookings_org_id_fkey'
  ) THEN
    ALTER TABLE public.service_bookings 
    ADD CONSTRAINT service_bookings_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add service_id foreign key constraint (ensure it exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_bookings_service_id_fkey'
  ) THEN
    ALTER TABLE public.service_bookings 
    ADD CONSTRAINT service_bookings_service_id_fkey 
    FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add technician_id foreign key constraint to team_members
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_bookings_technician_id_fkey'
  ) THEN
    -- Only add if team_members table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'team_members'
    ) THEN
      ALTER TABLE public.service_bookings 
      ADD CONSTRAINT service_bookings_technician_id_fkey 
      FOREIGN KEY (technician_id) REFERENCES public.team_members(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 6. Ensure status and payment_status constraints exist
DO $$
BEGIN
  -- Add status constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%status%' 
    AND check_clause LIKE '%pending%'
  ) THEN
    ALTER TABLE public.service_bookings 
    ADD CONSTRAINT service_bookings_status_check 
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));
  END IF;

  -- Add payment_status constraint if it doesn't exist  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%payment_status%'
  ) THEN
    ALTER TABLE public.service_bookings 
    ADD CONSTRAINT service_bookings_payment_status_check 
    CHECK (payment_status IN ('unpaid', 'paid', 'refunded'));
  END IF;
END $$;

-- 7. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_bookings_org_id 
ON public.service_bookings (org_id);

CREATE INDEX IF NOT EXISTS idx_service_bookings_service_id 
ON public.service_bookings (service_id);

CREATE INDEX IF NOT EXISTS idx_service_bookings_technician_id 
ON public.service_bookings (technician_id);

CREATE INDEX IF NOT EXISTS idx_service_bookings_parent_id 
ON public.service_bookings (parent_id);

CREATE INDEX IF NOT EXISTS idx_service_bookings_status 
ON public.service_bookings (status);

CREATE INDEX IF NOT EXISTS idx_service_bookings_booking_date 
ON public.service_bookings (booking_date);

CREATE INDEX IF NOT EXISTS idx_services_org_id 
ON public.services (org_id);

CREATE INDEX IF NOT EXISTS idx_services_active 
ON public.services (is_active);

CREATE INDEX IF NOT EXISTS idx_services_category 
ON public.services (category);

-- 8. Enable RLS on tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for services
-- Drop existing policies first
DROP POLICY IF EXISTS "services_public_read" ON public.services;
DROP POLICY IF EXISTS "services_org_manage" ON public.services;

-- Create new policies
CREATE POLICY "services_public_read" 
ON public.services FOR SELECT 
USING (is_active = true);

CREATE POLICY "services_org_manage" 
ON public.services FOR ALL 
USING (
  org_id IN (
    SELECT id FROM public.organizations 
    WHERE owner_id = auth.uid()
  )
);

-- 10. Create RLS policies for service_bookings
-- Drop existing policies first
DROP POLICY IF EXISTS "service_bookings_parent_manage" ON public.service_bookings;
DROP POLICY IF EXISTS "service_bookings_org_view" ON public.service_bookings;
DROP POLICY IF EXISTS "service_bookings_org_update" ON public.service_bookings;

-- Create new policies
CREATE POLICY "service_bookings_parent_manage" 
ON public.service_bookings FOR ALL 
USING (
  parent_id IN (
    SELECT id FROM public.parents 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "service_bookings_org_view" 
ON public.service_bookings FOR SELECT 
USING (
  org_id IN (
    SELECT id FROM public.organizations 
    WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "service_bookings_org_update" 
ON public.service_bookings FOR UPDATE 
USING (
  org_id IN (
    SELECT id FROM public.organizations 
    WHERE owner_id = auth.uid()
  )
);

-- 11. Grant permissions
GRANT ALL ON public.services TO authenticated;
GRANT ALL ON public.service_bookings TO authenticated;
GRANT SELECT ON public.services TO anon;

-- 12. Insert sample services data
INSERT INTO public.services (org_id, name, description, price, duration_minutes, category, service_type, is_active)
VALUES 
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Car Seat Installation',
    'Professional installation of infant, convertible, or booster car seats by certified technicians',
    75.00,
    60,
    'Installation Services',
    'installation',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Car Seat Safety Check',
    'Comprehensive safety inspection of existing car seat installation',
    35.00,
    30,
    'Safety Services',
    'inspection',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Car Seat Education Session',
    'One-on-one education about proper car seat use and safety guidelines',
    50.00,
    45,
    'Education Services',
    'education',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Group Safety Workshop',
    'Group workshop covering car seat safety for multiple families',
    25.00,
    90,
    'Education Services',
    'workshop',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Virtual Consultation',
    'Remote consultation via video call for car seat questions',
    40.00,
    30,
    'Consultation Services',
    'virtual_consultation',
    true
  ),
  (
    '550e8400-e29b-41d4-a716-446655440000',
    'Mobile Installation Service',
    'We come to your location for car seat installation',
    100.00,
    75,
    'Mobile Services',
    'mobile_installation',
    true
  )
ON CONFLICT DO NOTHING;

-- 13. Update existing service_bookings to populate org_id
-- This assumes service_id already exists and relates to services
UPDATE public.service_bookings 
SET org_id = (
  SELECT s.org_id 
  FROM public.services s 
  WHERE s.id = service_bookings.service_id
)
WHERE org_id IS NULL 
AND service_id IS NOT NULL;

-- 14. Create function to auto-populate org_id on insert
CREATE OR REPLACE FUNCTION set_booking_org_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-populate org_id from the service
  IF NEW.org_id IS NULL AND NEW.service_id IS NOT NULL THEN
    SELECT s.org_id INTO NEW.org_id
    FROM public.services s
    WHERE s.id = NEW.service_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_booking_org_id ON public.service_bookings;
CREATE TRIGGER trigger_set_booking_org_id
  BEFORE INSERT ON public.service_bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_org_id();

-- 15. Verification queries
SELECT 'Schema update completed successfully!' as message;

-- Check table structures
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('services', 'service_bookings')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Check constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
WHERE tc.table_name IN ('services', 'service_bookings')
AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_type;

-- Verify sample data
SELECT COUNT(*) as services_count FROM public.services;
SELECT name, price, service_type, is_active FROM public.services ORDER BY name;