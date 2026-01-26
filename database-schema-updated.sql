-- Updated Supabase Schema for FitMySeat Platform
-- This replaces the existing schema with the new structure

-- ============================================================================
-- 1. PROFILES TABLE (Core user information)
-- ============================================================================
DROP TABLE IF EXISTS user_profiles_fm7x9k2p1q CASCADE;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('parent', 'org_owner', 'team_member', 'admin')) NOT NULL,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. ORGANIZATIONS TABLE (CPST organizations/business owners)
-- ============================================================================
DROP TABLE IF EXISTS organizations_fm7x9k2p1q CASCADE;

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
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

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Org owners can manage their orgs" ON organizations FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Team members can view their orgs" ON organizations FOR SELECT USING (
  id IN (SELECT organization_id FROM team_members WHERE user_id = auth.uid())
);
CREATE POLICY "Public can view published orgs" ON organizations FOR SELECT USING (true);

-- ============================================================================
-- 3. TEAM_MEMBERS TABLE (Links team members to organizations)
-- ============================================================================
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('technician', 'manager', 'staff')) DEFAULT 'technician',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_members
CREATE POLICY "Org owners can manage team members" ON team_members FOR ALL USING (
  organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
);
CREATE POLICY "Team members can view own membership" ON team_members FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- 4. TEAM_INVITES TABLE (Updated to reference new structure)
-- ============================================================================
DROP TABLE IF EXISTS team_invites_fm7x9k2p1q CASCADE;

CREATE TABLE team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired')) DEFAULT 'pending',
  invited_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for team_invites
CREATE POLICY "Org owners can manage invites" ON team_invites FOR ALL USING (
  organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
);
CREATE POLICY "Users can view invites sent to them" ON team_invites FOR SELECT USING (
  email = auth.jwt() ->> 'email'
);

-- ============================================================================
-- 5. PARENTS TABLE (Additional details for parents/guardians)
-- ============================================================================
CREATE TABLE parents (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preferred_language TEXT DEFAULT 'en',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for parents
CREATE POLICY "Parents can manage own data" ON parents FOR ALL USING (auth.uid() = id);

-- ============================================================================
-- 6. SERVICES TABLE (Services offered by organizations)
-- ============================================================================
DROP TABLE IF EXISTS service_types_fm7x9k2p1q CASCADE;

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  service_type TEXT CHECK (service_type IN (
    'installation', 'inspection', 'education', 'workshop', 
    'virtual_consultation', 'mobile_installation'
  )),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- RLS Policies for services
CREATE POLICY "Org owners can manage services" ON services FOR ALL USING (
  organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
);
CREATE POLICY "Team members can manage org services" ON services FOR ALL USING (
  organization_id IN (SELECT organization_id FROM team_members WHERE user_id = auth.uid())
);
CREATE POLICY "Public can view active services" ON services FOR SELECT USING (is_active = true);

-- ============================================================================
-- 7. SERVICE_BOOKINGS TABLE (Updated from existing structure)
-- ============================================================================
DROP TABLE IF EXISTS service_bookings_fm7x9k2p1q CASCADE;

CREATE TABLE service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  technician_id UUID REFERENCES profiles(id), -- Optional assigned technician
  booking_date TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  total_price NUMERIC(10,2),
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'paid', 'refunded')) DEFAULT 'unpaid',
  -- Additional booking details
  child_name TEXT,
  child_age INTEGER,
  vehicle_info TEXT,
  service_address TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_bookings
