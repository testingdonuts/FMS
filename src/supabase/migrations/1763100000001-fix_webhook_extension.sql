/* 
# Fix Webhook Extensions
1. Purpose
  - Ensures the `pg_net` extension is enabled so the `net` schema exists.
  - Re-creates the trigger function using the correct extension.
*/

-- 1. Enable the pg_net extension (this creates the 'net' schema)
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- 2. Update the trigger function to use the net schema correctly
CREATE OR REPLACE FUNCTION public.on_team_invite_created()
RETURNS TRIGGER AS $$
BEGIN
  -- We use net.http_post for asynchronous background requests
  PERFORM
    net.http_post(
      url := 'https://csrgvtsfhixzmfmatiak.supabase.co/functions/v1/send-invite',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object('record', row_to_json(NEW))
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure trigger is attached
DROP TRIGGER IF EXISTS trigger_send_invite_email ON public.team_invites;
CREATE TRIGGER trigger_send_invite_email
AFTER INSERT ON public.team_invites
FOR EACH ROW
EXECUTE FUNCTION public.on_team_invite_created();