-- Fixed database setup for team invitations system
-- This addresses the relationship issues between tables

-- Create team_invites table with proper structure
CREATE TABLE IF NOT EXISTS team_invites_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('team_member')),
  
  -- Invite security
  invite_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  
  invited_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE team_invites_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_invites_organization ON team_invites_fm7x9k2p1q (organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites_fm7x9k2p1q (email);
CREATE INDEX IF NOT EXISTS idx_team_invites_code ON team_invites_fm7x9k2p1q (invite_code);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON team_invites_fm7x9k2p1q (status);
CREATE INDEX IF NOT EXISTS idx_team_invites_invited_by ON team_invites_fm7x9k2p1q (invited_by);

-- Create simple, non-recursive RLS policies
CREATE POLICY "Enable all operations for authenticated users" 
ON team_invites_fm7x9k2p1q 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for organizations
ALTER TABLE organizations_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- Create simple policy for organizations
CREATE POLICY "Enable all operations for authenticated users" 
ON organizations_fm7x9k2p1q 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT,
  organization_id UUID,
  organization_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- Create simple policy for user_profiles
CREATE POLICY "Enable all operations for authenticated users" 
ON user_profiles_fm7x9k2p1q 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create listings table for business listings
CREATE TABLE IF NOT EXISTS listings_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
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
ALTER TABLE listings_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- Create policy for listings
CREATE POLICY "Enable all operations for authenticated users" 
ON listings_fm7x9k2p1q 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create events table
CREATE TABLE IF NOT EXISTS events_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  venue_id UUID,
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for events
ALTER TABLE events_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- Create policy for events
CREATE POLICY "Enable all operations for authenticated users" 
ON events_fm7x9k2p1q 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create venues table
CREATE TABLE IF NOT EXISTS venues_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  capacity INTEGER,
  seat_map_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for venues
ALTER TABLE venues_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- Create policy for venues
CREATE POLICY "Enable all operations for authenticated users" 
ON venues_fm7x9k2p1q 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles_fm7x9k2p1q (
    user_id,
    full_name,
    email,
    phone,
    role,
    organization_name,
    organization_id
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'role',
    NEW.raw_user_meta_data->>'organization_name',
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'organization' THEN NEW.id
      ELSE (NEW.raw_user_meta_data->>'organization_id')::UUID
    END
  );
  
  -- If user is an organization owner, create organization record
  IF NEW.raw_user_meta_data->>'role' = 'organization' THEN
    INSERT INTO organizations_fm7x9k2p1q (
      id,
      name,
      owner_id
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Organization'),
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();

-- Insert some sample data for testing
INSERT INTO organizations_fm7x9k2p1q (id, name, owner_id) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Elite Sports Academy', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440001', 'Youth Training Center', '550e8400-e29b-41d4-a716-446655440001')
ON CONFLICT (id) DO NOTHING;

-- Insert sample venues
INSERT INTO venues_fm7x9k2p1q (id, name, address, city, capacity) VALUES 
('660e8400-e29b-41d4-a716-446655440000', 'Madison Square Garden', '4 Pennsylvania Plaza', 'New York', 20000),
('660e8400-e29b-41d4-a716-446655440001', 'Staples Center', '1111 S Figueroa St', 'Los Angeles', 19000)
ON CONFLICT (id) DO NOTHING;

-- Insert sample events
INSERT INTO events_fm7x9k2p1q (id, title, description, date, venue_id, price_range_min, price_range_max) VALUES 
('770e8400-e29b-41d4-a716-446655440000', 'Rock Concert 2024', 'Amazing rock concert with top artists', '2024-06-15 20:00:00+00', '660e8400-e29b-41d4-a716-446655440000', 50.00, 200.00),
('770e8400-e29b-41d4-a716-446655440001', 'Basketball Championship', 'Finals game of the season', '2024-07-20 19:00:00+00', '660e8400-e29b-41d4-a716-446655440001', 75.00, 300.00)
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT ALL ON team_invites_fm7x9k2p1q TO authenticated;
GRANT ALL ON organizations_fm7x9k2p1q TO authenticated;
GRANT ALL ON user_profiles_fm7x9k2p1q TO authenticated;
GRANT ALL ON listings_fm7x9k2p1q TO authenticated;
GRANT ALL ON events_fm7x9k2p1q TO authenticated;
GRANT ALL ON venues_fm7x9k2p1q TO authenticated;