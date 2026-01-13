import { supabase } from '../lib/supabase';

export const auditService = {
  async logAction({ bookingId, action, oldStatus, newStatus, actorId, actorRole }) {
    const { data, error } = await supabase
      .from('booking_audit_logs_1762280000000')
      .insert([{
        booking_id: bookingId,
        action,
        old_status: oldStatus,
        new_status: newStatus,
        actor_id: actorId,
        actor_role: actorRole
      }]);
    return { data, error };
  },

  async getLogsForBooking(bookingId) {
    const { data, error } = await supabase
      .from('booking_audit_logs_1762280000000')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });
    return { data, error };
  }
};