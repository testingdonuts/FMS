/*
    # Fix Helper Function for RLS Policies

    This migration corrects the `get_user_organization_id` helper function, which was referencing an incorrect table name. This caused Row Level Security policy checks to fail, leading to errors when creating new records like services.

    ## 1. Problem
    The `get_user_organization_id` function contained a reference to a non-existent table `public.profiles_1738744000000`. The correct table is `public.profiles`. This error blocked any operation that relied on an RLS policy using this function, such as creating a new service.

    ## 2. Solution
    This migration re-creates the function using `CREATE OR REPLACE`, ensuring it points to the correct `public.profiles` table.

    ## 3. Impact
    This change will resolve the "relation does not exist" errors and allow RLS policies to function correctly, unblocking operations like service creation.
    */

    CREATE OR REPLACE FUNCTION get_user_organization_id(user_id UUID)
    RETURNS UUID AS $$
    DECLARE
        org_id UUID;
    BEGIN
        -- This function now correctly references the 'profiles' table.
        SELECT organization_id INTO org_id
        FROM public.profiles WHERE id = user_id;
        RETURN org_id;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;