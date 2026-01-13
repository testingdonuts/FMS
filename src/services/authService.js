import { supabase } from '../lib/supabase';

export const authService = {
  async signUp(email, password, userData = {}) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData.fullName,
          phone: userData.phone,
          role: userData.role,
          organization_name: userData.organizationName,
          invite_code: userData.inviteCode,
          organization_id: userData.organizationId,
          team_role: userData.teamRole
        },
      },
    });
    if (error) {
      return { data: null, error: error.message };
    }
    return { data, error: null };
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error: error?.message };
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async getCurrentUser() {
    return supabase.auth.getSession();
  },

  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error: error?.message };
  },

  async updateUserProfile(userId, profileData) {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();
    return { data, error: error?.message };
  },

  async resetPasswordForEmail(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/reset-password`,
    });
    return { data, error: error?.message };
  },

  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { data, error: error?.message };
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  },
};