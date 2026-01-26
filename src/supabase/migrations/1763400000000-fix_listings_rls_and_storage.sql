/* # Comprehensive Storage and Listings Fix

1. Storage
- Ensures 'listings' bucket is accessible.
- Adds RLS policies for storage.objects to allow authenticated uploads.
- Adds public read access for all files in the 'listings' bucket.

2. Listings Table
- Consolidates policies to ensure organizations can manage their data.
- Ensures organization_id is correctly validated.
*/

-- 1. STORAGE POLICIES (Targeting the storage schema)
-- Note: Bucket creation is manual in Supabase UI, but policies can be scripted.

-- Allow authenticated users to upload to 'listings' bucket
DO $$ 
BEGIN
    -- INSERT POLICY
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow Auth Uploads'
    ) THEN
        CREATE POLICY "Allow Auth Uploads"
        ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'listings');
    END IF;

    -- SELECT POLICY (Public Read)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow Public Read'
    ) THEN
        CREATE POLICY "Allow Public Read"
        ON storage.objects FOR SELECT TO public
        USING (bucket_id = 'listings');
    END IF;

    -- DELETE POLICY
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow Auth Delete'
    ) THEN
        CREATE POLICY "Allow Auth Delete"
        ON storage.objects FOR DELETE TO authenticated
        USING (bucket_id = 'listings' AND (auth.uid() = owner));
    END IF;
END $$;

-- 2. LISTINGS TABLE RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orgs can manage their listings" ON public.listings;
DROP POLICY IF EXISTS "Public can view published listings" ON public.listings;

-- Allow org owners to do everything with their own listings
CREATE POLICY "Orgs can manage their listings"
ON public.listings
FOR ALL
TO authenticated
USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
)
WITH CHECK (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

-- Public can view published ones
CREATE POLICY "Public can view published listings"
ON public.listings
FOR SELECT
TO anon, authenticated
USING (status = 'published');