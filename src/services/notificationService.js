import { supabase } from '../lib/supabase';

export const notificationService = {
  async createNotification(userId, title, message, type) {
    const { data, error } = await supabase
      .from('notifications_1762280000000')
      .insert([{ user_id: userId, title, message, type }]);
    return { data, error };
  },

  async getMyNotifications() {
    const { data, error } = await supabase
      .from('notifications_1762280000000')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async markAsRead(id) {
    return supabase
      .from('notifications_1762280000000')
      .update({ is_read: true })
      .eq('id', id);
  }
};