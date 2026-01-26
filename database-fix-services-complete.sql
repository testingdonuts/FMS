-- Complete fix for services and booking system
-- Run this in your Supabase SQL Editor

-- 1. Ensure services table exists with correct structure
CREATE TABLE IF NOT EXISTS services (
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

-- 2. Ensure organizations table exists
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

-- 3. Ensure profiles table exists
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('parent', 'organization', 'team_member')) NOT NULL,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    organization_id UUID REFERENCES organizations(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Ensure parents table exists
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    preferred_language TEXT DEFAULT 'en',
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Ensure service_bookings table exists
CREATE TABLE IF NOT EXISTS service_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
    technician_id UUID REFERENCES profiles(id),
    booking_date TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
    notes TEXT,
    total_price NUMERIC(10,2),
    payment_status TEXT CHECK (payment_status IN ('unpaid', 'paid', 'refunded')) DEFAULT 'unpaid',
    child_name TEXT,
    child_age INTEGER,
    vehicle_info TEXT,
    service_address TEXT,
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "services_org_owners_manage" ON services;
DROP POLICY IF EXISTS "services_public_view" ON services;
DROP POLICY IF EXISTS "services_team_view" ON services;
DROP POLICY IF EXISTS "orgs_owners_manage" ON organizations;
DROP POLICY IF EXISTS "orgs_public_view" ON organizations;

-- Create RLS policies for services
CREATE POLICY "services_org_owners_manage" ON services 
FOR ALL USING (
    organization_id IN (
        SELECT id FROM organizations 
        WHERE owner_id = auth.uid()
    )
);

CREATE POLICY "services_public_view" ON services 
FOR SELECT USING (is_active = true);

-- Create RLS policies for organizations
CREATE POLICY "orgs_owners_manage" ON organizations 
FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "orgs_public_view" ON organizations 
FOR SELECT USING (true);

-- Create RLS policies for profiles
CREATE POLICY "profiles_own_data" ON profiles 
FOR ALL USING (auth.uid() = id);

-- Create RLS policies for parents
CREATE POLICY "parents_own_data" ON parents 
FOR ALL USING (auth.uid() = id);

-- Create RLS policies for service_bookings
CREATE POLICY "parents_own_bookings" ON service_bookings 
FOR ALL USING (
    parent_id IN (
        SELECT id FROM parents WHERE id = auth.uid()
    )
);

CREATE POLICY "orgs_view_bookings" ON service_bookings 
FOR SELECT USING (
    service_id IN (
        SELECT s.id FROM services s 
        JOIN organizations o ON s.organization_id = o.id 
        WHERE o.owner_id = auth.uid()
    )
);

CREATE POLICY "orgs_update_bookings" ON service_bookings 
FOR UPDATE USING (
    service_id IN (
        SELECT s.id FROM services s 
        JOIN organizations o ON s.organization_id = o.id 
        WHERE o.owner_id = auth.uid()
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_organization_id ON services (organization_id);
CREATE INDEX IF NOT EXISTS idx_services_active ON services (is_active);
CREATE INDEX IF NOT EXISTS idx_services_type ON services (service_type);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations (owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_service_bookings_parent_id ON service_bookings (parent_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_service_id ON service_bookings (service_id);

-- Grant permissions
GRANT ALL ON services TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON parents TO authenticated;
GRANT ALL ON service_bookings TO authenticated;

-- Insert sample organization
INSERT INTO organizations (id, owner_id, name, email, phone, description) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440000',
    'SafeRide CPST Services',
    'info@saferidecpst.com',
    '(555) 987-6543',
    'Professional car seat installation and safety education services'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    description = EXCLUDED.description;

-- Insert sample services
INSERT INTO services (organization_id, name, description, duration_minutes, price, service_type, is_active) VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Car Seat Installation',
    'Professional installation of infant, convertible, or booster car seats by certified technicians',
    60,
    75.00,
    'installation',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Car Seat Safety Check',
    'Comprehensive safety inspection of existing car seat installation',
    30,
    35.00,
    'inspection',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Car Seat Education Session',
    'One-on-one education about proper car seat use and safety guidelines',
    45,
    50.00,
    'education',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Group Safety Workshop',
    'Group workshop covering car seat safety for multiple families',
    90,
    25.00,
    'workshop',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Virtual Consultation',
    'Remote consultation via video call for car seat questions',
    30,
    40.00,
    'virtual_consultation',
    true
),
(
    '550e8400-e29b-41d4-a716-446655440000',
    'Mobile Installation Service',
    'We come to your location for car seat installation',
    75,
    100.00,
    'mobile_installation',
    true
)
ON CONFLICT DO NOTHING;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert profile
    INSERT INTO profiles (
        id,
        full_name,
        email,
        phone,
        role
    ) VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'role'
    );

    -- If user is an organization owner, create organization
    IF NEW.raw_user_meta_data->>'role' = 'organization' THEN
        INSERT INTO organizations (
            id,
            owner_id,
            name,
            email
        ) VALUES (
            NEW.id,
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization'),
            NEW.email
        );
        
        -- Update profile with organization_id
        UPDATE profiles 
        SET organization_id = NEW.id 
        WHERE id = NEW.id;
    END IF;

    -- If user is a parent, create parent record
    IF NEW.raw_user_meta_data->>'role' = 'parent' THEN
        INSERT INTO parents (id) VALUES (NEW.id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();

SELECT 'Services and booking system setup complete!' as message;
SELECT COUNT(*) as active_services_count FROM services WHERE is_active = true;