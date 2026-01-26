import supabase from '../supabase/supabase';

export const bookingService = {
  async getBookedSlots(orgId, date) {
    try {
      if (!orgId || !date) return { data: [], error: null };
      const searchDate = new Date(date);
      const startOfDay = new Date(searchDate.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(searchDate.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from('service_bookings')
        .select('booking_date')
        .eq('org_id', orgId)
        .gte('booking_date', startOfDay)
        .lte('booking_date', endOfDay)
        .not('status', 'eq', 'cancelled');

      if (error) throw error;
      return { data: data.map(b => {
        const date = new Date(b.booking_date);
        return date.toISOString().substring(11, 16); // Extract HH:MM format
      }), error: null };
    } catch (error) {
      return { data: [], error };
    }
  },

  async createBooking(bookingData) {
    try {
      const payload = {
        ...bookingData,
        org_id: bookingData.org_id || bookingData.organization_id,
        total_price: parseFloat(bookingData.total_price || 0)
      };
      delete payload.organization_id;

      const { data, error } = await supabase
        .from('service_bookings')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async createServiceBooking(bookingData) {
    return this.createBooking(bookingData);
  },

  async updateServiceBooking(bookingId, updates) {
    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .update(updates)
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  async getOrganizationBookings(orgId) {
    return await supabase.rpc('get_organization_bookings', { p_org_id: orgId });
  },

  async getServiceBookings(params = {}) {
    const { organizationId, parentId } = params || {};
    if (organizationId) {
      return await supabase.rpc('get_organization_bookings', { p_org_id: organizationId });
    }
    if (parentId) {
      return await supabase.rpc('get_parent_bookings', { p_parent_id: parentId });
    }
    return { data: [], error: null };
  },

  async getParentBookings(parentId) {
    return await supabase.rpc('get_parent_bookings', { p_parent_id: parentId });
  }
};

export default bookingService;