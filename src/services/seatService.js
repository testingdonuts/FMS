import { supabase } from '../lib/supabase';

export const seatService = {
  async getSeatsForEvent(eventId) {
    // This table does not exist in the schema, returning mock data.
    return { data: [], error: null };
  },
  async getAvailableSeats(eventId) {
    // This table does not exist in the schema, returning mock data.
    return { data: [], error: null };
  },
  async reserveSeats(seatIds, userId) {
    // This table does not exist in the schema, returning mock data.
    return { data: null, error: 'Not implemented' };
  },
};