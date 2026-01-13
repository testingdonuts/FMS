import { supabase } from '../lib/supabase';

export const payoutService = {
  async getPayoutHistory(orgId) {
    const { data, error } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    return { data, error: error?.message };
  },

  async requestPayout(orgId, amount, method, details) {
    const feeRate = 0.03; // 3% flat fee
    const feeAmount = Math.round((amount * feeRate) * 100) / 100;
    const netAmount = amount - feeAmount;

    const { data, error } = await supabase
      .from('payout_requests')
      .insert([{
        organization_id: orgId,
        amount_gross: amount,
        fee_amount: feeAmount,
        amount_net: netAmount,
        payout_method: method,
        payout_details: details,
        status: 'pending'
      }])
      .select()
      .single();

    return { data, error: error?.message };
  }
};