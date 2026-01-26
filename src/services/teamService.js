import { supabase } from '../lib/supabase';

export const teamService = {
  async getTeamStats(organizationId) {
    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', organizationId)
      .single();

    const { count: membersCount } = await supabase
      .from('team_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const { count: invitesCount } = await supabase
      .from('team_invites')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString());

    const tier = org?.subscription_tier || 'Free';
    const limit = tier === 'Professional' ? 5 : tier === 'Teams' ? Infinity : 0;

    return {
      tier,
      limit,
      current: (membersCount || 0) + (invitesCount || 0),
      membersCount: membersCount || 0,
      invitesCount: invitesCount || 0,
      remaining: limit === Infinity ? Infinity : Math.max(0, limit - ((membersCount || 0) + (invitesCount || 0)))
    };
  },

  async sendTeamInvitation(invitationData) {
    const stats = await this.getTeamStats(invitationData.organizationId);
    if (stats.remaining <= 0) {
      return { error: `Your ${stats.tier} plan allows up to ${stats.limit} team members. Upgrade to add more.` };
    }

    const { data, error } = await supabase
      .from('team_invites')
      .insert([
        {
          organization_id: invitationData.organizationId,
          email: invitationData.email,
          role: invitationData.role,
          invited_by: invitationData.invitedBy,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Team invitation send error:', error);
      return { data: null, error: error?.message || 'Failed to send invitation' };
    }

    return { data, error: null };
  },

  async getOrganizationInvitations(organizationId) {
    const { data, error } = await supabase
      .from('team_invites')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    return { data, error: error?.message };
  },

  async getTeamMembers(organizationId) {
    // First get team members
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select('*')
      .eq('organization_id', organizationId);

    if (membersError) {
      return { data: [], error: membersError?.message };
    }

    // Then get profiles for these team members
    if (members && members.length > 0) {
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Merge profiles into members (profiles.id matches team_members.user_id)
      const profileMap = {};
      profiles?.forEach(p => {
        profileMap[p.id] = p;
      });

      const enrichedMembers = members.map(m => ({
        ...m,
        profile: profileMap[m.user_id] || null
      }));

      return { data: enrichedMembers, error: null };
    }

    return { data: members, error: null };
  },

  async removeTeamMember(memberId) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);
    return { error: error?.message };
  },

  async validateInvitationCode(inviteCode) {
    const { data, error } = await supabase.rpc('validate_invite_code', {
      p_invite_code: inviteCode,
    });

    if (error) {
      console.error('RPC error validating invite code:', error);
      return { data: null, error: 'An error occurred while validating the code.' };
    }

    if (!data || data.length === 0) {
      return { data: null, error: 'Invalid or expired invitation code' };
    }

    const invitation = data[0];
    const formattedData = {
      ...invitation,
      organization: { name: invitation.organization_name },
    };
    delete formattedData.organization_name;

    return { data: formattedData, error: null };
  },

  async acceptInvitation(inviteCode, userData) {
    const { data: invite, error: inviteError } = await this.validateInvitationCode(inviteCode);
    if (inviteError) return { data: null, error: inviteError };

    // We pass all necessary data to Auth SignUp. 
    // The Database Trigger 'handle_new_user_registration' will handle the actual 
    // table inserts for profiles and team_members using this metadata.
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: invite.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.fullName,
          phone: userData.phone,
          role: 'team_member',
          organization_id: invite.organization_id,
          invite_code: inviteCode, // Trigger uses this to find the invite
          team_role: invite.role,   // Trigger uses this for team_members table
        },
      },
    });

    if (signUpError || !authData.user) {
      return { data: null, error: `Failed to create account: ${signUpError?.message}` };
    }

    return { data: authData.user, error: null };
  },

  async revokeInvitation(invitationId) {
    const { error } = await supabase.from('team_invites').update({ status: 'revoked' }).eq('id', invitationId);
    return { error: error?.message };
  },

  async resendInvitation(invitationId) {
    const { data, error } = await supabase
      .from('team_invites')
      .update({
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', invitationId);
    return { error: error?.message };
  }
};