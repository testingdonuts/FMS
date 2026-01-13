/*
# Fix Equipment Availability Check Permissions

This migration corrects a critical permission issue in the `check_equipment_availability` RPC function that caused it to fail for non-administrative users.

## 1. Problem
The function was created with `SECURITY INVOKER` privileges (the default), meaning it ran with the permissions of the user calling it. A regular 'parent' user only has permission to see their own rentals due to Row Level Security (RLS) policies. However, to check for availability, the function needs to scan for *all* conflicting rentals for a piece of equipment, including those made by other users. This caused a permission denied error, which was reported as "unable to run query" by the application.

## 2. Solution
This migration re-defines the function with `SECURITY DEFINER` privileges. This allows the function to execute with the permissions of its owner (the database administrator), bypassing the RLS policies of the calling user for the duration of its execution. The function's logic is sound and only checks for date overlaps, so this is a safe and necessary change to allow availability checks to work correctly for all users.

## 3. Impact
This change resolves the "unable to run query" error that occurred when parents tried to check equipment availability. All users can now reliably check if equipment is available for their desired dates.
*/

CREATE OR REPLACE FUNCTION check_equipment_availability(
  p_equipment_uuid UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS BOOLEAN AS $$
BEGIN
  -- First, check if the equipment itself is marked as available
  IF NOT EXISTS (
    SELECT 1 FROM public.equipment
    WHERE id = p_equipment_uuid AND availability_status = true
  ) THEN
    RETURN false;
  END IF;

  -- Then, check for any overlapping rentals
  IF EXISTS (
    SELECT 1 FROM public.equipment_rentals
    WHERE
      equipment_id = p_equipment_uuid AND
      status IN ('pending', 'active') AND
      -- Correctly check if the requested period overlaps with an existing rental period
      (start_date, end_date) OVERLAPS (p_start_date, p_end_date)
  ) THEN
    RETURN false; -- The equipment is rented during this period
  END IF;

  -- If no overlaps are found, the equipment is available
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;