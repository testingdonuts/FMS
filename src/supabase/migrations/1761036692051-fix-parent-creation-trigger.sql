/*
    # Fix Parent Record Creation During Signup
    
    This migration addresses a critical issue where parent users are created with a `profiles` record but without a corresponding `parents` record.
    
    ## Problem
    The existing `handle_new_user_registration` trigger function contained an `EXCEPTION` block that would catch and suppress errors. When the `INSERT` into the `parents` table failed for any reason (like a misconfigured RLS policy), the error was hidden. This resulted in a partially completed signup: the `profiles` record was created, but the transaction was allowed to succeed without creating the essential `parents` record. This leads to an inconsistent data state.
    
    ## Solution
    This migration implements a two-part fix:
    
    1.  **Atomic Operation**: The `handle_new_user_registration` function is redefined to remove the `EXCEPTION` block. Now, if any step within the trigger fails (e.g., inserting into the `parents` table), the entire transaction will be rolled back. This guarantees that a user's profile and their role-specific record are created together or not at all, ensuring data integrity.
    
    2.  **Enhanced Logging &amp; RLS Correction**:
        -   Detailed logging (`RAISE LOG`) has been added to the trigger function. If the issue persists, these logs will provide clear insights into the point of failure (visible in the Supabase logs).
        -   The Row Level Security (RLS) policies for the `parents` table are explicitly dropped and recreated to ensure the trigger has the necessary permissions to perform `INSERT` operations. This proactively fixes the most likely underlying cause of the original error.
    */
    
    -- Step 1: Drop the existing trigger and function to apply the update
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP FUNCTION IF EXISTS handle_new_user_registration();
    
    -- Step 2: Recreate the function to be atomic and include logging
    CREATE OR REPLACE FUNCTION handle_new_user_registration()
    RETURNS TRIGGER AS $$
    DECLARE
      user_role TEXT;
      org_name TEXT;
      new_org_id UUID;
    BEGIN
      RAISE LOG 'Trigger handle_new_user_registration started for user %', NEW.id;
    
      -- Get user metadata from auth.users.raw_user_meta_data
      user_role := NEW.raw_user_meta_data-&gt;&gt;'role';
      org_name := NEW.raw_user_meta_data-&gt;&gt;'organization_name';
      RAISE LOG 'User role: %, Org name: %', user_role, org_name;
    
      -- Always create a profile first
      INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone,
        role
      ) VALUES (
        NEW.id,
        NEW.raw_user_meta_data-&gt;&gt;'full_name',
        NEW.email,
        NEW.raw_user_meta_data-&gt;&gt;'phone',
        user_role
      );
      RAISE LOG 'Profile created for user %', NEW.id;
    
      -- Handle organization-specific logic
      IF user_role = 'organization' THEN
        RAISE LOG 'Handling "organization" role for user %', NEW.id;
        INSERT INTO public.organizations (
          owner_id,
          name,
          email,
          phone
        ) VALUES (
          NEW.id,
          COALESCE(org_name, 'My Organization'),
          NEW.email,
          NEW.raw_user_meta_data-&gt;&gt;'phone'
        ) RETURNING id INTO new_org_id;
    
        UPDATE public.profiles
        SET organization_id = new_org_id
        WHERE id = NEW.id;
        RAISE LOG 'Organization record created for user % with org_id %', NEW.id, new_org_id;
    
      -- Handle parent-specific logic
      ELSIF user_role = 'parent' THEN
        RAISE LOG 'Handling "parent" role for user %', NEW.id;
        INSERT INTO public.parents (id) VALUES (NEW.id);
        RAISE LOG 'Parent record created for user %', NEW.id;
      END IF;
    
      RAISE LOG 'Trigger handle_new_user_registration finished for user %', NEW.id;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Step 3: Recreate the trigger to use the updated function
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();
    
    -- Step 4: Re-apply correct RLS policies for the `parents` table to be certain
    ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Parents can manage their own data" ON public.parents;
    DROP POLICY IF EXISTS "Authenticated users can insert parent records" ON public.parents;
    DROP POLICY IF EXISTS "parents_own_data" ON public.parents; -- Drop older name just in case
    
    -- Policy for parents to manage their own records (SELECT, UPDATE, DELETE)
    CREATE POLICY "Parents can manage their own data"
      ON public.parents FOR SELECT,UPDATE,DELETE
      USING (auth.uid() = id);
      
    -- Permissive INSERT policy needed for the signup trigger
    CREATE POLICY "Authenticated users can insert parent records"
      ON public.parents FOR INSERT
      TO authenticated WITH CHECK (true);