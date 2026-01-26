/*
# Fix Equipment Rentals and Bookings RLS

This migration restores the missing Parent policies and stabilizes the Organization policies for `equipment_rentals` and `service_bookings`.

## 1. Problem
The previous "Deep Clean" migration used `CASCADE`, which automatically dropped all RLS policies that depended on the old helper functions. While the Organization policies were recreated for some tables, the Parent policies (which allow users to create their own bookings/rentals) were missing. This caused "RLS Violation" errors for parents.

## 2. Solution
1. **Explicit Parent Policies**: Add policies that allow authenticated users to `INSERT` and `SELECT` their own records based on `parent_id = auth.uid()`.
2. **Robust Org Policies**: Re-apply organization policies using direct subqueries to the `profiles` table.
3. **Consistency**: Apply the same logic to `service_bookings` to prevent similar issues there.

## 3. Impact
Parents will be able to successfully book services and rent equipment again. Organizations will retain management access to their respective data.
*/

--=========================================
-- 1. EQUIPMENT RENTALS
--=========================================
ALTER TABLE public.equipment_rentals ENABLE ROW LEVEL SECURITY;

-- Clean up any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Parents can manage own rentals" ON public.equipment_rentals;
DROP POLICY IF EXISTS "Orgs can manage their rentals" ON public.equipment_rentals;
DROP POLICY IF EXISTS "Parents can insert own rentals" ON public.equipment_rentals;
DROP POLICY IF EXISTS "Parents can select own rentals" ON public.equipment_rentals;

-- Policy for Parents (Renters)
-- Allows them to see their own rentals and create new ones for themselves
CREATE POLICY "Parents can manage own rentals" ON public.equipment_rentals
FOR ALL TO authenticated
USING (auth.uid() = parent_id)
WITH CHECK (auth.uid() = parent_id);

-- Policy for Organizations (Owners)
-- Allows them to see and manage rentals for equipment they own
CREATE POLICY "Orgs can manage their rentals" ON public.equipment_rentals
FOR ALL TO authenticated
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
    WHERE e.id = equipment_id -- Note: using equipment_id from the new row being inserted
    AND e.organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  )
);


--=========================================
-- 2. SERVICE BOOKINGS
--=========================================
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

-- Clean up
DROP POLICY IF EXISTS "Parents can manage own bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Orgs can manage their bookings" ON public.service_bookings;
DROP POLICY IF EXISTS "Team members can view and update their org bookings" ON public.service_bookings;

-- Policy for Parents (Customers)
CREATE POLICY "Parents can manage own bookings" ON public.service_bookings
FOR ALL TO authenticated
USING (auth.uid() = parent_id)
WITH CHECK (auth.uid() = parent_id);

-- Policy for Organizations (Providers)
CREATE POLICY "Orgs can manage their bookings" ON public.service_bookings
FOR ALL TO authenticated
USING (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
WITH CHECK (org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- Policy for Team Members
CREATE POLICY "Team members can view and update their org bookings" ON public.service_bookings
FOR SELECT, UPDATE TO authenticated
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'team_member'
  AND org_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

--=========================================
-- 3. PERMISSIONS RE-CHECK
--=========================================
-- Ensure the authenticated role has basic table access
GRANT ALL ON public.equipment_rentals TO authenticated;
GRANT ALL ON public.service_bookings TO authenticated;