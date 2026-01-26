-- Notify organization owner + team members when a new booking or rental is created
-- Run in Supabase SQL Editor

-- 1) Ensure notifications table exists (safe no-op if already exists)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2) Expand notifications.type allowed values to include rental notifications
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT c.conname
  INTO v_constraint_name
  FROM pg_constraint c
  WHERE c.conrelid = 'public.notifications'::regclass
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%type%'
    AND pg_get_constraintdef(c.oid) ILIKE '%IN%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.notifications DROP CONSTRAINT %I', v_constraint_name);
  END IF;

  ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (
    type IN (
      'booking_created',
      'booking_confirmed',
      'booking_rejected',
      'booking_cancelled',
      'booking_completed',
      'rental_created'
    )
  );
END $$;

-- 3) Trigger: new service booking -> notify org owner + team
CREATE OR REPLACE FUNCTION public.notify_org_team_on_booking_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT DISTINCT u.user_id,
    'New Booking',
    'A new service booking has been created.',
    'booking_created'
  FROM (
    SELECT o.owner_id AS user_id
    FROM public.organizations o
    WHERE o.id = NEW.org_id

    UNION

    SELECT tm.user_id
    FROM public.team_members tm
    WHERE tm.organization_id = NEW.org_id
  ) u
  WHERE u.user_id IS NOT NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_org_team_on_booking_created ON public.service_bookings;
CREATE TRIGGER trg_notify_org_team_on_booking_created
AFTER INSERT ON public.service_bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_org_team_on_booking_created();

-- 4) Trigger: new equipment rental -> notify org owner + team
CREATE OR REPLACE FUNCTION public.notify_org_team_on_rental_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT e.organization_id
  INTO v_org_id
  FROM public.equipment e
  WHERE e.id = NEW.equipment_id;

  IF v_org_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT DISTINCT u.user_id,
    'New Rental',
    'A new equipment rental has been created.',
    'rental_created'
  FROM (
    SELECT o.owner_id AS user_id
    FROM public.organizations o
    WHERE o.id = v_org_id

    UNION

    SELECT tm.user_id
    FROM public.team_members tm
    WHERE tm.organization_id = v_org_id
  ) u
  WHERE u.user_id IS NOT NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_org_team_on_rental_created ON public.equipment_rentals;
CREATE TRIGGER trg_notify_org_team_on_rental_created
AFTER INSERT ON public.equipment_rentals
FOR EACH ROW
EXECUTE FUNCTION public.notify_org_team_on_rental_created();

-- 5) Permissions
GRANT EXECUTE ON FUNCTION public.notify_org_team_on_booking_created() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_org_team_on_rental_created() TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_org_team_on_booking_created() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_org_team_on_rental_created() TO service_role;

SELECT 'Org/team notification triggers created for new bookings and rentals' AS message;
