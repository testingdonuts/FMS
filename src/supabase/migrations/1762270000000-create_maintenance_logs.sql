/*
# Create Maintenance Logs Table

1. New Tables
   - `maintenance_logs`
     - `id` (uuid, primary key)
     - `equipment_id` (uuid, foreign key to equipment)
     - `organization_id` (uuid, foreign key to organizations)
     - `type` (text: Routine, Repair, Inspection, Cleaning)
     - `description` (text)
     - `cost` (numeric)
     - `service_date` (date)
     - `performed_by` (text)
     - `status` (text: Scheduled, In Progress, Completed)
     - `created_at` (timestamptz)

2. Security
   - Enable RLS
   - Add policy for organizations to manage their own maintenance logs
*/

CREATE TABLE IF NOT EXISTS public.maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id UUID REFERENCES public.equipment(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('Routine', 'Repair', 'Inspection', 'Cleaning')),
  description TEXT,
  cost NUMERIC(10, 2) DEFAULT 0,
  service_date DATE NOT NULL,
  performed_by TEXT,
  status TEXT CHECK (status IN ('Scheduled', 'In Progress', 'Completed')) DEFAULT 'Completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policy
CREATE POLICY "Orgs can manage their maintenance logs" ON public.maintenance_logs
  FOR ALL USING (organization_id = get_user_organization_id(auth.uid()))
  WITH CHECK (organization_id = get_user_organization_id(auth.uid()));

-- Create Index for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_org_id ON public.maintenance_logs (organization_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_logs_equip_id ON public.maintenance_logs (equipment_id);