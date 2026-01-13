/*
# Initial Database Schema Setup

This migration sets up the complete initial database schema for the FitMySeat platform. It creates all the necessary tables for managing users, organizations, services, bookings, and equipment rentals.

## 1. New Tables
- **`profiles`**: Core user information linked to `auth.users`. Stores role, name, and contact details.
- **`organizations`**: Holds data for CPST organizations, linked to an owner profile.
- **`team_members`**: Links team member profiles to their respective organizations.
- **`team_invites`**: Manages invitations for team members to join an organization.
- **`parents`**: Stores specific information for parent/guardian users.
- **`services`**: Lists all services offered by organizations (e.g., car seat installation).
- **`service_bookings`**: Tracks appointments for services, linking parents, services, and technicians.
- **`equipment`**: Manages the inventory of rental equipment.
- **`equipment_rentals`**: Tracks equipment rental transactions.
- **`listings`**: Contains business directory information for organizations.

## 2. Functions and Triggers
- **`handle_new_user_registration()`**: An automatic trigger function that fires upon new user signup. It correctly routes user data into the `profiles` table and the corresponding role-specific table (`organizations` or `parents`). It now also handles linking team members to their organization upon signup.
- **`check_equipment_availability()`**: A function to verify if a piece of equipment is available for a given date range.
- **`calculate_rental_price()`**: A function to calculate the total rental price based on daily rate and duration.
- **`get_user_organization_id()`**: A helper function for RLS policies to securely get the organization ID of the currently authenticated user.

## 3. Security (Row Level Security - RLS)
- **RLS Enabled**: RLS is enabled on all tables to ensure data is protected by default.
- **Policies**: Specific policies are created for each table to grant appropriate access based on user roles (e.g., users can only manage their own data, organization members can manage their organization's data). This version includes a more robust policy for team member creation to avoid race conditions.

## 4. Indexes
- Indexes are created on frequently queried columns (like foreign keys, IDs, dates, and status fields) to ensure optimal database performance.
*/

--============================================================================--
-- 1. PROFILES TABLE (Core user information)
--============================================================================--
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('parent', 'organization', 'team_member', 'admin')) NOT NULL,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  organization_id UUID, -- Added later as a foreign key
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--============================================================================--
-- 2. ORGANIZATIONS TABLE (CPST organizations/business owners)
--============================================================================--
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

-- Add foreign key from profiles to organizations
ALTER TABLE profiles
ADD CONSTRAINT fk_profiles_organization_id FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL;

--============================================================================--
-- 3. TEAM_MEMBERS TABLE (Links team members to organizations)
--============================================================================--
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('technician', 'manager', 'staff')) DEFAULT 'technician',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

--============================================================================--
-- 4. TEAM_INVITES TABLE
--============================================================================--
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'technician' CHECK (role IN ('technician', 'manager', 'staff')),
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')) DEFAULT 'pending',
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--============================================================================--
-- 5. PARENTS TABLE (Additional details for parents/guardians)
--============================================================================--
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language TEXT DEFAULT 'en',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--============================================================================--
-- 6. SERVICES TABLE (Services offered by organizations)
--============================================================================--
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  service_type TEXT CHECK (
    service_type IN (
      'installation',
      'inspection',
      'education',
      'workshop',
      'virtual_consultation',
      'mobile_installation'
    )
  ),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--============================================================================--
-- 7. SERVICE_BOOKINGS TABLE
--============================================================================--
CREATE TABLE IF NOT EXISTS service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Changed to reference auth.users
  technician_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  booking_date TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  total_price NUMERIC(10, 2),
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'paid', 'refunded')) DEFAULT 'unpaid',
  parent_first_name TEXT,
  parent_last_name TEXT,
  child_name TEXT,
  child_age INTEGER,
  vehicle_info TEXT,
  service_address TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--============================================================================--
