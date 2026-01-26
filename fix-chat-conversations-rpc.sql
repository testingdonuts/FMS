-- Fix Chat Conversations RPC Function
-- This updates the get_user_conversations function to properly handle equipment_id threading
-- and ensures it works for all conversation types (general, booking, service, equipment)
-- Run this in your Supabase SQL Editor

-- Drop and recreate the function with the correct threading logic
DROP FUNCTION IF EXISTS public.get_user_conversations(UUID);

CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
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
    SELECT DISTINCT ON (
      CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END,
      COALESCE(cm.booking_id, '00000000-0000-0000-0000-000000000000'),
      COALESCE(cm.service_id, '00000000-0000-0000-0000-000000000000'),
      COALESCE(cm.equipment_id, '00000000-0000-0000-0000-000000000000')
    )
    cm.id,
    cm.sender_id,
    cm.receiver_id,
    cm.org_id,
    cm.message,
    cm.is_read,
    cm.created_at,
    cm.booking_id,
    cm.service_id,
    cm.equipment_id,
    CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END as partner_id
    FROM public.chat_messages cm
    WHERE sender_id = p_user_id OR receiver_id = p_user_id
    ORDER BY
      CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END,
      COALESCE(cm.booking_id, '00000000-0000-0000-0000-000000000000'),
      COALESCE(cm.service_id, '00000000-0000-0000-0000-000000000000'),
      COALESCE(cm.equipment_id, '00000000-0000-0000-0000-000000000000'),
      cm.created_at DESC
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_conversations(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations(UUID) TO service_role;

-- Verify the function was created
SELECT 'get_user_conversations function updated successfully!' AS status;
