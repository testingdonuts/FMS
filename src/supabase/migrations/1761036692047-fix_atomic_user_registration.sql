/*
    # Fix Atomic User Registration Trigger
    
    This migration updates the `handle_new_user_registration` function to ensure user creation is an atomic operation.
    
    ## Changes
    - **Removed Exception Block**: The `EXCEPTION WHEN OTHERS` block has been removed from the trigger function.
    
    ## Reason for Change
    The previous implementation could lead to data inconsistencies. If an error occurred while creating an `organization` or `parent` record, the exception block would catch the error and allow the `profiles` record to be created without its corresponding role-specific data.
    
    By removing the exception handler, any failure within the trigger will cause the entire transaction to fail. This guarantees that a user's `profile` is only created if their `organization` or `parent` record can also be created successfully, maintaining data integrity.
    */
    
    -- Drop the existing trigger and function to apply the update
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP FUNCTION IF EXISTS handle_new_user_registration();
    
    -- Recreate the function without the exception block for atomic operations
    CREATE OR REPLACE FUNCTION handle_new_user_registration()
    RETURNS TRIGGER AS $$
    DECLARE
        user_role TEXT;
        org_name TEXT;
        new_org_id UUID;
    BEGIN
        -- Get user metadata from auth.users.raw_user_meta_data
        user_role := NEW.raw_user_meta_data->>'role';
        org_name := NEW.raw_user_meta_data->>'organization_name';
    
        -- Always create a profile first
        INSERT INTO public.profiles (
            id,
            full_name,
            email,
            phone,
            role
        ) VALUES (
            NEW.id,
            NEW.raw_user_meta_data->>'full_name',
            NEW.email,
            NEW.raw_user_meta_data->>'phone',
            user_role
        );
    
        -- Handle organization-specific logic
        IF user_role = 'organization' THEN
            -- Create the organization and get its new ID
            INSERT INTO public.organizations (
                owner_id,
                name,
                email,
                phone
            ) VALUES (
                NEW.id,
                COALESCE(org_name, 'My Organization'), -- Use a default name if not provided
                NEW.email,
                NEW.raw_user_meta_data->>'phone'
            ) RETURNING id INTO new_org_id;
    
            -- Update the user's profile with the new organization ID
            UPDATE public.profiles
            SET organization_id = new_org_id
            WHERE id = NEW.id;
    
        -- Handle parent-specific logic
        ELSIF user_role = 'parent' THEN
            INSERT INTO public.parents (id)
            VALUES (NEW.id);
        END IF;
    
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    
    -- Recreate the trigger to use the updated function
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();