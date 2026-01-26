/*
# Fix Booking &amp; Rental Visibility for Parents by Correcting Foreign Keys

This migration corrects a critical schema issue that prevented parents from viewing their own service bookings and equipment rentals.

## 1. Problem
The `parent_id` column in both the `service_bookings` and `equipment_rentals` tables was incorrectly configured with a foreign key constraint referencing the `parents(id)` table instead of the primary user table, `auth.users(id)`.

This incorrect, indirect relationship breaks Supabase's ability to automatically join booking/rental data with user profile information. As a result, when the application tried to fetch bookings for a parent, the query would fail to retrieve any data, making it seem like the parent had no bookings.

## 2. Solution
This migration corrects the schema by ensuring the `parent_id` in both tables points directly to `auth.users(id)`. The script is idempotent, meaning it is safe to re-run without causing errors.

1.  **For `service_bookings` table**:
    - It first checks if the correct foreign key to `auth.users(id)` is missing.
    - If missing, it proceeds to drop the old, incorrect foreign key constraint.
    - Finally, it adds the correct foreign key constraint, linking `parent_id` directly to `auth.users(id)`.

2.  **For `equipment_rentals` table**:
    - It follows the same logic: checks for the correct key, and if absent, drops the old one and adds the new one.

## 3. Impact
This is a non-destructive schema change that aligns the database structure with the application's expectations. It fixes the root cause of the booking visibility bug for parents without altering any application code.
*/

-- Step 1: Correct the foreign key for service_bookings.parent_id
DO $$
BEGIN
  -- Check if a foreign key from service_bookings.parent_id to auth.users.id already exists.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public' AND tc.table_name = 'service_bookings'
      AND kcu.column_name = 'parent_id'
      AND ccu.table_schema = 'auth' AND ccu.table_name = 'users'
  ) THEN
    -- If the correct FK is missing, first try to drop the old, incorrect one.
    -- This assumes the old FK was named 'service_bookings_parent_id_fkey'. It's safe if it doesn't exist.
    IF EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'service_bookings_parent_id_fkey') THEN
      ALTER TABLE public.service_bookings DROP CONSTRAINT service_bookings_parent_id_fkey;
    END IF;

    -- Now, add the correct foreign key constraint.
    ALTER TABLE public.service_bookings
    ADD FOREIGN KEY (parent_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- Step 2: Correct the foreign key for equipment_rentals.parent_id
DO $$
BEGIN
  -- Check if a foreign key from equipment_rentals.parent_id to auth.users.id already exists.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public' AND tc.table_name = 'equipment_rentals'
      AND kcu.column_name = 'parent_id'
      AND ccu.table_schema = 'auth' AND ccu.table_name = 'users'
  ) THEN
    -- If the correct FK is missing, first try to drop the old, incorrect one.
    -- We assume the old FK was named 'equipment_rentals_parent_id_fkey'. It's safe if it doesn't exist.
    IF EXISTS(SELECT 1 FROM pg_constraint WHERE conname = 'equipment_rentals_parent_id_fkey') THEN
      ALTER TABLE public.equipment_rentals DROP CONSTRAINT equipment_rentals_parent_id_fkey;
    END IF;

    -- Now, add the correct foreign key constraint.
    ALTER TABLE public.equipment_rentals
    ADD FOREIGN KEY (parent_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;