-- 8. EQUIPMENT TABLE
--============================================================================--
CREATE TABLE IF NOT EXISTS equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT CHECK (
    category IN (
      'Sports Equipment',
      'Training Accessories',
      'Safety Gear',
      'Audio/Visual Equipment',
      'Furniture',
      'Technology',
      'Other'
    )
  ),
  description TEXT,
  rental_price_per_day NUMERIC(10, 2) NOT NULL CHECK (rental_price_per_day >= 0),
  deposit_amount NUMERIC(10, 2) DEFAULT 0 CHECK (deposit_amount >= 0),
  current_condition TEXT DEFAULT 'Good' CHECK (
    current_condition IN ('New', 'Good', 'Fair', 'Damaged')
  ),
  availability_status BOOLEAN DEFAULT true,
  image_urls TEXT [],
  specifications JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--============================================================================--
-- 9. EQUIPMENT_RENTALS TABLE
--============================================================================--
CREATE TABLE IF NOT EXISTS equipment_rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Changed to reference auth.users
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_price NUMERIC(10, 2),
  deposit_amount NUMERIC(10, 2) DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  child_name TEXT,
  child_age INTEGER,
  pickup_address TEXT,
  return_method TEXT DEFAULT 'pickup' CHECK (return_method IN ('pickup', 'dropoff')),
  payment_status TEXT CHECK (payment_status IN ('unpaid', 'paid', 'refunded')) DEFAULT 'unpaid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--============================================================================--
-- 10. LISTINGS TABLE (For business directory functionality)
--============================================================================--
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
  tags TEXT [],
  categories TEXT [],
  price_range TEXT,
  payment_methods TEXT [],
  logo_url TEXT,
  gallery_urls TEXT [],
  video_url TEXT,
  faqs JSONB,
  services JSONB,
  social_links JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

--============================================================================--
-- HELPER FUNCTIONS for RLS
--============================================================================--

-- Function to get the organization_id for a given user
CREATE OR REPLACE FUNCTION get_user_organization_id(user_id UUID)
RETURNS UUID AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id
  FROM public.profiles
  WHERE id = user_id;
  RETURN org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--============================================================================--
-- RLS POLICIES (REVISED FOR TEAM ACCESS)
--============================================================================--
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON profiles;
CREATE POLICY "Users can manage their own profile" ON profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org owners can manage their organization" ON organizations;
CREATE POLICY "Org owners can manage their organization" ON organizations FOR ALL USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Public can view organizations" ON organizations;
CREATE POLICY "Public can view organizations" ON organizations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Team members can view their own organization" ON organizations;
CREATE POLICY "Team members can view their own organization" ON organizations FOR SELECT USING (id = get_user_organization_id(auth.uid()));

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org team can manage their team" ON team_members;
DROP POLICY IF EXISTS "Team members can view their own membership" ON team_members;
DROP POLICY IF EXISTS "Org members can fully manage their team" ON team_members;
CREATE POLICY "Org members can fully manage their team"
ON team_members
FOR ALL
USING ( organization_id = get_user_organization_id(auth.uid()) )
WITH CHECK (
  -- Condition 1: The person doing the insert/update is already a member of the organization
  (organization_id = get_user_organization_id(auth.uid()))
  OR
  -- Condition 2: The person being added is the one doing the insert, and they have a valid invite
  (
    (user_id = auth.uid()) AND
    EXISTS (
      SELECT 1 FROM team_invites
      WHERE team_invites.email = auth.email()
      AND team_invites.status = 'pending'
      AND team_invites.organization_id = team_members.organization_id
    )
  )
);

ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org owners can manage invites" ON team_invites;
CREATE POLICY "Org owners can manage invites" ON team_invites FOR ALL USING (organization_id = get_user_organization_id(auth.uid()));
DROP POLICY IF EXISTS "Users can view their own invites" ON team_invites;
CREATE POLICY "Users can view their own invites" ON team_invites FOR SELECT USING (email = auth.email());

ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can manage their own data" ON parents;
CREATE POLICY "Parents can manage their own data" ON parents FOR ALL USING (auth.uid() = id);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Org team can manage services" ON services;
CREATE POLICY "Org team can manage services" ON services FOR ALL USING (organization_id = get_user_organization_id(auth.uid())) WITH CHECK (organization_id = get_user_organization_id(auth.uid()));
DROP POLICY IF EXISTS "Public can view active services" ON services;
CREATE POLICY "Public can view active services" ON services FOR SELECT USING (is_active = true);

ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can manage own bookings" ON service_bookings;
CREATE POLICY "Parents can manage own bookings" ON service_bookings FOR ALL USING (auth.uid() = parent_id);
DROP POLICY IF EXISTS "Orgs can manage their bookings" ON service_bookings;
CREATE POLICY "Orgs can manage their bookings" ON service_bookings FOR ALL USING (org_id = get_user_organization_id(auth.uid()));

ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Orgs can manage equipment" ON equipment;
CREATE POLICY "Orgs can manage equipment" ON equipment FOR ALL USING (organization_id = get_user_organization_id(auth.uid())) WITH CHECK (organization_id = get_user_organization_id(auth.uid()));
DROP POLICY IF EXISTS "Public can view available equipment" ON equipment;
CREATE POLICY "Public can view available equipment" ON equipment FOR SELECT USING (availability_status = true);

