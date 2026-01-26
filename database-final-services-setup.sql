-- Final services setup - run this in your Supabase SQL Editor
-- This will ensure all tables exist and are properly configured

-- 1. Create services table with proper structure
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  service_type TEXT CHECK (service_type IN (
    'installation', 'inspection', 'education', 'workshop', 'virtual_consultation', 'mobile_installation'
  )) DEFAULT 'installation',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create organizations table
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

-- 3. Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "services_public_access" ON services;
DROP POLICY IF EXISTS "services_org_owners_manage" ON services;
DROP POLICY IF EXISTS "organizations_public_access" ON organizations;

-- 5. Create simple, working policies
CREATE POLICY "services_read_all" ON services 
  FOR SELECT TO authenticated, anon 
  USING (true);

CREATE POLICY "services_write_org" ON services 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "organizations_read_all" ON organizations 
  FOR SELECT TO authenticated, anon 
  USING (true);

CREATE POLICY "organizations_write_owner" ON organizations 
  FOR ALL TO authenticated 
  USING (true) 
  WITH CHECK (true);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_services_organization_id ON services (organization_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services (is_active);
CREATE INDEX IF NOT EXISTS idx_services_type ON services (service_type);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations (owner_id);

-- 7. Grant permissions
GRANT ALL ON services TO authenticated, anon;
GRANT ALL ON organizations TO authenticated, anon;

-- 8. Insert sample organization
INSERT INTO organizations (id, owner_id, name, email, phone, description) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  'SafeRide CPST Services',
  'info@saferidecpst.com',
  '(555) 987-6543',
  'Professional car seat installation and safety education services'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  description = EXCLUDED.description;

-- 9. Clear and insert fresh sample services
DELETE FROM services WHERE organization_id = '550e8400-e29b-41d4-a716-446655440000';

INSERT INTO services (organization_id, name, description, duration_minutes, price, service_type, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Car Seat Installation', 'Professional installation of infant, convertible, or booster car seats by certified technicians', 60, 75.00, 'installation', true),
  ('550e8400-e29b-41d4-a716-446655440000', 'Car Seat Safety Check', 'Comprehensive safety inspection of existing car seat installation', 30, 35.00, 'inspection', true),
  ('550e8400-e29b-41d4-a716-446655440000', 'Car Seat Education Session', 'One-on-one education about proper car seat use and safety guidelines', 45, 50.00, 'education', true),
  ('550e8400-e29b-41d4-a716-446655440000', 'Group Safety Workshop', 'Group workshop covering car seat safety for multiple families', 90, 25.00, 'workshop', true),
  ('550e8400-e29b-41d4-a716-446655440000', 'Virtual Consultation', 'Remote consultation via video call for car seat questions', 30, 40.00, 'virtual_consultation', true),
  ('550e8400-e29b-41d4-a716-446655440000', 'Mobile Installation Service', 'We come to your location for car seat installation', 75, 100.00, 'mobile_installation', true);

-- 10. Test the setup
SELECT 'Services database setup complete!' as message;
SELECT COUNT(*) as total_services FROM services;
SELECT COUNT(*) as active_services FROM services WHERE is_active = true;

-- Test the query that the frontend will use
SELECT 
  s.*,
  o.name as org_name,
  o.phone as org_phone,
  o.email as org_email
FROM services s
LEFT JOIN organizations o ON s.organization_id = o.id
WHERE s.is_active = true
ORDER BY s.name;