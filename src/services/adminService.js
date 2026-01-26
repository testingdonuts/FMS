import { supabase } from '../lib/supabase';

export const adminService = {
  async getGlobalStats() {
    const { data, error } = await supabase.rpc('get_admin_stats');
    return { data: data?.[0], error: error?.message };
  },

  async getAllPayouts() {
    const { data, error } = await supabase.rpc('get_admin_payouts');
    return { data, error: error?.message };
  },

  async updatePayoutStatus(payoutId, status) {
    const { data, error } = await supabase
      .from('payout_requests')
      .update({ 
        status, 
        processed_at: status === 'paid' ? new Date().toISOString() : null 
      })
      .eq('id', payoutId)
      .select()
      .single();
    return { data, error: error?.message };
  },

  async getAllOrganizations() {
    const { data, error } = await supabase
      .from('organizations')
      .select(`
        *,
        owner:profiles!owner_id(full_name, email)
      `)
      .order('created_at', { ascending: false });
    return { data, error: error?.message };
  },

  async updateOrgVerification(orgId, status, notes = '') {
    const { data, error } = await supabase
      .from('organizations')
      .update({ verification_status: status, admin_notes: notes })
      .eq('id', orgId)
      .select()
      .single();
    return { data, error: error?.message };
  }
};