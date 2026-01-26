import { supabase } from '../lib/supabase';

    // Using non-timestamped table names consistent with initial schema
    const TABLES = {
      SERVICES: 'services',
      ORGANIZATIONS: 'organizations',
      PROFILES: 'profiles'
    };

    export const serviceManagementService = {
      async getOrganizationById(orgId) {
        const { data, error } = await supabase
          .from(TABLES.ORGANIZATIONS)
          .select('*')
          .eq('id', orgId)
          .single();
        return { data, error: error?.message };
      },

      async getOrganizationByOwner(ownerId) {
        const { data, error } = await supabase
          .from(TABLES.ORGANIZATIONS)
          .select('*')
          .eq('owner_id', ownerId)
          .single();
        return { data, error: error?.message };
      },

      async createService(serviceData) {
        const { data, error } = await supabase
          .from(TABLES.SERVICES)
          .insert([serviceData])
          .select()
          .single();
        return { data, error: error?.message };
      },

      async updateService(serviceId, updates) {
        const { data, error } = await supabase
          .from(TABLES.SERVICES)
          .update(updates)
          .eq('id', serviceId)
          .select()
          .single();
        return { data, error: error?.message };
      },

      async deleteService(serviceId) {
        const { error } = await supabase
          .from(TABLES.SERVICES)
          .delete()
          .eq('id', serviceId);
        return { error: error?.message };
      },

      async getServicesByOrgId(orgId) {
        const { data, error } = await supabase
          .from(TABLES.SERVICES)
          .select('*')
          .eq('organization_id', orgId)
          .order('created_at', { ascending: false });
        return { data, error: error?.message };
      },
      
      async getOrganizationServices(orgId) {
        return this.getServicesByOrgId(orgId);
      },

      async getActiveServices() {
        const { data, error } = await supabase
          .from(TABLES.SERVICES)
          .select(`
            *,
            organization:organizations(name, address, zipcode)
          `)
          .eq('is_active', true)
          .limit(20);
        return { data, error: error?.message };
      },

      async toggleServiceStatus(serviceId, isActive) {
        return this.updateService(serviceId, { is_active: isActive });
      },
      
      async applyDevCoupon(orgId, code) {
        // Mock implementation for dev coupons
        let tier = 'Free';
        if (code === 'PRO_STAGE') tier = 'Professional';
        else if (code === 'TEAM_STAGE') tier = 'Teams';
        else return { error: 'Invalid coupon code' };

        const { data, error } = await supabase
          .from(TABLES.ORGANIZATIONS)
          .update({ subscription_tier: tier })
          .eq('id', orgId)
          .select()
          .single();
        return { data, error: error?.message };
      }
    };