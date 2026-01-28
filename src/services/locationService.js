import { supabase } from '../lib/supabase';

export const locationService = {
  async getLocations(orgId) {
    const { data, error } = await supabase
      .from('organization_locations_1763000000000')
      .select('*')
      .eq('organization_id', orgId)
      .order('is_primary', { ascending: false });
    return { data, error: error?.message };
  },

  async createLocation(orgId, locationData) {
    const { data, error } = await supabase
      .from('organization_locations_1763000000000')
      .insert([{ ...locationData, organization_id: orgId }])
      .select()
      .single();
    return { data, error: error?.message };
  },

  async updateLocation(locationId, updates) {
    const { data, error } = await supabase
      .from('organization_locations_1763000000000')
      .update(updates)
      .eq('id', locationId)
      .select()
      .single();
    return { data, error: error?.message };
  },

  async deleteLocation(locationId) {
    const { error } = await supabase
      .from('organization_locations_1763000000000')
      .delete()
      .eq('id', locationId);
    return { error: error?.message };
  }
};