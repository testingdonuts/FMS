import { supabase } from '../lib/supabase';

export const listingService = {
  async createListing(listingData, organizationId) {
    if (!organizationId) {
      return { data: null, error: 'User organization profile not found. Please refresh and try again.' };
    }
    const { data, error } = await supabase
      .from('listings')
      .insert([{
        ...listingData,
        organization_id: organizationId,
        status: listingData.status || 'draft',
        is_featured: listingData.is_featured || false
      }])
      .select()
      .single();
    if (error) console.error("Create Listing Error:", error);
    return { data, error: error?.message };
  },

  async updateListing(listingId, listingData) {
    const { data, error } = await supabase
      .from('listings')
      .update(listingData)
      .eq('id', listingId)
      .select()
      .single();
    if (error) console.error("Update Listing Error:", error);
    return { data, error: error?.message };
  },

  async getOrganizationListings(organizationId) {
    if (!organizationId) return { data: [], error: null };
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });
    return { data, error: error?.message };
  },

  async getListingById(listingId) {
    const { data, error } = await supabase
      .from('listings')
      .select('*, organization:organizations(*)')
      .eq('id', listingId)
      .single();
    return { data, error: error?.message };
  },

  async deleteListing(listingId) {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', listingId);
    return { error: error?.message };
  },

  async searchListings(filters = {}) {
    const { query, categories, location } = filters;
    
    let request = supabase
      .from('listings')
      .select('*')
      .eq('status', 'published');

    if (query) {
      request = request.ilike('name', `%${query}%`);
    }

    if (location) {
      request = request.or(`address.ilike.%${location}%,zipcode.ilike.%${location}%`);
    }

    if (categories && categories.length > 0) {
      request = request.contains('categories', categories);
    }

    // CRITICAL: Order by Featured first, then by date
    const { data, error } = await request
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    return { data, error: error?.message };
  },

  async getPublishedListings(limit = 50) {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('status', 'published')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);
    return { data, error: error?.message };
  },
};