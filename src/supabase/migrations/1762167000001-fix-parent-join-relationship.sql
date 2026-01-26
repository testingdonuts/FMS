/*
# Fix Parent Join Relationship for Bookings and Rentals

This migration corrects the foreign key relationships for `parent_id` on the `service_bookings` and `equipment_rentals` tables to resolve a data fetching issue for parent users.

## 1. Problem
The client-side query to fetch a parent's bookings or rentals attempts to join the `profiles` table to get the parent's details using the syntax `parent:profiles!parent_id(*)`. This query fails with a "Could not find a relationship" error because the `parent_id` column on these tables has a foreign key to `auth.users(id)`, not `public.profiles(id)`. While both columns represent the same user UUID, the Supabase client library requires a direct foreign key relationship to perform this type of embedded join.

## 2. Solution
This migration alters the schema to create this direct relationship. It drops the existing foreign key constraints on `service_bookings.parent_id` and `equipment_rentals.parent_id` that point to `auth.users` and replaces them with new constraints that point directly to `public.profiles(id)`.

Since `public.profiles(id)` is itself a primary key that has a foreign key to `auth.users(id)`, data integrity is maintained, and the user's existence is still enforced.

This change allows the client-side queries to work as intended without needing to create additional RPC functions, resolving the bug with a minimal and correct schema adjustment.
*/

-- Step 1: Correct the foreign key for service_bookings.parent_id
-- Drop the old constraint pointing to auth.users. We assume the default name.
ALTER TABLE public.service_bookings DROP CONSTRAINT IF EXISTS service_bookings_parent_id_fkey;

-- Add the correct foreign key constraint to public.profiles
ALTER TABLE public.service_bookings
ADD CONSTRAINT service_bookings_parent_id_fkey
FOREIGN KEY (parent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- Step 2: Correct the foreign key for equipment_rentals.parent_id
-- Drop the old constraint pointing to auth.users. We assume the default name.
ALTER TABLE public.equipment_rentals DROP CONSTRAINT IF EXISTS equipment_rentals_parent_id_fkey;

-- Add the correct foreign key constraint to public.profiles
ALTER TABLE public.equipment_rentals
ADD CONSTRAINT equipment_rentals_parent_id_fkey
FOREIGN KEY (parent_id) REFERENCES public.profiles(id) ON DELETE CASCADE;