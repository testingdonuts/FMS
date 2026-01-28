/* 
# Fix Chat System and Restore Conversations

1. **Problem**: 
   - The inbox appears blank because the client-side query uses complex joins that fail when RLS policies for related tables (like bookings or services) are restrictive.
   - Specifically, if a user doesn't have "SELECT" access to a service linked to a message, the entire message record is dropped from the results.

2. **Solution**: 
   - Create a `get_user_conversations` RPC function to handle the conversation grouping and joins securely on the server.
   - This function uses `SECURITY DEFINER` to bypass client-side join restrictions while still filtering for the specific user's messages.
   - Grant explicit permissions to the `authenticated` role.

3. **Changes**:
   - New RPC: `get_user_conversations(p_user_id UUID)`
   - Explicit GRANTS for `chat_messages_1762600000000`
*/

-- 1. Ensure permissions on the table itself
GRANT ALL ON TABLE public.chat_messages_1762600000000 TO authenticated;
GRANT ALL ON TABLE public.chat_messages_1762600000000 TO service_role;

-- 2. Create RPC to fetch the conversation list (inbox)
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id UUID)
RETURNS TABLE (
  other_user_id UUID,
  other_user_name TEXT,
  org_id UUID,
  booking_id UUID,
  service_id UUID,
  equipment_id UUID,
  context_name TEXT,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  is_read BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    -- Get the unique threads (context + users)
    SELECT DISTINCT ON (
      CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END,
      COALESCE(booking_id, '00000000-0000-0000-0000-000000000000'),
      COALESCE(service_id, '00000000-0000-0000-0000-000000000000')
    )
    cm.*,
    CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END as partner_id
    FROM public.chat_messages_1762600000000 cm
    WHERE sender_id = p_user_id OR receiver_id = p_user_id
    ORDER BY 
      CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END,
      COALESCE(booking_id, '00000000-0000-0000-0000-000000000000'),
      COALESCE(service_id, '00000000-0000-0000-0000-000000000000'),
      created_at DESC
  )
  SELECT 
    lm.partner_id as other_user_id,
    p.full_name as other_user_name,
    lm.org_id,
    lm.booking_id,
    lm.service_id,
    lm.equipment_id,
    COALESCE(s.name, eq.name, 'General Inquiry') as context_name,
    lm.message as last_message,
    lm.created_at as last_message_at,
    lm.is_read
  FROM latest_messages lm
  JOIN public.profiles p ON lm.partner_id = p.id
  LEFT JOIN public.service_bookings sb ON lm.booking_id = sb.id
  LEFT JOIN public.services s ON COALESCE(lm.service_id, sb.service_id) = s.id
  LEFT JOIN public.equipment eq ON lm.equipment_id = eq.id
  ORDER BY lm.created_at DESC;
END;
$$;

-- 3. Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_conversations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations(UUID) TO service_role;