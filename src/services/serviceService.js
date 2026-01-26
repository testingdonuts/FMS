import supabase from '../supabase/supabase';

/**
 * Service for handling Service offerings (not bookings).
 * Homepage likely uses this too.
 */
export const serviceService = {
  async getServices() {
    const { data, error } = await supabase
      .from('services')
      .select('*, organizations(name, logo_url)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getFeaturedServices() {
    // Return top 4 active services
    const { data, error } = await supabase
      .from('services')
      .select('*, organizations(name)')
      .eq('is_active', true)
      .limit(4);
    return { data, error };
  },

  async getServiceById(id) {
    const { data, error } = await supabase
      .from('services')
      .select('*, organizations(*)')
      .eq('id', id)
      .single();
    return { data, error };
  }
};

export default serviceService;