import { supabase } from '../lib/supabase';

export const eventService = {
  async getAllEvents() {
    // This table does not exist in the schema, returning mock data.
    return { data: [], error: null };
  },
  async searchEvents(query, date = null) {
    // This table does not exist in the schema, returning mock data.
    return { data: [], error: null };
  },
  async getEventById(eventId) {
    // This table does not exist in the schema, returning mock data.
    return { data: null, error: 'Not implemented' };
  },
};