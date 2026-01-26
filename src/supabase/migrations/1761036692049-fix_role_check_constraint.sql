/*
    # Fix User Role Mismatch in Profiles Table
    
    This migration corrects a data validation mismatch that caused user registration to fail. The application was sending the role `'organization'`, but the database was expecting `'org_owner'`.
    
    ## Changes
    1.  **Drop Constraint**: The old `profiles_role_check` constraint is removed.
    2.  **Add Constraint**: A new `profiles_role_check` constraint is added to the `profiles` table.
    3.  **Updated Roles**: The new constraint now correctly includes `'organization'` as a valid role value, aligning with the application logic. The allowed roles are now `parent`, `organization`, `team_member`, and `admin`.
    
    This change resolves the "violates check constraint" error that occurred during the signup process for organizations.
    */
    
    -- Drop the existing incorrect check constraint.
    -- Using IF EXISTS prevents errors if the script is run multiple times or if the constraint has a different name.
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    
    -- Add the new check constraint with the correct set of roles, replacing 'org_owner' with 'organization'.
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('parent', 'organization', 'team_member', 'admin'));