-- Debug team members visibility
-- Run this in Supabase SQL Editor to diagnose RLS issues

-- 1. Check your current user ID
select auth.uid() as current_user_id;

-- 2. Check if you have a profile
select id, email, full_name, organization_id 
from profiles 
where id = auth.uid();

-- 3. Check your organization
select id, name, owner_id 
from organizations 
where id = (select organization_id from profiles where id = auth.uid());

-- 4. Check how many team members exist in your org
select count(*) as total_team_members
from team_members
where organization_id = (select organization_id from profiles where id = auth.uid());

-- 5. Try to select team members (this will be affected by RLS)
select id, user_id, organization_id, role 
from team_members
where organization_id = (select organization_id from profiles where id = auth.uid());

-- 6. Check all team members without RLS (as admin - may not work)
-- Temporarily bypass RLS to see all data:
set role authenticated;
select id, user_id, organization_id, role 
from team_members;

-- 7. Check if your user is a team member
select tm.id, tm.user_id, tm.organization_id, tm.role
from team_members tm
where tm.user_id = auth.uid();
