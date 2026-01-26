-- Create services table for organizations
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  service_type TEXT CHECK (service_type IN (
    'installation', 'inspection', 'education', 'workshop', 'virtual_consultation', 'mobile_installation'
  )),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Organizations can manage their services" ON services
  FOR ALL USING (organization_id = auth.uid());

CREATE POLICY "Public can view active services" ON services
  FOR SELECT USING (is_active = true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_services_organization_id ON services (organization_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services (is_active);
CREATE INDEX IF NOT EXISTS idx_services_type ON services (service_type);

-- Grant permissions
GRANT ALL ON services TO authenticated;

-- Insert sample services for testing
INSERT INTO services (organization_id, name, description, duration_minutes, price, service_type) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Car Seat Installation', 'Professional installation of infant, convertible, or booster car seats by certified technicians', 60, 75.00, 'installation'),
('550e8400-e29b-41d4-a716-446655440000', 'Car Seat Safety Check', 'Comprehensive safety inspection of existing car seat installation', 30, 35.00, 'inspection'),
('550e8400-e29b-41d4-a716-446655440000', 'Car Seat Education Session', 'One-on-one education about proper car seat use and safety guidelines', 45, 50.00, 'education'),
('550e8400-e29b-41d4-a716-446655440000', 'Group Safety Workshop', 'Group workshop covering car seat safety for multiple families', 90, 25.00, 'workshop'),
('550e8400-e29b-41d4-a716-446655440000', 'Virtual Consultation', 'Remote consultation via video call for car seat questions', 30, 40.00, 'virtual_consultation'),
('550e8400-e29b-41d4-a716-446655440000', 'Mobile Installation Service', 'We come to your location for car seat installation', 75, 100.00, 'mobile_installation')
ON CONFLICT DO NOTHING;