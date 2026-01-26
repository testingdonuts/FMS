/* 
# Create Database Webhook for Team Invites
1. Purpose
  - Automatically triggers the 'send-invite' Edge Function whenever a new row is added to `team_invites`.
2. Requirements
  - You must have the Edge Function deployed first.
  - Replace 'YOUR_PROJECT_REF' with your actual Supabase project ID.
*/

-- Note: This SQL usually needs to be run in the Supabase Dashboard SQL Editor
-- as it requires vault/net extension access which is often restricted for standard users.

-- 1. Enable the HTTP extension if not enabled
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA "extensions";

-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION public.on_team_invite_created()
RETURNS TRIGGER AS $$
BEGIN
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

-- 3. Create the trigger
DROP TRIGGER IF EXISTS trigger_send_invite_email ON public.team_invites;
CREATE TRIGGER trigger_send_invite_email
AFTER INSERT ON public.team_invites
FOR EACH ROW
EXECUTE FUNCTION public.on_team_invite_created();