/*
    # Teams Plan Infrastructure Update

    1. New Tables
        - `organization_locations`: Supports Multi-location management.
        - `organization_api_keys`: Supports API/Custom Integrations.

    2. Schema Changes
        - Add `location_id` to `services`, `equipment`, and `service_bookings`.

    3. Security
        - Enable RLS on new tables.
        - Grant permissions to authenticated users.
    */

    -- 1. Create Locations Table
    CREATE TABLE IF NOT EXISTS public.organization_locations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT,
        state TEXT,
        zipcode TEXT,
        phone TEXT,
        is_primary BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 2. Create API Keys Table
    CREATE TABLE IF NOT EXISTS public.organization_api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        key_prefix TEXT NOT NULL,
        secret_hash TEXT NOT NULL, -- In a real app, this would be hashed
        last_used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );


    -- 3. Update Existing Tables for Location Support
    ALTER TABLE public.services ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.organization_locations(id) ON DELETE SET NULL;
    ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.organization_locations(id) ON DELETE SET NULL;
    ALTER TABLE public.service_bookings ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.organization_locations(id) ON DELETE SET NULL;


    -- 4. RLS Policies
    ALTER TABLE public.organization_locations ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.organization_api_keys ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Org members can view locations" ON public.organization_locations
        FOR SELECT
        USING (organization_id = get_user_organization_id(auth.uid()));

    CREATE POLICY "Managers can manage locations" ON public.organization_locations
        FOR ALL
        USING (
            organization_id = get_user_organization_id(auth.uid())
            AND (
                get_user_role(auth.uid()) = 'organization'
                OR
                EXISTS (SELECT 1 FROM team_members WHERE user_id = auth.uid() AND role = 'manager')
            )
        );

    CREATE POLICY "Owners can manage API keys" ON public.organization_api_keys
        FOR ALL
        USING (
            organization_id = get_user_organization_id(auth.uid())
            AND get_user_role(auth.uid()) = 'organization'
        );

    -- 5. Helper function for Teams API check
    CREATE OR REPLACE FUNCTION is_teams_plan(p_org_id UUID) RETURNS BOOLEAN AS $$
        SELECT EXISTS (
            SELECT 1 FROM organizations WHERE id = p_org_id AND subscription_tier = 'Teams'
        );
    $$ LANGUAGE sql SECURITY DEFINER;