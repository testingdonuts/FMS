/*
# Fix Equipment Image Upload RLS Policy

This migration resolves a "new row violates row-level security policy" error that occurs when an organization member tries to upload an image for a piece of equipment.

## 1. Problem
The existing Row Level Security (RLS) policies for Supabase Storage (`storage.objects`) were hardcoded to only allow uploads, reads, and deletes for the `listings` bucket. When the application attempts to upload an image to the `equipment` bucket, the `INSERT` operation on `storage.objects` is blocked by RLS, causing the upload to fail.

## 2. Solution
This migration updates the storage RLS policies to be more comprehensive:
1.  **Bucket Creation**: It ensures that an `equipment` bucket exists and is marked as public, similar to the existing `listings` bucket.
2.  **DROP Old Policies**: It drops all previous, specific storage policies to avoid conflicts.
3.  **CREATE New Policies**: It creates new, consolidated policies that grant the necessary permissions (`INSERT`, `SELECT`, `DELETE`) for **both** the `listings` and `equipment` buckets.

- **INSERT**: Authenticated users can now upload to either bucket.
- **SELECT**: The public can now read from either bucket (necessary for displaying images).
- **DELETE**: Authenticated users can now delete their own objects from either bucket.

## 3. Impact
This change resolves the image upload error and allows organization members to successfully manage equipment images.
*/

-- Step 1: Ensure the 'equipment' bucket exists and is public.
-- This is idempotent and safe to re-run.
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment', 'equipment', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Step 2: Drop all old, specific storage policies to avoid conflicts.
-- It's safe to run these even if the policies don't exist.
DROP POLICY IF EXISTS "Allow Auth Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Allow Auth Delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Read listings" ON storage.objects;
DROP POLICY IF EXISTS "Allow Auth Uploads listings" ON storage.objects;
DROP POLICY IF EXISTS "Allow Owner Delete listings" ON storage.objects;

-- Step 3: Create new, consolidated policies for both 'listings' and 'equipment' buckets.

-- Allow authenticated users to upload files to 'listings' or 'equipment'.
CREATE POLICY "Allow authenticated uploads to specific buckets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK ( bucket_id IN ('listings', 'equipment') );

-- Allow public read access to files in 'listings' or 'equipment'.
CREATE POLICY "Allow public read on specific buckets"
ON storage.objects FOR SELECT TO public
USING ( bucket_id IN ('listings', 'equipment') );

-- Allow authenticated users to delete their own files from 'listings' or 'equipment'.
CREATE POLICY "Allow owner delete on specific buckets"
ON storage.objects FOR DELETE TO authenticated
USING ( bucket_id IN ('listings', 'equipment') AND (auth.uid() = owner) );