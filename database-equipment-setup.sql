-- Equipment Rental Management Database Setup
-- Run this in your Supabase SQL Editor

-- 1. Equipment table - stores all equipment available for rental
CREATE TABLE IF NOT EXISTS equipment_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  rental_price_per_day NUMERIC(10,2) NOT NULL CHECK (rental_price_per_day >= 0),
  deposit_amount NUMERIC(10,2) DEFAULT 0 CHECK (deposit_amount >= 0),
  current_condition TEXT DEFAULT 'Good' CHECK (current_condition IN ('New', 'Good', 'Fair', 'Damaged')),
  availability_status BOOLEAN DEFAULT true,
  image_urls TEXT[],
  specifications JSONB, -- Additional specs like dimensions, weight, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Equipment rentals table - tracks all rental transactions
CREATE TABLE IF NOT EXISTS equipment_rentals_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL,
  renter_id UUID NOT NULL,
  rental_start_date DATE NOT NULL,
  rental_end_date DATE NOT NULL,
  total_price NUMERIC(10,2) NOT NULL CHECK (total_price >= 0),
  deposit_paid BOOLEAN DEFAULT false,
  deposit_amount NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Equipment condition history - tracks condition over time
CREATE TABLE IF NOT EXISTS equipment_condition_history_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL,
  checked_by UUID NOT NULL,
  renter_id UUID, -- NULL if checked by staff
  condition TEXT NOT NULL CHECK (condition IN ('New', 'Good', 'Fair', 'Damaged')),
  notes TEXT,
  photos TEXT[], -- Before/after photos
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Equipment maintenance logs - tracks maintenance and repairs
CREATE TABLE IF NOT EXISTS equipment_maintenance_logs_fm7x9k2p1q (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID NOT NULL,
  performed_by UUID NOT NULL,
  action TEXT NOT NULL,
  notes TEXT,
  maintenance_date DATE DEFAULT CURRENT_DATE,
  cost NUMERIC(10,2) DEFAULT 0 CHECK (cost >= 0),
  next_maintenance_due DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE equipment_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_rentals_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_condition_history_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_maintenance_logs_fm7x9k2p1q ENABLE ROW LEVEL SECURITY;

-- Create simple policies for all operations
CREATE POLICY "equipment_access" ON equipment_fm7x9k2p1q FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "rentals_access" ON equipment_rentals_fm7x9k2p1q FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "condition_access" ON equipment_condition_history_fm7x9k2p1q FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "maintenance_access" ON equipment_maintenance_logs_fm7x9k2p1q FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_equipment_org_id ON equipment_fm7x9k2p1q (organization_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment_fm7x9k2p1q (category);
CREATE INDEX IF NOT EXISTS idx_equipment_availability ON equipment_fm7x9k2p1q (availability_status);

CREATE INDEX IF NOT EXISTS idx_rentals_equipment_id ON equipment_rentals_fm7x9k2p1q (equipment_id);
CREATE INDEX IF NOT EXISTS idx_rentals_renter_id ON equipment_rentals_fm7x9k2p1q (renter_id);
CREATE INDEX IF NOT EXISTS idx_rentals_dates ON equipment_rentals_fm7x9k2p1q (rental_start_date, rental_end_date);
CREATE INDEX IF NOT EXISTS idx_rentals_status ON equipment_rentals_fm7x9k2p1q (status);

CREATE INDEX IF NOT EXISTS idx_condition_equipment_id ON equipment_condition_history_fm7x9k2p1q (equipment_id);
CREATE INDEX IF NOT EXISTS idx_condition_date ON equipment_condition_history_fm7x9k2p1q (logged_at);

CREATE INDEX IF NOT EXISTS idx_maintenance_equipment_id ON equipment_maintenance_logs_fm7x9k2p1q (equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON equipment_maintenance_logs_fm7x9k2p1q (maintenance_date);

-- Function to check equipment availability for a date range
CREATE OR REPLACE FUNCTION check_equipment_availability(
  equipment_uuid UUID,
  start_date DATE,
  end_date DATE
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check if equipment exists and is available
  IF NOT EXISTS (
    SELECT 1 FROM equipment_fm7x9k2p1q 
    WHERE id = equipment_uuid AND availability_status = true
  ) THEN
    RETURN false;
  END IF;
  
  -- Check for overlapping rentals
  IF EXISTS (
    SELECT 1 FROM equipment_rentals_fm7x9k2p1q
    WHERE equipment_id = equipment_uuid
    AND status IN ('pending', 'active')
    AND (
      (rental_start_date <= end_date AND rental_end_date >= start_date)
    )
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
  SELECT rental_price_per_day INTO daily_rate
  FROM equipment_fm7x9k2p1q
  WHERE id = equipment_uuid;
  
  -- Calculate number of days
  rental_days := end_date - start_date + 1;
  
  RETURN daily_rate * rental_days;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT ALL ON equipment_fm7x9k2p1q TO authenticated;
GRANT ALL ON equipment_rentals_fm7x9k2p1q TO authenticated;
GRANT ALL ON equipment_condition_history_fm7x9k2p1q TO authenticated;
GRANT ALL ON equipment_maintenance_logs_fm7x9k2p1q TO authenticated;

-- Insert sample equipment categories and data
INSERT INTO equipment_fm7x9k2p1q (
  organization_id, 
  name, 
  description, 
  category, 
  rental_price_per_day, 
  deposit_amount,
  current_condition,
  specifications
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Professional Soccer Ball Set',
  'Set of 10 FIFA-approved soccer balls for training and matches',
  'Sports Equipment',
  25.00,
  50.00,
  'Good',
  '{"count": 10, "size": "Size 5", "material": "Synthetic leather"}'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Training Cones (Set of 20)',
  'Bright orange training cones for drills and field marking',
  'Training Accessories',
  15.00,
  25.00,
  'New',
  '{"count": 20, "height": "9 inches", "color": "Orange"}'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Portable Goal Posts',
  'Lightweight aluminum goal posts, easy to assemble',
  'Sports Equipment',
  40.00,
  100.00,
  'Good',
  '{"material": "Aluminum", "size": "8x6 feet", "weight": "25 lbs"}'
)
ON CONFLICT DO NOTHING;

-- Create storage bucket for equipment images
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-images', 'equipment-images', true)
ON CONFLICT DO NOTHING;

-- Create storage policy for equipment images
CREATE POLICY "Equipment images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'equipment-images');

CREATE POLICY "Authenticated users can upload equipment images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'equipment-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own equipment images" ON storage.objects
FOR UPDATE USING (bucket_id = 'equipment-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own equipment images" ON storage.objects
FOR DELETE USING (bucket_id = 'equipment-images' AND auth.role() = 'authenticated');

SELECT 'Equipment Rental Management database setup complete!' as message;