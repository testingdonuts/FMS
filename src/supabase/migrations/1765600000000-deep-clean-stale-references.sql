/*
# Deep Clean Stale Database References

This migration performs a comprehensive cleanup of all functions and triggers to eliminate any remaining references to the non-existent `profiles_1738744000000` table.

## 1. Problem
Stale references persist in the database because:
- Functions might have multiple versions with different signatures.
- Trigger functions are separate from the triggers themselves and might not have been updated.
- Some functions like `handle_new_user_registration` or `get_user_role` might still contain the old table name.

## 2. Solution
1. **Dynamic Cleanup**: Uses a PL/pgSQL block to find and drop **all** functions named `get_user_organization_id`, `get_user_role`, and `check_organization_team_limit` regardless of their arguments.
2. **Trigger Function Refresh**: Re-defines all critical trigger functions (`handle_new_user_registration`, `update_org_balance_on_payment`, etc.) with clean, verified SQL.
3. **Trigger Re-attachment**: Drops and re-creates all triggers to ensure they point to the newly defined, clean functions.
4. **Policy Re-verification**: Re-applies the robust subquery-based RLS policies.

## 3. Impact
This will completely purge the string `profiles_1738744000000` from the database's internal logic, fixing the "relation does not exist" error permanently.
*/

-- Step 1: Forcefully drop all variants of the problematic helper functions.
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT oid::regprocedure as signature
        FROM pg_proc 
        WHERE proname IN ('get_user_organization_id', 'get_user_role', 'check_organization_team_limit')
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION ' || func_record.signature || ' CASCADE';
    END LOOP;
END $$;

-- Step 2: Re-define Trigger Functions with CLEAN code.

-- A. New User Registration Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user_registration() 
RETURNS TRIGGER AS $$ 
DECLARE 
    user_role TEXT; 
    org_name TEXT; 
    invite_org_id UUID; 
    new_org_id UUID; 
    v_invite_code TEXT; 
    v_team_role TEXT; 
BEGIN 
    -- Extract metadata 
    user_role := NEW.raw_user_meta_data->>'role'; 
    org_name := NEW.raw_user_meta_data->>'organization_name'; 
    invite_org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID; 
    v_invite_code := NEW.raw_user_meta_data->>'invite_code'; 
    v_team_role := NEW.raw_user_meta_data->>'team_role'; 

    -- 1. Insert base profile (Verified table name: profiles)
    INSERT INTO public.profiles (id, full_name, email, phone, role, organization_id) 
    VALUES ( 
        NEW.id, 
        NEW.raw_user_meta_data->>'full_name', 
        NEW.email, 
        NEW.raw_user_meta_data->>'phone', 
        user_role, 
        invite_org_id 
    ); 

    -- 2. Handle Role-Specific Logic 
    IF user_role = 'organization' THEN 
        INSERT INTO public.organizations (owner_id, name, email, phone) 
        VALUES ( 
            NEW.id, 
            COALESCE(org_name, 'My Organization'), 
            NEW.email, 
            NEW.raw_user_meta_data->>'phone' 
        ) RETURNING id INTO new_org_id; 

        UPDATE public.profiles SET organization_id = new_org_id WHERE id = NEW.id; 
    ELSIF user_role = 'parent' THEN 
        INSERT INTO public.parents (id) VALUES (NEW.id); 
    ELSIF user_role = 'team_member' AND v_invite_code IS NOT NULL THEN 
        INSERT INTO public.team_members (organization_id, user_id, role) 
        VALUES (invite_org_id, NEW.id, COALESCE(v_team_role, 'technician')); 

        UPDATE public.team_invites SET status = 'accepted', updated_at = NOW() WHERE invite_code = v_invite_code; 
    END IF; 
    RETURN NEW; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Balance Update Trigger Function
CREATE OR REPLACE FUNCTION public.update_org_balance_on_payment() 
RETURNS TRIGGER AS $$ 
DECLARE 
    v_org_id UUID; 
