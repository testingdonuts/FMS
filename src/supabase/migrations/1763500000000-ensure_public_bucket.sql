/* # Ensure Listings Bucket is Public

1. Purpose
- Fix broken images by ensuring the 'listings' storage bucket is publicly accessible.
- If the bucket doesn't exist, create it.
- If it exists but is private, update it to be public.

2. Changes
- Insert/Update `storage.buckets` table.
- Re-apply RLS policies for safety.
*/

-- 1. Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Ensure RLS policies are correct (Idempotent)
DO $$ 
BEGIN
    -- Allow public read access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow Public Read listings'
    ) THEN
        CREATE POLICY "Allow Public Read listings"
        ON storage.objects FOR SELECT TO public
        USING (bucket_id = 'listings');
    END IF;

    -- Allow authenticated uploads
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow Auth Uploads listings'
    ) THEN
        CREATE POLICY "Allow Auth Uploads listings"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'listings');
    END IF;
    
    -- Allow owners to update/delete
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow Owner Delete listings'
    ) THEN
        CREATE POLICY "Allow Owner Delete listings"
        ON storage.objects FOR DELETE TO authenticated
        USING (bucket_id = 'listings' AND (auth.uid() = owner));
    END IF;
END $$;