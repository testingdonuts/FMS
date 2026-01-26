-- Create parent notification when organization confirms a service booking
-- Run this in Supabase SQL Editor

-- 1) Ensure notifications table exists (safe no-op if already created)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('booking_created', 'booking_confirmed', 'booking_rejected', 'booking_cancelled', 'booking_completed')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2) Trigger function
CREATE OR REPLACE FUNCTION public.notify_parent_on_booking_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only fire when status transitions to confirmed
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'confirmed'
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN

    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      NEW.parent_id,
      'Booking Confirmed',
      'Your booking has been confirmed.',
      'booking_confirmed'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 3) Trigger
DROP TRIGGER IF EXISTS trg_notify_parent_on_booking_confirmed ON public.service_bookings;
CREATE TRIGGER trg_notify_parent_on_booking_confirmed
AFTER UPDATE OF status ON public.service_bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_parent_on_booking_confirmed();

-- 4) Permissions (notifications table uses RLS; trigger runs as definer)
GRANT EXECUTE ON FUNCTION public.notify_parent_on_booking_confirmed() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_parent_on_booking_confirmed() TO service_role;

SELECT 'Notification trigger created: parent notified on booking confirmation' AS message;