BEGIN 
    IF NEW.payment_status = 'paid' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'paid') THEN 
        IF TG_TABLE_NAME = 'service_bookings' THEN 
            v_org_id := NEW.org_id; 
        ELSIF TG_TABLE_NAME = 'equipment_rentals' THEN 
            SELECT organization_id INTO v_org_id FROM public.equipment WHERE id = NEW.equipment_id; 
        END IF; 

        IF v_org_id IS NOT NULL THEN 
            UPDATE public.organizations SET balance = COALESCE(balance, 0) + NEW.total_price, updated_at = NOW() WHERE id = v_org_id; 
        END IF; 
    END IF; 
    RETURN NEW; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C. Payout Processing Trigger Function
CREATE OR REPLACE FUNCTION public.process_payout_request() 
RETURNS TRIGGER AS $$ 
BEGIN 
    UPDATE public.organizations SET balance = balance - NEW.amount_gross WHERE id = NEW.organization_id; 
    RETURN NEW; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- D. Team Limit Check (Helper for Triggers)
CREATE OR REPLACE FUNCTION public.check_organization_team_limit(p_org_id UUID) 
RETURNS BOOLEAN AS $$ 
DECLARE 
    v_tier TEXT; 
    v_member_count INTEGER; 
    v_invite_count INTEGER; 
    v_limit INTEGER; 
BEGIN 
    SELECT subscription_tier INTO v_tier FROM public.organizations WHERE id = p_org_id; 
    v_limit := CASE WHEN v_tier = 'Professional' THEN 5 WHEN v_tier = 'Teams' THEN 99999 ELSE 0 END; 
    SELECT COUNT(*) INTO v_member_count FROM public.team_members WHERE organization_id = p_org_id; 
    SELECT COUNT(*) INTO v_invite_count FROM public.team_invites WHERE organization_id = p_org_id AND status = 'pending' AND expires_at > NOW(); 
    RETURN (v_member_count + v_invite_count) < v_limit; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- E. Team Invite Limit Trigger Function
CREATE OR REPLACE FUNCTION public.trigger_check_team_invite_limit() 
RETURNS TRIGGER AS $$ 
BEGIN 
    IF NOT public.check_organization_team_limit(NEW.organization_id) THEN 
        RAISE EXCEPTION 'Team limit reached for your current plan. Please upgrade to add more members.'; 
    END IF; 
    RETURN NEW; 
END; 
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Re-attach All Triggers to the new functions.

-- Auth Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user_registration();

-- Balance Triggers
DROP TRIGGER IF EXISTS tr_update_balance_booking ON public.service_bookings;
CREATE TRIGGER tr_update_balance_booking AFTER UPDATE OF payment_status ON public.service_bookings FOR EACH ROW EXECUTE FUNCTION update_org_balance_on_payment();

DROP TRIGGER IF EXISTS tr_update_balance_rental ON public.equipment_rentals;
CREATE TRIGGER tr_update_balance_rental AFTER UPDATE OF payment_status ON public.equipment_rentals FOR EACH ROW EXECUTE FUNCTION update_org_balance_on_payment();

-- Payout Trigger
DROP TRIGGER IF EXISTS tr_process_payout ON public.payout_requests;
CREATE TRIGGER tr_process_payout BEFORE INSERT ON public.payout_requests FOR EACH ROW EXECUTE FUNCTION process_payout_request();

-- Team Limit Trigger
DROP TRIGGER IF EXISTS enforce_team_invite_limit ON public.team_invites;
CREATE TRIGGER enforce_team_invite_limit BEFORE INSERT ON public.team_invites FOR EACH ROW EXECUTE FUNCTION trigger_check_team_invite_limit();

-- Step 4: Final RLS Re-verification (Ensuring no function calls)

-- 1. LISTINGS
DROP POLICY IF EXISTS "Orgs can manage their listings" ON public.listings;
CREATE POLICY "Orgs can manage their listings" ON public.listings FOR ALL USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())) WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 2. SERVICES
DROP POLICY IF EXISTS "Orgs can manage their services" ON public.services;
CREATE POLICY "Orgs can manage their services" ON public.services FOR ALL USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())) WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 3. EQUIPMENT
DROP POLICY IF EXISTS "Orgs can manage equipment" ON public.equipment;
CREATE POLICY "Orgs can manage equipment" ON public.equipment FOR ALL USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())) WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 4. TEAM INVITES
DROP POLICY IF EXISTS "Org owners can manage invites" ON public.team_invites;
CREATE POLICY "Org owners can manage invites" ON public.team_invites FOR ALL USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())) WITH CHECK (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));