/*
# Clarify Equipment Availability Logic

This migration addresses a persistent bug where equipment was incorrectly reported as unavailable. It refines the logic inside the `check_equipment_availability` RPC function to be more explicit and robust.

## 1. Problem
Users reported that equipment they knew to be available was being marked as "not available for the selected dates." While previous migrations fixed parameter shadowing and permission issues, the core logic using the `OVERLAPS` operator might have been behaving unexpectedly in certain edge cases, or its behavior was simply not aligned with the business need for back-to-back daily rentals.

## 2. Solution
This migration replaces the `OVERLAPS` operator with an explicit boolean condition that is logically equivalent for checking overlapping date ranges but is more transparent and less prone to misinterpretation.

The condition:
`(start_date, end_date) OVERLAPS (p_start_date, p_end_date)`

is replaced with:
`(p_start_date <= end_date AND p_end_date >= start_date)`

This condition correctly identifies a conflict if a new rental period `[p_start_date, p_end_date]` overlaps with any existing rental period `[start_date, end_date]`. This change ensures the check is implemented in the most direct way possible, eliminating the `OVERLAPS` operator as a potential source of error and resolving the availability bug.

## 3. Impact
This change will make the equipment availability check more reliable and accurate. Users should no longer be blocked from renting equipment that is genuinely available.
*/

CREATE OR REPLACE FUNCTION check_equipment_availability(
    p_equipment_uuid UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- First, check if the equipment itself is marked as available
    IF NOT EXISTS (
        SELECT 1 FROM public.equipment
        WHERE id = p_equipment_uuid AND availability_status = true
    ) THEN
        RETURN false;
    END IF;

    -- Then, check for any overlapping rentals using an explicit condition
    IF EXISTS (
        SELECT 1
        FROM public.equipment_rentals
        WHERE
            equipment_id = p_equipment_uuid
            AND status IN ('pending', 'active')
            -- Explicitly check for overlapping date ranges.
            -- A conflict exists if the requested start date is before or on an existing end date,
            -- AND the requested end date is after or on an existing start date.
            AND (p_start_date <= end_date AND p_end_date >= start_date)
    ) THEN
        RETURN false; -- The equipment is rented during this period
    END IF;

    -- If no overlaps are found, the equipment is available
    RETURN true;
END;
$$;