ALTER TABLE equipment_rentals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Parents can manage own rentals" ON equipment_rentals;
CREATE POLICY "Parents can manage own rentals" ON equipment_rentals FOR ALL USING (auth.uid() = parent_id);
DROP POLICY IF EXISTS "Orgs can manage their rentals" ON equipment_rentals;
CREATE POLICY "Orgs can manage their rentals" ON equipment_rentals FOR ALL USING ((SELECT organization_id FROM equipment WHERE id = equipment_id) = get_user_organization_id(auth.uid()));

ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Orgs can manage their listings" ON listings;
CREATE POLICY "Orgs can manage their listings" ON listings FOR ALL USING (organization_id = get_user_organization_id(auth.uid())) WITH CHECK (organization_id = get_user_organization_id(auth.uid()));
DROP POLICY IF EXISTS "Public can view published listings" ON listings;
CREATE POLICY "Public can view published listings" ON listings FOR SELECT USING (status = 'published');


--============================================================================--
-- INDEXES FOR PERFORMANCE
--============================================================================--
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles (role);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id ON organizations (owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_org_id ON team_members (organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members (user_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_org_id ON team_invites (organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_code ON team_invites (invite_code);
CREATE INDEX IF NOT EXISTS idx_services_org_id ON services (organization_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_parent_id ON service_bookings (parent_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_service_id ON service_bookings (service_id);
CREATE INDEX IF NOT EXISTS idx_equipment_org_id ON equipment (organization_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_parent_id ON equipment_rentals (parent_id);
CREATE INDEX IF NOT EXISTS idx_equipment_rentals_equipment_id ON equipment_rentals (equipment_id);

--============================================================================--
-- FUNCTIONS AND TRIGGERS
--============================================================================--

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  org_name TEXT;
  invite_org_id UUID;
  new_org_id UUID;
BEGIN
  user_role := NEW.raw_user_meta_data->>'role';
  org_name := NEW.raw_user_meta_data->>'organization_name';
  invite_org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;

  -- Insert base profile first
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    user_role
  );
  
  -- Handle role-specific logic
  IF user_role = 'organization' THEN
    INSERT INTO public.organizations (owner_id, name, email, phone)
    VALUES (
      NEW.id,
      COALESCE(org_name, 'My Organization'),
      NEW.email,
      NEW.raw_user_meta_data->>'phone'
    ) RETURNING id INTO new_org_id;
    UPDATE public.profiles SET organization_id = new_org_id WHERE id = NEW.id;
  ELSIF user_role = 'parent' THEN
    INSERT INTO public.parents (id) VALUES (NEW.id);
  ELSIF user_role = 'team_member' AND invite_org_id IS NOT NULL THEN
    UPDATE public.profiles SET organization_id = invite_org_id WHERE id = NEW.id;
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
)
RETURNS BOOLEAN AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM equipment WHERE id = equipment_uuid AND availability_status = true
  ) THEN
    RETURN false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM equipment_rentals
    WHERE
      equipment_id = equipment_uuid
      AND status IN ('pending', 'active')
      AND (start_date, end_date) OVERLAPS (start_date, end_date)
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
)
RETURNS NUMERIC AS $$
DECLARE
  daily_rate NUMERIC;
  rental_days INTEGER;
BEGIN
  SELECT rental_price_per_day INTO daily_rate FROM equipment WHERE id = equipment_uuid;
  rental_days := end_date - start_date + 1;
  RETURN daily_rate * rental_days;
END;
$$ LANGUAGE plpgsql;