/*
# Fix Equipment Availability Check Logic

This migration corrects a critical bug in the `check_equipment_availability` RPC function that caused it to incorrectly report equipment as unavailable.

## 1. Problem
The original function contained a logical flaw in its `OVERLAPS` clause. The function's date parameters (`start_date`, `end_date`) were named identically to the columns in the `equipment_rentals` table. This shadowing caused the query to check for overlaps against its own input parameters (`(start_date, end_date) OVERLAPS (start_date, end_date)`), which would always return true if any rental existed for the equipment, regardless of the dates. This resulted in false negatives, making available equipment appear unavailable.

## 2. Solution
This migration fixes the bug by renaming the function parameters with a `p_` prefix (e.g., `p_start_date`, `p_end_date`). This resolves the name collision and allows the `OVERLAPS` clause to correctly compare the requested rental period against the periods of existing rentals in the database: `(equipment_rentals.start_date, equipment_rentals.end_date) OVERLAPS (p_start_date, p_end_date)`.

## 3. Impact
This change ensures that equipment availability checks are accurate, resolving the bug where users were blocked from renting available items. The corresponding service file (`equipmentService.js`) has also been updated to use the new parameter names.
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
$$ LANGUAGE plpgsql;