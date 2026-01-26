import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth.jsx';

export function usePermissions() {
  const { user, profile } = useAuth();
  const [teamRole, setTeamRole] = useState(null);
  const [orgTier, setOrgTier] = useState(null);
  const isAuthenticated = !!user?.id;

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!isAuthenticated) return;

      // Fetch team role for current user (if part of a team)
      if (profile?.role === 'team_member') {
        const { data } = await supabase
          .from('team_members')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        if (isMounted) setTeamRole(data?.role || null);
      } else {
        if (isMounted) setTeamRole(null);
      }

      // Fetch org subscription tier if user belongs to an org
      if (profile?.organization_id) {
        const { data } = await supabase
          .from('organizations')
          .select('subscription_tier')
          .eq('id', profile.organization_id)
          .maybeSingle();
        if (isMounted) setOrgTier(data?.subscription_tier || null);
      } else {
        if (isMounted) setOrgTier(null);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.id, profile?.role, profile?.organization_id]);

  const perms = useMemo(() => {
    const role = profile?.role;
    const isAdmin = role === 'admin';
    const isOrgOwner = role === 'organization';
    const isTeamMember = role === 'team_member';
    const isParent = role === 'parent';

    const isManager = isTeamMember && teamRole === 'manager';
    const isTechnician = isTeamMember && teamRole === 'technician';
    const isStaff = isTeamMember && teamRole === 'staff';
    const isTeamsTier = orgTier === 'Teams';

    return {
      // Raw role facts
      role,
      teamRole,
      orgTier,
      isAuthenticated,
      isAdmin,
      isOrgOwner,
      isTeamMember,
      isParent,
      isManager,
      isTechnician,
      isStaff,
      isTeamsTier,

      // Capabilities (frontend gating; DB still enforces RLS)
      canViewAnalytics: isAdmin || isOrgOwner || isManager,
      canManageTeam: isAdmin || isOrgOwner || isManager,
      canManageServices: isAdmin || isOrgOwner || isManager,
      canManageEquipment: isAdmin || isOrgOwner || isManager || isTechnician,
      canManageLocations: isTeamsTier && (isAdmin || isOrgOwner || isManager),
      canUseAPI: isTeamsTier && (isAdmin || isOrgOwner || isManager),
      canViewEarnings: isAdmin || isOrgOwner,
      canChatWithParents: isOrgOwner || isManager || isTechnician,
    };
  }, [profile?.role, teamRole, orgTier, isAuthenticated]);

  return perms;
}
