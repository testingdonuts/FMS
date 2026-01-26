-- Team Invite Code Generation Trigger
-- Run this in Supabase SQL Editor to auto-generate invite codes

-- Function to generate a random invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  characters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(characters, floor(random() * length(characters) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Trigger function to set invite_code before insert
CREATE OR REPLACE FUNCTION set_team_invite_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on team_invites table
DROP TRIGGER IF EXISTS trigger_set_invite_code ON team_invites;
CREATE TRIGGER trigger_set_invite_code
  BEFORE INSERT ON team_invites
  FOR EACH ROW
  EXECUTE FUNCTION set_team_invite_code();

-- Verify
SELECT 'Team invite code trigger created successfully!' AS status;