CREATE POLICY "Parents can manage own bookings" ON service_bookings FOR ALL USING (auth.uid() = parent_id);
CREATE POLICY "Org owners can view org bookings" ON service_bookings FOR SELECT USING (
  service_id IN (
    SELECT id FROM services WHERE organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
);
CREATE POLICY "Org owners can update org bookings" ON service_bookings FOR UPDATE USING (
  service_id IN (
    SELECT id FROM services WHERE organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
);
CREATE POLICY "Team members can view org bookings" ON service_bookings FOR SELECT USING (
  service_id IN (
    SELECT s.id FROM services s
    JOIN team_members tm ON s.organization_id = tm.organization_id
    WHERE tm.user_id = auth.uid()
  )
);
CREATE POLICY "Team members can update org bookings" ON service_bookings FOR UPDATE USING (
  service_id IN (
    SELECT s.id FROM services s
    JOIN team_members tm ON s.organization_id = tm.organization_id
    WHERE tm.user_id = auth.uid()
  )
);

-- ============================================================================
-- 8. EQUIPMENT TABLE (Updated from existing structure)
-- ============================================================================
DROP TABLE IF EXISTS equipment_fm7x9k2p1q CASCADE;

CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN (
    'car_seat_infant', 'car_seat_convertible', 'car_seat_booster', 
    'stroller_single', 'stroller_double', 'travel_system',
    'accessory_base', 'accessory_protector', 'accessory_bag',
    'special_needs', 'travel_addon', 'other'
  )),
  description TEXT,
  price_per_day NUMERIC(10,2) NOT NULL CHECK (price_per_day >= 0),
  deposit_amount NUMERIC(10,2) DEFAULT 0 CHECK (deposit_amount >= 0),
  current_condition TEXT DEFAULT 'Good' CHECK (current_condition IN ('New', 'Good', 'Fair', 'Damaged')),
  availability BOOLEAN DEFAULT true,
  image_urls TEXT[],
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;

-- RLS Policies for equipment
CREATE POLICY "Org owners can manage equipment" ON equipment FOR ALL USING (
  organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
);
CREATE POLICY "Team members can manage org equipment" ON equipment FOR ALL USING (
  organization_id IN (SELECT organization_id FROM team_members WHERE user_id = auth.uid())
);
CREATE POLICY "Public can view available equipment" ON equipment FOR SELECT USING (availability = true);

-- ============================================================================
-- 9. EQUIPMENT_RENTALS TABLE (Updated from existing structure)
-- ============================================================================
DROP TABLE IF EXISTS equipment_rentals_fm7x9k2p1q CASCADE;

CREATE TABLE equipment_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES parents(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price NUMERIC(10,2),
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  status TEXT CHECK (status IN ('reserved', 'ongoing', 'returned', 'cancelled')) DEFAULT 'reserved',
  notes TEXT,
  -- Additional rental details
  child_name TEXT,
  child_age INTEGER,
  pickup_address TEXT,
  return_method TEXT DEFAULT 'pickup' CHECK (return_method IN ('pickup', 'dropoff')),
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'paid', 'refunded')) DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE equipment_rentals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for equipment_rentals
CREATE POLICY "Parents can manage own rentals" ON equipment_rentals FOR ALL USING (auth.uid() = parent_id);
CREATE POLICY "Org owners can view org rentals" ON equipment_rentals FOR SELECT USING (
  equipment_id IN (
    SELECT id FROM equipment WHERE organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
);
CREATE POLICY "Org owners can update org rentals" ON equipment_rentals FOR UPDATE USING (
  equipment_id IN (
    SELECT id FROM equipment WHERE organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  )
);
CREATE POLICY "Team members can view org rentals" ON equipment_rentals FOR SELECT USING (
  equipment_id IN (
    SELECT e.id FROM equipment e
    JOIN team_members tm ON e.organization_id = tm.organization_id
    WHERE tm.user_id = auth.uid()
  )
);
CREATE POLICY "Team members can update org rentals" ON equipment_rentals FOR UPDATE USING (
  equipment_id IN (
    SELECT e.id FROM equipment e
    JOIN team_members tm ON e.organization_id = tm.organization_id
    WHERE tm.user_id = auth.uid()
  )
);

-- ============================================================================
-- 10. LISTINGS TABLE (Keep existing for business listings)
-- ============================================================================
-- Keep existing listings table for business directory functionality
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_description TEXT,
  full_description TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  zipcode TEXT,
  fax TEXT,
  opening_hours JSONB,
  tags TEXT[],
  categories TEXT[],
  price_range TEXT,
  payment_methods TEXT[],
  logo_url TEXT,
  gallery_urls TEXT[],
  video_url TEXT,
  faqs JSONB,
  services JSONB,
  social_links JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for listings
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listings
CREATE POLICY "Org owners can manage listings" ON listings FOR ALL USING (
  organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
);
CREATE POLICY "Public can view published listings" ON listings FOR SELECT USING (status = 'published');

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_profiles_role ON profiles (role);
CREATE INDEX idx_profiles_email ON profiles (email);

CREATE INDEX idx_organizations_owner_id ON organizations (owner_id);
CREATE INDEX idx_organizations_name ON organizations (name);

CREATE INDEX idx_team_members_org_id ON team_members (organization_id);
CREATE INDEX idx_team_members_user_id ON team_members (user_id);

CREATE INDEX idx_team_invites_org_id ON team_invites (organization_id);
CREATE INDEX idx_team_invites_email ON team_invites (email);
CREATE INDEX idx_team_invites_code ON team_invites (invite_code);
CREATE INDEX idx_team_invites_status ON team_invites (status);

CREATE INDEX idx_services_org_id ON services (organization_id);
CREATE INDEX idx_services_type ON services (service_type);
CREATE INDEX idx_services_active ON services (is_active);

CREATE INDEX idx_service_bookings_parent_id ON service_bookings (parent_id);
CREATE INDEX idx_service_bookings_service_id ON service_bookings (service_id);
CREATE INDEX idx_service_bookings_date ON service_bookings (booking_date);
CREATE INDEX idx_service_bookings_status ON service_bookings (status);

CREATE INDEX idx_equipment_org_id ON equipment (organization_id);
CREATE INDEX idx_equipment_category ON equipment (category);
CREATE INDEX idx_equipment_availability ON equipment (availability);

CREATE INDEX idx_equipment_rentals_parent_id ON equipment_rentals (parent_id);
CREATE INDEX idx_equipment_rentals_equipment_id ON equipment_rentals (equipment_id);
CREATE INDEX idx_equipment_rentals_dates ON equipment_rentals (start_date, end_date);
CREATE INDEX idx_equipment_rentals_status ON equipment_rentals (status);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to handle new user registration
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
  IF NEW.raw_user_meta_data->>'role' = 'org_owner' THEN
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

-- Function to check equipment availability
CREATE OR REPLACE FUNCTION check_equipment_availability(
  equipment_uuid UUID,
  start_date DATE,
  end_date DATE
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if equipment exists and is available
  IF NOT EXISTS (
    SELECT 1 FROM equipment 
    WHERE id = equipment_uuid AND availability = true
  ) THEN
    RETURN false;
  END IF;

  -- Check for overlapping rentals
  IF EXISTS (
    SELECT 1 FROM equipment_rentals 
    WHERE equipment_id = equipment_uuid 
    AND status IN ('reserved', 'ongoing')
    AND (start_date <= end_date AND end_date >= start_date)
  ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate rental price
CREATE OR REPLACE FUNCTION calculate_rental_price(
  equipment_uuid UUID,
  start_date DATE,
  end_date DATE
) RETURNS NUMERIC AS $$
DECLARE
  daily_rate NUMERIC;
  rental_days INTEGER;
BEGIN
  -- Get daily rate
  SELECT price_per_day INTO daily_rate
  FROM equipment 
  WHERE id = equipment_uuid;

  -- Calculate number of days
  rental_days := end_date - start_date + 1;

  RETURN daily_rate * rental_days;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON organizations TO authenticated;
GRANT ALL ON team_members TO authenticated;
GRANT ALL ON team_invites TO authenticated;
GRANT ALL ON parents TO authenticated;
GRANT ALL ON services TO authenticated;
GRANT ALL ON service_bookings TO authenticated;
GRANT ALL ON equipment TO authenticated;
GRANT ALL ON equipment_rentals TO authenticated;
GRANT ALL ON listings TO authenticated;

-- ============================================================================
-- SAMPLE DATA (Optional)
-- ============================================================================

-- Sample organizations
INSERT INTO organizations (id, name, owner_id, description, email, phone) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Elite Sports Academy', '550e8400-e29b-41d4-a716-446655440000', 'Professional sports training and equipment rental', 'contact@elitesports.com', '(555) 123-4567'),
  ('550e8400-e29b-41d4-a716-446655440001', 'SafeRide CPST Services', '550e8400-e29b-41d4-a716-446655440001', 'Certified car seat installation and education', 'info@saferidecpst.com', '(555) 987-6543')
ON CONFLICT (id) DO NOTHING;

-- Sample services
INSERT INTO services (organization_id, name, description, duration_minutes, price, service_type) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Car Seat Installation', 'Professional installation of infant, convertible, or booster car seats', 60, 75.00, 'installation'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Car Seat Safety Check', 'Comprehensive safety inspection of existing car seat installation', 30, 35.00, 'inspection'),
  ('550e8400-e29b-41d4-a716-446655440000', 'Car Seat Education Session', 'One-on-one education about proper car seat use and safety', 45, 50.00, 'education')
ON CONFLICT DO NOTHING;

-- Sample equipment
INSERT INTO equipment (organization_id, name, category, description, price_per_day, deposit_amount) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Graco Infant Car Seat', 'car_seat_infant', 'Rear-facing infant car seat with base, 4-35 lbs', 15.00, 50.00),
  ('550e8400-e29b-41d4-a716-446655440000', 'Britax Convertible Car Seat', 'car_seat_convertible', 'Convertible car seat, rear and forward facing, 5-65 lbs', 20.00, 75.00),
  ('550e8400-e29b-41d4-a716-446655440000', 'Chicco KeyFit Travel System', 'travel_system', 'Complete travel system with car seat and stroller', 25.00, 100.00)
ON CONFLICT DO NOTHING;

SELECT 'Updated FitMySeat database schema setup complete!' as message;