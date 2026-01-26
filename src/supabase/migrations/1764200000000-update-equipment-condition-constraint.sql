/*
# Update Equipment Condition Options

This migration updates the allowed values for the `current_condition` column in the `equipment` table to align with new business requirements.

## 1. Problem
The existing `CHECK` constraint for `equipment.current_condition` allowed the values: 'New', 'Good', 'Fair', 'Damaged'. The application's frontend is being updated to use a more user-friendly set of options: 'New', 'Good (Fully Functional)', and 'Used (Normal Wear)'.

## 2. Solution
This migration:
1.  Updates existing `Fair` and `Damaged` equipment to `Used` to prevent data from violating the new constraint.
2.  Drops the old `CHECK` constraint (`equipment_current_condition_check`).
3.  Creates a new `CHECK` constraint with the updated values: 'New', 'Good', 'Used'. The form will display the longer labels,but the database will store the shorter values for simplicity.

*/

-- Step 1: Update existing data to conform to the new constraint.
UPDATE public.equipment SET current_condition = 'Used' WHERE current_condition = 'Fair';
UPDATE public.equipment SET current_condition = 'Used' WHERE current_condition = 'Damaged';


-- Step 2: Drop the old constraint
ALTER TABLE public.equipment DROP CONSTRAINT IF EXISTS equipment_current_condition_check;

-- Step 3: Add the new constraint with updated values
ALTER TABLE public.equipment ADD CONSTRAINT equipment_current_condition_check CHECK (current_condition IN ('New', 'Good', 'Used'));