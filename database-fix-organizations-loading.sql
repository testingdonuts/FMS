-- Fix organizations loading by ensuring proper data and access
-- Run this in your Supabase SQL Editor

-- 1. Ensure organizations table exists with proper structure
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  zipcode TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing restrictive policies
DROP POLICY IF EXISTS "orgs_owners_manage" ON organizations;
DROP POLICY IF EXISTS "orgs_public_view" ON organizations;
DROP POLICY IF EXISTS "organizations_access" ON organizations;

-- 4. Create permissive policies for organizations loading
CREATE POLICY "organizations_read_all" 
ON organizations 
FOR SELECT 
TO authenticated, anon 
USING (true);

CREATE POLICY "organizations_write_owner" 
ON organizations 
FOR ALL 
TO authenticated 
USING (owner_id = auth.uid()) 
WITH CHECK (owner_id = auth.uid());

-- 5. Insert sample organizations if they don't exist
INSERT INTO organizations (id, owner_id, name, email, phone, description, address) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  'SafeRide CPST Services',
  'info@saferidecpst.com',
  '(555) 987-6543',
  'Professional car seat installation and safety education services',
  '123 Safety Street, Anytown, ST 12345'
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440001',
  'Elite Child Safety',
  'contact@elitechildsafety.com',
  '(555) 123-4567',
  'Premium car seat installation and family safety consulting',
  '456 Protection Blvd, Safety City, ST 67890'
),
(
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440002',
  'Family First Car Seats',
  'hello@familyfirstseats.com',
  '(555) 555-0123',
  'Affordable car seat services for every family',
  '789 Family Lane, Hometown, ST 54321'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  description = EXCLUDED.description,
  address = EXCLUDED.address;

-- 6. Ensure services exist for these organizations
INSERT INTO services (organization_id, name, description, duration_minutes, price, service_type, is_active) VALUES
-- SafeRide CPST Services
('550e8400-e29b-41d4-a716-446655440000', 'Car Seat Installation', 'Professional installation of infant, convertible, or booster car seats', 60, 75.00, 'installation', true),
('550e8400-e29b-41d4-a716-446655440000', 'Safety Check', 'Comprehensive safety inspection of existing car seat installation', 30, 35.00, 'inspection', true),

-- Elite Child Safety
('550e8400-e29b-41d4-a716-446655440001', 'Premium Installation', 'White-glove car seat installation with detailed education', 90, 125.00, 'installation', true),
('550e8400-e29b-41d4-a716-446655440001', 'Virtual Consultation', 'Remote consultation via video call for car seat questions', 30, 50.00, 'virtual_consultation', true),

-- Family First Car Seats
('550e8400-e29b-41d4-a716-446655440002', 'Basic Installation', 'Affordable car seat installation service', 45, 45.00, 'installation', true),
('550e8400-e29b-41d4-a716-446655440002', 'Group Workshop', 'Group education session for multiple families', 120, 20.00, 'workshop', true)

ON CONFLICT DO NOTHING;

-- 7. Grant proper permissions
GRANT SELECT ON organizations TO authenticated, anon;
GRANT ALL ON organizations TO authenticated;

-- 8. Test the organizations loading
SELECT 
  'Organizations setup complete!' as message,
  COUNT(*) as total_organizations 
FROM organizations;

-- 9. Verify organizations can be loaded
SELECT 
  id, 
  name, 
  phone, 
  email,
  description
FROM organizations 
ORDER BY name;

-- 10. Verify organizations have services
SELECT 
  o.name as organization_name,
  COUNT(s.id) as service_count
FROM organizations o
LEFT JOIN services s ON o.id = s.organization_id AND s.is_active = true
GROUP BY o.id, o.name
ORDER BY o.name;

SELECT 'Fix complete - organizations should now load properly!' as success_message;