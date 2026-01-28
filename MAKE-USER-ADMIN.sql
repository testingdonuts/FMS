-- ================================================================
-- Make User an Admin
-- Email: info@fitmyseat.com.au
-- ================================================================

-- First, let's find the user and see their current role
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p
WHERE p.email = 'info@fitmyseat.com.au';

-- Update the user's role to admin
UPDATE public.profiles
SET 
  role = 'admin',
  updated_at = now()
WHERE email = 'info@fitmyseat.com.au';

-- Verify the update
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.updated_at
FROM public.profiles p
WHERE p.email = 'info@fitmyseat.com.au';

-- If the profile doesn't exist but the auth user does, create it:
-- (Only run this if the above SELECT returns no rows)
/*
DO $$
DECLARE
  v_uid uuid;
  v_email text := 'info@fitmyseat.com.au';
BEGIN
  -- Get the user ID from auth.users
  SELECT id INTO v_uid FROM auth.users WHERE email = v_email;
  
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'No auth user found with email %', v_email;
  END IF;
  
  -- Check if profile exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid) THEN
    -- Create admin profile
    INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (v_uid, v_email, 'FitMySeat Admin', 'admin', now(), now());
    RAISE NOTICE 'Created admin profile for %', v_email;
  ELSE
    -- Update existing profile to admin
    UPDATE public.profiles SET role = 'admin', updated_at = now() WHERE id = v_uid;
    RAISE NOTICE 'Updated % to admin role', v_email;
  END IF;
END $$;
*/
