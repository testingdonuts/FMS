/* # Fix Public Listing Access

1. Purpose
- Ensure unauthenticated (public) users can view published listings.
- Ensure public users can see the organization details linked to those listings.
- Fix potential RLS issues where 'anon' role was being blocked.

2. Changes
- Explicitly grant SELECT on listings and organizations to the 'anon' role.
- Re-verify and simplify the public read policy for listings.
*/

-- 1. Grant base table permissions to public (anon) role
GRANT SELECT ON public.listings TO anon;
GRANT SELECT ON public.organizations TO anon;

-- 2. Ensure RLS is enabled
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 3. Redefine Listing Public Policy
-- Drop existing public policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view published listings" ON public.listings;
DROP POLICY IF EXISTS "Anyone can view published listings" ON public.listings;

CREATE POLICY "Allow public select published" 
ON public.listings 
FOR SELECT 
TO anon, authenticated 
USING (status = 'published');

-- 4. Redefine Organization Public Policy
-- Public needs to see organization names/logos for the listings to display correctly
DROP POLICY IF EXISTS "Public can view organizations" ON public.organizations;
DROP POLICY IF EXISTS "Anyone can view organizations" ON public.organizations;

CREATE POLICY "Allow public select organizations" 
ON public.organizations 
FOR SELECT 
TO anon, authenticated 
USING (true);

-- 5. Helper: If any listings exist but are all drafts, this update script 
-- (commented out) can be used manually to publish them for testing.
-- UPDATE public.listings SET status = 'published' WHERE status = 'draft';