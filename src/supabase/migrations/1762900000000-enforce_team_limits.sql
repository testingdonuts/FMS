/* 
# Enforce Tier-Based Team Limits
1. Purpose
  - Implement server-side enforcement of team member limits based on organization subscription tiers.
  - Free: 0 additional members
  - Professional: 5 members
  - Teams: Unlimited
2. Changes
  - New function `check_organization_team_limit` to validate counts.
  - Integration into invitation and member logic.
*/

-- 1. Helper function to check team limits
CREATE OR REPLACE FUNCTION check_organization_team_limit(p_org_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_tier TEXT;
  v_member_count INTEGER;
  v_invite_count INTEGER;
  v_total_reserved INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get the organization's tier
  SELECT subscription_tier INTO v_tier FROM public.organizations WHERE id = p_org_id;
  
  -- Define limits
  v_limit := CASE 
    WHEN v_tier = 'Professional' THEN 5
    WHEN v_tier = 'Teams' THEN 99999 -- Effectively unlimited
    ELSE 0 -- Free tier
  END;

  -- Count existing members
  SELECT COUNT(*) INTO v_member_count FROM public.team_members WHERE organization_id = p_org_id;
  
  -- Count pending invites
  SELECT COUNT(*) INTO v_invite_count FROM public.team_invites 
  WHERE organization_id = p_org_id AND status = 'pending' AND expires_at > NOW();

  v_total_reserved := v_member_count + v_invite_count;

  IF v_total_reserved >= v_limit THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END;
$$;

-- 2. Grant permissions
GRANT EXECUTE ON FUNCTION public.check_organization_team_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_organization_team_limit(UUID) TO service_role;

-- 3. Add a trigger to prevent exceeding limits via team_invites
CREATE OR REPLACE FUNCTION trigger_check_team_invite_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT check_organization_team_limit(NEW.organization_id) THEN
    RAISE EXCEPTION 'Team limit reached for your current plan. Please upgrade to add more members.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_team_invite_limit ON public.team_invites;
CREATE TRIGGER enforce_team_invite_limit
BEFORE INSERT ON public.team_invites
FOR EACH ROW EXECUTE FUNCTION trigger_check_team_invite_limit();