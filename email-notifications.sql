-- Email notifications via an outbox table + triggers
-- Run in Supabase SQL Editor
-- Then create a Supabase Database Webhook to call the Edge Function `send-notification-email`
-- on INSERT into `public.email_outbox` (send the inserted record as payload).

-- 1) Outbox table
CREATE TABLE IF NOT EXISTS public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  html text NOT NULL,
  event_type text NOT NULL,
  booking_id uuid,
  rental_id uuid,
  org_id uuid,
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  error text
);

-- 2) Booking created -> email org owner + team
CREATE OR REPLACE FUNCTION public.enqueue_email_on_booking_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_name text;
  v_service_name text;
BEGIN
  SELECT o.name INTO v_org_name FROM public.organizations o WHERE o.id = NEW.org_id;
  SELECT s.name INTO v_service_name FROM public.services s WHERE s.id = NEW.service_id;

  INSERT INTO public.email_outbox (to_email, subject, html, event_type, booking_id, org_id)
  SELECT DISTINCT p.email,
    'New booking received',
    format(
      '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">'
      '<h2 style="color:#0A2540;">New Booking</h2>'
      '<p><strong>Organization:</strong> %s</p>'
      '<p><strong>Service:</strong> %s</p>'
      '<p><strong>Date:</strong> %s</p>'
      '<p><strong>Booking ID:</strong> %s</p>'
      '</div>',
      coalesce(v_org_name, 'Your organization'),
      coalesce(v_service_name, 'Service'),
      to_char(NEW.booking_date, 'Mon DD, YYYY HH12:MI AM'),
      NEW.id
    ),
    'booking_created',
    NEW.id,
    NEW.org_id
  FROM (
    SELECT o.owner_id AS user_id
    FROM public.organizations o
    WHERE o.id = NEW.org_id

    UNION

    SELECT tm.user_id
    FROM public.team_members tm
    WHERE tm.organization_id = NEW.org_id
  ) u
  JOIN public.profiles p ON p.id = u.user_id
  WHERE p.email IS NOT NULL AND p.email <> '';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_email_on_booking_created ON public.service_bookings;
CREATE TRIGGER trg_enqueue_email_on_booking_created
AFTER INSERT ON public.service_bookings
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_email_on_booking_created();

-- 3) Rental created -> email org owner + team
CREATE OR REPLACE FUNCTION public.enqueue_email_on_rental_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
  v_org_name text;
  v_equipment_name text;
BEGIN
  SELECT e.organization_id, e.name
  INTO v_org_id, v_equipment_name
  FROM public.equipment e
  WHERE e.id = NEW.equipment_id;

  IF v_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT o.name INTO v_org_name FROM public.organizations o WHERE o.id = v_org_id;

  INSERT INTO public.email_outbox (to_email, subject, html, event_type, rental_id, org_id)
  SELECT DISTINCT p.email,
    'New equipment rental received',
    format(
      '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">'
      '<h2 style="color:#0A2540;">New Equipment Rental</h2>'
      '<p><strong>Organization:</strong> %s</p>'
      '<p><strong>Equipment:</strong> %s</p>'
      '<p><strong>Dates:</strong> %s to %s</p>'
      '<p><strong>Rental ID:</strong> %s</p>'
      '</div>',
      coalesce(v_org_name, 'Your organization'),
      coalesce(v_equipment_name, 'Equipment'),
      NEW.start_date,
      NEW.end_date,
      NEW.id
    ),
    'rental_created',
    NEW.id,
    v_org_id
  FROM (
    SELECT o.owner_id AS user_id
    FROM public.organizations o
    WHERE o.id = v_org_id

    UNION

    SELECT tm.user_id
    FROM public.team_members tm
    WHERE tm.organization_id = v_org_id
  ) u
  JOIN public.profiles p ON p.id = u.user_id
  WHERE p.email IS NOT NULL AND p.email <> '';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_email_on_rental_created ON public.equipment_rentals;
CREATE TRIGGER trg_enqueue_email_on_rental_created
AFTER INSERT ON public.equipment_rentals
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_email_on_rental_created();

-- 4) Booking confirmed -> email parent
CREATE OR REPLACE FUNCTION public.enqueue_email_on_booking_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parent_email text;
  v_service_name text;
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'confirmed'
     AND (OLD.status IS DISTINCT FROM NEW.status) THEN

    SELECT p.email INTO v_parent_email FROM public.profiles p WHERE p.id = NEW.parent_id;
    SELECT s.name INTO v_service_name FROM public.services s WHERE s.id = NEW.service_id;

    IF v_parent_email IS NOT NULL AND v_parent_email <> '' THEN
      INSERT INTO public.email_outbox (to_email, subject, html, event_type, booking_id, org_id)
      VALUES (
        v_parent_email,
        'Your booking is confirmed',
        format(
          '<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">'
          '<h2 style="color:#0A2540;">Booking Confirmed</h2>'
          '<p>Your booking has been confirmed.</p>'
          '<p><strong>Service:</strong> %s</p>'
          '<p><strong>Date:</strong> %s</p>'
          '<p><strong>Booking ID:</strong> %s</p>'
          '</div>',
          coalesce(v_service_name, 'Service'),
          to_char(NEW.booking_date, 'Mon DD, YYYY HH12:MI AM'),
          NEW.id
        ),
        'booking_confirmed',
        NEW.id,
        NEW.org_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enqueue_email_on_booking_confirmed ON public.service_bookings;
CREATE TRIGGER trg_enqueue_email_on_booking_confirmed
AFTER UPDATE OF status ON public.service_bookings
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_email_on_booking_confirmed();

-- 5) Permissions
GRANT EXECUTE ON FUNCTION public.enqueue_email_on_booking_created() TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email_on_rental_created() TO authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email_on_booking_confirmed() TO authenticated;

GRANT EXECUTE ON FUNCTION public.enqueue_email_on_booking_created() TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email_on_rental_created() TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email_on_booking_confirmed() TO service_role;

SELECT 'Email outbox + triggers created (booking_created, rental_created, booking_confirmed)' AS message;
