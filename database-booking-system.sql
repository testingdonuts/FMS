-- Booking System Database Setup for FitMySeat
-- Run this in your Supabase SQL Editor

-- 1. Service Bookings Table
CREATE TABLE IF NOT EXISTS service_bookings_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  technician_id UUID, -- references team members
  parent_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL,
  scheduled_time TIME,
  status TEXT CHECK (status IN ('pending','confirmed','completed','cancelled')) DEFAULT 'pending',
  notes TEXT,
  total_price NUMERIC(10,2),
  payment_status TEXT CHECK (payment_status IN ('unpaid','paid','refunded')) DEFAULT 'unpaid',
  child_name TEXT,
  child_age INTEGER,
  vehicle_info TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update Equipment Rentals Table (extend existing)
ALTER TABLE equipment_rentals_fm7x9k2p1q 
ADD COLUMN IF NOT EXISTS payment_status TEXT CHECK (payment_status IN ('unpaid','paid','refunded')) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS child_name TEXT,
ADD COLUMN IF NOT EXISTS child_age INTEGER,
ADD COLUMN IF NOT EXISTS pickup_address TEXT,
ADD COLUMN IF NOT EXISTS return_method TEXT DEFAULT 'pickup' CHECK (return_method IN ('pickup','dropoff'));

-- 3. Booking Availability Table (for time slot management)
CREATE TABLE IF NOT EXISTS booking_availability_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  technician_id UUID,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  booking_id UUID, -- reference to service_bookings when booked
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Service Types Table
CREATE TABLE IF NOT EXISTS service_types_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER DEFAULT 60,
  price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE service_bookings_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_availability_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Service Bookings
CREATE POLICY "Parents can view their bookings" ON service_bookings_fm7x9k2p1q
FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "Parents can create bookings" ON service_bookings_fm7x9k2p1q
FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Org owners can view org bookings" ON service_bookings_fm7x9k2p1q
FOR SELECT USING (
  organization_id IN (
    SELECT id FROM organizations_fm7x9k2p1q WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Org owners can update org bookings" ON service_bookings_fm7x9k2p1q
FOR UPDATE USING (
  organization_id IN (
    SELECT id FROM organizations_fm7x9k2p1q WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Team members can view org bookings" ON service_bookings_fm7x9k2p1q
FOR SELECT USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles_fm7x9k2p1q 
    WHERE user_id = auth.uid() AND role = 'team_member'
  )
);

CREATE POLICY "Team members can update org bookings" ON service_bookings_fm7x9k2p1q
FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles_fm7x9k2p1q 
    WHERE user_id = auth.uid() AND role = 'team_member'
  )
);

-- RLS Policies for Booking Availability
CREATE POLICY "Public can view availability" ON booking_availability_fm7x9k2p1q
FOR SELECT USING (true);

CREATE POLICY "Org owners can manage availability" ON booking_availability_fm7x9k2p1q
FOR ALL USING (
  organization_id IN (
    SELECT id FROM organizations_fm7x9k2p1q WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Team members can manage availability" ON booking_availability_fm7x9k2p1q
FOR ALL USING (
  organization_id IN (
    SELECT organization_id FROM user_profiles_fm7x9k2p1q 
    WHERE user_id = auth.uid() AND role = 'team_member'
  )
);

-- RLS Policies for Service Types
CREATE POLICY "Public can view service types" ON service_types_fm7x9k2p1q
FOR SELECT USING (is_active = true);

CREATE POLICY "Org owners can manage service types" ON service_types_fm7x9k2p1q
FOR ALL USING (
  organization_id IN (
    SELECT id FROM organizations_fm7x9k2p1q WHERE owner_id = auth.uid()
  )
);

-- Functions for booking logic
CREATE OR REPLACE FUNCTION check_booking_availability(
  org_id UUID,
  tech_id UUID,
  booking_date DATE,
  start_time TIME,
  duration_minutes INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  end_time TIME;
  conflicts INTEGER;
BEGIN
  -- Calculate end time
  end_time := start_time + (duration_minutes || ' minutes')::INTERVAL;
  
  -- Check for conflicts
  SELECT COUNT(*) INTO conflicts
  FROM service_bookings_fm7x9k2p1q
  WHERE organization_id = org_id
    AND technician_id = tech_id
    AND DATE(scheduled_date) = booking_date
    AND status IN ('pending', 'confirmed')
    AND (
      (scheduled_time BETWEEN start_time AND end_time) OR
      (scheduled_time + INTERVAL '1 hour' BETWEEN start_time AND end_time) OR
      (start_time BETWEEN scheduled_time AND scheduled_time + INTERVAL '1 hour')
    );
  
  RETURN conflicts = 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_available_time_slots(
  org_id UUID,
  tech_id UUID,
  booking_date DATE,
  duration_minutes INTEGER DEFAULT 60
) RETURNS TABLE(time_slot TIME, available BOOLEAN) AS $$
DECLARE
  slot_time TIME;
BEGIN
  -- Generate time slots from 9 AM to 5 PM
  FOR slot_time IN 
    SELECT generate_series('09:00'::TIME, '17:00'::TIME, '1 hour'::INTERVAL)::TIME
  LOOP
    RETURN QUERY SELECT 
      slot_time,
      check_booking_availability(org_id, tech_id, booking_date, slot_time, duration_minutes);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_bookings_org_id ON service_bookings_fm7x9k2p1q (organization_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_parent_id ON service_bookings_fm7x9k2p1q (parent_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_technician_id ON service_bookings_fm7x9k2p1q (technician_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_date ON service_bookings_fm7x9k2p1q (scheduled_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings_fm7x9k2p1q (status);

CREATE INDEX IF NOT EXISTS idx_booking_availability_org_tech_date ON booking_availability_fm7x9k2p1q (organization_id, technician_id, date);

CREATE INDEX IF NOT EXISTS idx_service_types_org_id ON service_types_fm7x9k2p1q (organization_id);

-- Insert sample service types
INSERT INTO service_types_fm7x9k2p1q (organization_id, name, description, duration_minutes, price) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Car Seat Installation', 'Professional installation of infant, convertible, or booster car seats', 60, 75.00),
('550e8400-e29b-41d4-a716-446655440000', 'Car Seat Safety Check', 'Comprehensive safety inspection of existing car seat installation', 30, 35.00),
('550e8400-e29b-41d4-a716-446655440000', 'Car Seat Education Session', 'One-on-one education about proper car seat use and safety', 45, 50.00),
('550e8400-e29b-41d4-a716-446655440000', 'Travel System Setup', 'Installation and education for travel systems (car seat + stroller)', 90, 100.00)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON service_bookings_fm7x9k2p1q TO authenticated;
GRANT ALL ON booking_availability_fm7x9k2p1q TO authenticated;
GRANT ALL ON service_types_fm7x9k2p1q TO authenticated;

SELECT 'Booking System database setup complete!' as message;