-- Debug: Check if organization users should see messages in get_user_conversations
-- Run in Supabase SQL Editor to see raw messages and the RPC output
-- Replace :org_owner_user_id with the actual UUID of the organization owner

-- 1) List all chat messages involving this org owner (raw)
SELECT 
  cm.id,
  cm.sender_id,
  cm.receiver_id,
  cm.org_id,
  cm.booking_id,
  cm.service_id,
  cm.equipment_id,
  cm.message,
  cm.created_at,
  p_sender.full_name as sender_name,
  p_receiver.full_name as receiver_name
FROM public.chat_messages cm
JOIN public.profiles p_sender ON cm.sender_id = p_sender.id
JOIN public.profiles p_receiver ON cm.receiver_id = p_receiver.id
WHERE cm.sender_id = :org_owner_user_id OR cm.receiver_id = :org_owner_user_id
ORDER BY cm.created_at DESC;

-- 2) Run the RPC as this user to see what it returns
SELECT * FROM public.get_user_conversations(:org_owner_user_id);

-- 3) Check if org_id is set on messages (should be)
SELECT 
  cm.id,
  cm.org_id,
  cm.sender_id,
  cm.receiver_id,
  cm.message
FROM public.chat_messages cm
WHERE cm.org_id IS NOT NULL
ORDER BY cm.created_at DESC;

-- 4) If org_id is missing, you can backfill it for existing messages (optional)
-- UPDATE public.chat_messages cm
-- SET org_id = sb.org_id
-- FROM public.service_bookings sb
-- WHERE cm.booking_id = sb.id AND cm.org_id IS NULL;
