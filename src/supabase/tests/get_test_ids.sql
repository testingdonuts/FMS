-- Run this in Supabase SQL Editor to get the IDs needed for RLS tests
-- Copy the results and use them to replace placeholders in test_team_tasks_rls.sql

-- 1. Get an organization and its owner
select 
  o.id as org_id,
  o.name as org_name,
  o.owner_id as owner_user_id,
  u.email as owner_email
from organizations o
join auth.users u on u.id = o.owner_id
limit 1;

-- 2. Get a team member from that organization
select 
  tm.id as team_member_id,
  tm.user_id as team_member_user_id,
  tm.organization_id,
  u.email as member_email,
  tm.role as member_role
from team_members tm
join auth.users u on u.id = tm.user_id
limit 1;

-- 3. Get a booking ID (for testing context enforcement)
select 
  id as booking_id,
  organization_id,
  status
from service_bookings
limit 1;

-- 4. Get a booking from a DIFFERENT organization (for cross-org test)
select 
  sb.id as other_org_booking_id,
  sb.organization_id as other_org_id
from service_bookings sb
where sb.organization_id != (select id from organizations limit 1)
limit 1;
