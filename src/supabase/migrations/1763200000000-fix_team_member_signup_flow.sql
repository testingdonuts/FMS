/* 
# Fix Team Member Signup Flow
1. Purpose
  - Automates team membership creation during signup via database trigger.
  - Resolves RLS "Permission Denied" errors when new members try to join.
  - Automatically marks invitations as 'accepted'.
2. Changes
  - Updates `handle_new_user_registration` function to check for `invite_code` in metadata.
  - Logic: If an invite code exists, create the `team_members` entry and update `team_invites` status.
*/

CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  org_name TEXT;
  invite_org_id UUID;
  new_org_id UUID;
  v_invite_code TEXT;
  v_team_role TEXT;
BEGIN
  -- Extract metadata
  user_role := NEW.raw_user_meta_data->>'role';
  org_name := NEW.raw_user_meta_data->>'organization_name';
  invite_org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
  v_invite_code := NEW.raw_user_meta_data->>'invite_code';
  v_team_role := NEW.raw_user_meta_data->>'team_role';

  -- 1. Insert base profile
  INSERT INTO public.profiles (id, full_name, email, phone, role, organization_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    user_role,
    invite_org_id
  );

  -- 2. Handle Role-Specific Logic
  IF user_role = 'organization' THEN
    -- Create the organization record
    INSERT INTO public.organizations (owner_id, name, email, phone)
    VALUES (
      NEW.id,
      COALESCE(org_name, 'My Organization'),
      NEW.email,
      NEW.raw_user_meta_data->>'phone'
    ) RETURNING id INTO new_org_id;

    -- Update profile with the new org ID
    UPDATE public.profiles SET organization_id = new_org_id WHERE id = NEW.id;

  ELSIF user_role = 'parent' THEN
    INSERT INTO public.parents (id) VALUES (NEW.id);

  ELSIF user_role = 'team_member' AND v_invite_code IS NOT NULL THEN
    -- A. Create Team Member Record (Security Definer context bypasses RLS)
    INSERT INTO public.team_members (organization_id, user_id, role)
    VALUES (invite_org_id, NEW.id, COALESCE(v_team_role, 'technician'));

    -- B. Mark Invite as Accepted
    UPDATE public.team_invites 
    SET status = 'accepted', updated_at = NOW()
    WHERE invite_code = v_invite_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;