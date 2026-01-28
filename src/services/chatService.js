import { supabase } from '../lib/supabase';

export const chatService = {
  async sendMessage(senderId, receiverId, orgId, message, context = {}) {
    const { data, error } = await supabase
      .from('chat_messages_1762600000000')
      .insert([{
        sender_id: senderId,
        receiver_id: receiverId,
        org_id: orgId, // Fixed: variable name matches argument (orgId)
        message: message,
        booking_id: context.bookingId || null,
        service_id: context.serviceId || null,
        equipment_id: context.equipmentId || null
      }])
      .select()
      .single();

    if (error) console.error("Error sending message:", error);
    return { data, error: error?.message };
  },

  async getMessages(userId, otherUserId, context = {}) {
    let query = supabase
      .from('chat_messages_1762600000000')
      .select(`
        *,
        sender:profiles!sender_id(full_name),
        receiver:profiles!receiver_id(full_name)
      `)
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`);

    // Filter by context if provided for threading
    if (context.bookingId) query = query.eq('booking_id', context.bookingId);
    else if (context.serviceId) query = query.eq('service_id', context.serviceId);
    else if (context.equipmentId) query = query.eq('equipment_id', context.equipmentId);

    const { data, error } = await query.order('created_at', { ascending: true });
    return { data, error: error?.message };
  },

  async getConversations(userId) {
    // Calling the new RPC to handle complex joins securely
    const { data, error } = await supabase.rpc('get_user_conversations', {
      p_user_id: userId
    });

    if (error) {
      console.error("Error fetching conversations via RPC:", error);
      return { data: [], error: error.message };
    }

    // Map the RPC response to the format expected by the UI
    const formattedConversations = (data || []).map(conv => ({
      otherUser: {
        id: conv.other_user_id,
        full_name: conv.other_user_name
      },
      orgId: conv.org_id,
      bookingId: conv.booking_id,
      serviceId: conv.service_id,
      equipmentId: conv.equipment_id,
      contextName: conv.context_name,
      lastMessage: conv.last_message,
      timestamp: conv.last_message_at,
      isRead: conv.is_read
    }));

    return { data: formattedConversations, error: null };
  },

  subscribeToMessages(userId, callback) {
    return supabase
      .channel(`chat_user_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages_1762600000000',
          filter: `receiver_id=eq.${userId}`
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  }
};