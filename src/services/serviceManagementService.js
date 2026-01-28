import { supabase } from '../lib/supabase';

export const serviceManagementService = {
  async testConnection() {
    try {
      const { data, error } = await supabase.from('services').select('id').limit(1);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async getAllOrganizations() {
    const { data, error } = await supabase.from('organizations').select('*');
    return { data, error: error?.message };
  },

  async getOrganizationById(organizationId) {
    if (!organizationId) return { data: null, error: 'Organization ID is required.' };
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();
    return { data, error: error?.message };
  },

  async getOrganizationServices(organizationId) {
    if (!organizationId) return { data: [], error: 'Organization ID is required.' };
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    return { data, error: error?.message };
  },

  async getActiveServices(organizationId = null) {
    let query = supabase.from('services').select('*, organization:organizations(*)').eq('is_active', true);
    if (organizationId) {
      query = query.eq('organization_id', organizationId);
    }
    const { data, error } = await query;
    return { data, error: error?.message };
  },

  async createService(serviceData, organizationId) {
    const { data, error } = await supabase
      .from('services')
      .insert([{ ...serviceData, organization_id: organizationId }])
      .select()
      .single();
    return { data, error: error?.message };
  },

  async updateService(serviceId, serviceData) {
    const { data, error } = await supabase
      .from('services')
      .update(serviceData)
      .eq('id', serviceId)
      .select()
      .single();
    return { data, error: error?.message };
  },

  async deleteService(serviceId) {
    const { error } = await supabase.from('services').delete().eq('id', serviceId);
    return { error: error?.message };
  },

  async toggleServiceStatus(serviceId, isActive) {
    const { data, error } = await supabase
      .from('services')
      .update({ is_active: isActive })
      .eq('id', serviceId)
      .select()
      .single();
    return { data, error: error?.message };
  },

  async applyDevCoupon(organizationId, code) {
    const coupons = {
      'PRO_STAGE': 'Professional',
      'TEAM_STAGE': 'Teams'
    };

    const targetTier = coupons[code.toUpperCase()];
    if (!targetTier) {
      return { error: 'Invalid or expired developer coupon code.' };
    }

    const { data, error } = await supabase
      .from('organizations')
      .update({ subscription_tier: targetTier })
      .eq('id', organizationId)
      .select()
      .single();

    return { data, error: error?.message };
  }
};