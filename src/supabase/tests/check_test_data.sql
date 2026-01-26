-- Create test data if you don't have any yet
-- Run this in Supabase SQL Editor before running RLS tests

-- Check if you have organizations
select count(*) as org_count from organizations;

-- Check if you have team members
select count(*) as team_member_count from team_members;

-- Check if you have bookings
select count(*) as booking_count from service_bookings;

-- If counts are 0, you'll need to create test data through the UI first:
-- 1. Sign up as an organization owner
-- 2. Add a team member from Organization dashboard
-- 3. Create at least one service booking
-- Then run get_test_ids.sql to get the IDs for testing
