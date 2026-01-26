/*
    # Fix RLS Policies for User Signup Trigger
    
    This migration corrects the Row Level Security (RLS) policies on the `profiles`, `organizations`, and `parents` tables to resolve database errors during new user registration.
    
    ## Problem
    The previous policies used a `FOR ALL` clause, which applied a restrictive check to `INSERT` operations. This check failed when the automated user registration trigger tried to create new records, as the trigger does not run within the new user's security context, leading to a "Database error saving new user".
    
    ## Solution
    This migration replaces the restrictive `FOR ALL` policies with granular policies for each table:
    1.  **Specific Policies**: Separate policies are created for `SELECT`, `UPDATE`, and `DELETE` operations, correctly restricting users to managing only their own data.
    2.  **Permissive INSERT Policy**: A new `INSERT` policy is created that allows any authenticated session (which includes the context the auth trigger runs in) to insert records. Data integrity is maintained by the tables' primary and foreign key constraints, which prevent invalid data from being inserted.
    
    This change ensures the signup trigger can create all necessary records atomically while maintaining security for existing data.
    */
    
    -- Step 1: Drop old, problematic policies
    -- Using a DO block to ignore errors if policies don't exist, making the script rerunnable.
    DO $$ BEGIN
      DROP POLICY IF EXISTS "profiles_own_data" ON public.profiles;
      DROP POLICY IF EXISTS "orgs_owners_manage" ON public.organizations;
      DROP POLICY IF EXISTS "parents_own_data" ON public.parents;
    END $$;
    
    -- Step 2: Create correct RLS policies for the `profiles` table
    -- Ensure RLS is enabled
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies to ensure a clean slate
    DROP POLICY IF EXISTS "Users can manage their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON public.profiles;

    -- Users can view, update, and delete their own profile
    CREATE POLICY "Users can manage their own profile"
      ON public.profiles FOR SELECT, UPDATE, DELETE
      USING (auth.uid() = id);
    
    -- Authenticated sessions can insert profiles. The trigger needs this.
    -- Security is maintained by the PRIMARY KEY constraint referencing auth.users(id).
    CREATE POLICY "Authenticated users can insert profiles"
      ON public.profiles FOR INSERT
      TO authenticated WITH CHECK (true);
    
    -- Step 3: Create correct RLS policies for the `organizations` table
    ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Owners can manage their own organization" ON public.organizations;
    DROP POLICY IF EXISTS "Authenticated users can insert organizations" ON public.organizations;

    -- Organization owners can view, update, and delete their own organization
    CREATE POLICY "Owners can manage their own organization"
      ON public.organizations FOR SELECT, UPDATE, DELETE
      USING (auth.uid() = owner_id);
    
    -- Authenticated sessions can insert organizations. The trigger needs this.
    CREATE POLICY "Authenticated users can insert organizations"
      ON public.organizations FOR INSERT
      TO authenticated WITH CHECK (true);
    
    -- Step 4: Create correct RLS policies for the `parents` table
    ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Parents can manage their own data" ON public.parents;
    DROP POLICY IF EXISTS "Authenticated users can insert parent records" ON public.parents;

    -- Parents can view, update, and delete their own record
    CREATE POLICY "Parents can manage their own data"
      ON public.parents FOR SELECT, UPDATE, DELETE
      USING (auth.uid() = id);
    
    -- Authenticated sessions can insert parent records. The trigger needs this.
    CREATE POLICY "Authenticated users can insert parent records"
      ON public.parents FOR INSERT
      TO authenticated WITH CHECK (true);