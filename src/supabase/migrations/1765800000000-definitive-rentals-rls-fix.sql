/*
# Definitive Fix for Equipment Rentals RLS
This migration completely rewrites the RLS for `equipment_rentals` to stop "Policy Violation" errors during insertion.

## 1. The Core Issue
When a Parent inserts a rental, the database evaluates ALL `INSERT` policies. If one policy contains a subquery (like the Org policy checking `equipment.organization_id`) and that subquery fails to return a result (due to RLS on the `equipment` table), the entire transaction can fail with an RLS violation.

## 2. The Solution
- **Split Policies**: Separate `INSERT`, `SELECT`, and `UPDATE` into distinct policies.
- **Simplify Insert**: Use a dead-simple `INSERT` policy for parents that only checks `auth.uid()`.
- **Organization Integrity**: Use an `UPDATE` policy for organizations so they can manage statuses.
- **Grant Permissions**: Ensure the `authenticated` role has explicit table access.
*/

-- 1. Reset RLS state for the table
ALTER TABLE public.equipment_rentals ENABLE ROW LEVEL SECURITY;

-- 2. Forcefully remove ALL existing policies to ensure no legacy logic remains
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'equipment_rentals' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.equipment_rentals', pol.policyname);
    END LOOP;
END $$;

-- 3. PARENT POLICIES (The Renter)

-- Allow parents to see their own records
CREATE POLICY "rentals_parent_select" ON public.equipment_rentals
FOR SELECT TO authenticated
USING (auth.uid() = parent_id);

-- Allow parents to insert their own records
-- This is the critical fix: No subqueries, just a direct ID match.
CREATE POLICY "rentals_parent_insert" ON public.equipment_rentals
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = parent_id);


-- 4. ORGANIZATION POLICIES (The Owner)

-- Allow organizations to see rentals for their equipment
-- Using a subquery is safe for SELECT because it doesn't block other policies.
CREATE POLICY "rentals_org_select" ON public.equipment_rentals
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.equipment e
    WHERE e.id = equipment_rentals.equipment_id
    AND e.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);

-- Allow organizations to update rentals for their equipment (e.g., Approve/Complete)
CREATE POLICY "rentals_org_update" ON public.equipment_rentals
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.equipment e
    WHERE e.id = equipment_rentals.equipment_id
    AND e.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.equipment e
    WHERE e.id = equipment_id
    AND e.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);


-- 5. SERVICE BOOKINGS SYNC (Apply same robust logic)
-- Ensure service_bookings doesn't break next.

DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'service_bookings' AND schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.service_bookings', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "bookings_parent_select" ON public.service_bookings FOR SELECT TO authenticated USING (auth.uid() = parent_id);
CREATE POLICY "bookings_parent_insert" ON public.service_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "bookings_org_select" ON public.service_bookings FOR SELECT TO authenticated 
USING (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "bookings_org_update" ON public.service_bookings FOR UPDATE TO authenticated 
USING (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "bookings_team_select" ON public.service_bookings FOR SELECT TO authenticated 
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'team_member' 
  AND org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);


-- 6. FINAL PERMISSIONS
GRANT ALL ON public.equipment_rentals TO authenticated;
GRANT ALL ON public.service_bookings TO authenticated;
GRANT ALL ON public.equipment_rentals TO service_role;
GRANT ALL ON public.service_bookings TO service_role;