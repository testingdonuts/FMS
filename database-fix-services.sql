-- Fix services table and relationships
-- Run this in your Supabase SQL Editor

-- First, let's check if we need to update the existing services table structure
-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Check if services table exists, if not create it
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'services') THEN
        CREATE TABLE services (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            organization_id UUID NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL DEFAULT 60,
            price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
            service_type TEXT CHECK (service_type IN (
                'installation', 'inspection', 'education', 'workshop', 
                'virtual_consultation', 'mobile_installation'
            )) DEFAULT 'installation',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Add missing columns to existing services table if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'service_type'
    ) THEN
        ALTER TABLE services ADD COLUMN service_type TEXT CHECK (service_type IN (
            'installation', 'inspection', 'education', 'workshop', 
            'virtual_consultation', 'mobile_installation'
        )) DEFAULT 'installation';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'services' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE services ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END
$$;

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Organizations can manage their services" ON services;
DROP POLICY IF EXISTS "Public can view active services" ON services;
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON services;

-- Create comprehensive RLS policies
CREATE POLICY "services_org_owners_manage" ON services 
FOR ALL USING (
    organization_id IN (
        SELECT id FROM organizations 
        WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "services_public_view" ON services 
FOR SELECT USING (is_active = true);

CREATE POLICY "services_team_view" ON services 
FOR SELECT USING (
    organization_id IN (
        SELECT organization_id FROM team_members 
        WHERE user_id = auth.uid()
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_organization_id ON services (organization_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services (is_active);
CREATE INDEX IF NOT EXISTS idx_services_type ON services (service_type);

-- Ensure organizations table exists
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

-- Enable RLS for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing org policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON organizations;
DROP POLICY IF EXISTS "organizations_access" ON organizations;

-- Create org policies
CREATE POLICY "orgs_owners_manage" ON organizations 
FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "orgs_public_view" ON organizations 
FOR SELECT USING (true);

-- Create team_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('technician', 'manager', 'staff')) DEFAULT 'technician',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- Enable RLS for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create team member policies
CREATE POLICY "team_members_org_manage" ON team_members 
FOR ALL USING (
    organization_id IN (
        SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "team_members_view_own" ON team_members 
FOR SELECT USING (user_id = auth.uid());

-- Grant permissions
GRANT ALL ON services TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON team_members TO authenticated;

-- Insert some sample services for testing
INSERT INTO services (organization_id, name, description, duration_minutes, price, service_type) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Car Seat Installation',
    'Professional installation of infant, convertible, or booster car seats by certified technicians',
    60,
    75.00,
    'installation'
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Car Seat Safety Check',
    'Comprehensive safety inspection of existing car seat installation',
    30,
    35.00,
    'inspection'
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Car Seat Education Session',
    'One-on-one education about proper car seat use and safety guidelines',
    45,
    50.00,
    'education'
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Group Safety Workshop',
    'Group workshop covering car seat safety for multiple families',
    90,
    25.00,
    'workshop'
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Virtual Consultation',
    'Remote consultation via video call for car seat questions',
    30,
    40.00,
    'virtual_consultation'
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Mobile Installation Service',
    'We come to your location for car seat installation',
    75,
    100.00,
    'mobile_installation'
)
ON CONFLICT DO NOTHING;

-- Insert sample organization if it doesn't exist
INSERT INTO organizations (id, owner_id, name, email, phone) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440000',
    'SafeRide CPST Services',
    'info@saferidecpst.com',
    '(555) 987-6543'
)
ON CONFLICT (id) DO NOTHING;

SELECT 'Services table setup complete!' as message;
SELECT COUNT(*) as active_services_count FROM services WHERE is_active = true;