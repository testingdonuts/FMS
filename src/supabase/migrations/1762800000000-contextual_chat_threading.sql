/* 
# Contextual Chat Threading
1. Changes
  - Add `booking_id` (uuid) to `chat_messages_1762600000000`
  - Add `service_id` (uuid) to `chat_messages_1762600000000`
  - Add `equipment_id` (uuid) to `chat_messages_1762600000000`
2. Rationale
  - Enables "Thread per Booking/Service" as per the messaging flow requirement.
  - Allows users to know exactly what a conversation is about.
*/

ALTER TABLE public.chat_messages_1762600000000 
ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.service_bookings(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS equipment_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL;

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_chat_booking ON public.chat_messages_1762600000000(booking_id);
CREATE INDEX IF NOT EXISTS idx_chat_service ON public.chat_messages_1762600000000(service_id);