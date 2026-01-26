-- Quick RLS checks for team_tasks table
-- 
-- PREREQUISITES: The team_tasks table must exist before running these tests.
-- If you get "relation team_tasks does not exist", apply these migrations first:
--   1. src/supabase/migrations/1769010000000-team_tasks.sql
--   2. src/supabase/migrations/1769011000000-team_tasks_add_types.sql
-- 
-- Quick check - verify table exists:
select exists(select from pg_tables where schemaname = 'public' and tablename = 'team_tasks') as team_tasks_exists;
-- If false, run the migrations above via Supabase CLI or SQL Editor
--
-- Usage: run each block in Supabase SQL Editor. To simulate RLS as a user,
-- set the JWT claims for the session before running queries:
--   select set_config('request.jwt.claims', '{"role":"authenticated","sub":"<USER_UUID>"}', true);
-- Also set current user org via helper if available, else rely on row filters.

-- 1) As organization owner/manager: should be able to select/insert/update/delete within org
-- Replace the values below with real IDs from your environment
select '--- OWNER/MANAGER CAN MANAGE TASKS IN ORG ---' as note;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"<OWNER_USER_ID>"}', true);
select current_setting('request.jwt.claims', true) as jwt_claims;
-- List tasks in org
select id, organization_id, assignee_id, status from team_tasks where organization_id = '<ORG_ID>' limit 5;
-- Try insert
insert into team_tasks (organization_id, assignee_id, title, priority, status, task_type)
values ('<ORG_ID>', '<ASSIGNEE_TEAM_MEMBER_ID>', 'Test owner task', 'medium', 'todo', 'other')
returning id;
-- Try update
update team_tasks set status='in_progress' where id = '<TASK_ID_FROM_INSERT>' returning id, status;
-- Try delete
delete from team_tasks where id = '<TASK_ID_FROM_INSERT>' returning id;

-- 2) As assignee (team member): can select/update their own tasks only
select '--- ASSIGNEE CAN SEE + UPDATE OWN TASKS ONLY ---' as note;
select set_config('request.jwt.claims', '{"role":"authenticated","sub":"<TEAM_MEMBER_USER_ID>"}', true);
select current_setting('request.jwt.claims', true) as jwt_claims;
-- List tasks where assignee is this member
select id, assignee_id, status from team_tasks where assignee_id = '<ASSIGNEE_TEAM_MEMBER_ID>' limit 5;
-- Try update allowed
update team_tasks set status='done' 
where id in (select id from team_tasks where assignee_id = '<ASSIGNEE_TEAM_MEMBER_ID>' limit 1) 
returning id, status;
-- Try update not allowed (another member's task) - should fail or affect 0 rows
update team_tasks set status='done' 
where id in (select id from team_tasks where assignee_id <> '<ASSIGNEE_TEAM_MEMBER_ID>' limit 1)
returning id;

-- 3) Cross-org protections for linked context
select '--- ORG CONTEXT ENFORCEMENT ---' as note;
-- Attempt to insert task with booking/equipment from another org - should fail
insert into team_tasks (organization_id, assignee_id, title, priority, status, task_type, booking_id)
values ('<ORG_ID>', '<ASSIGNEE_TEAM_MEMBER_ID>', 'Cross-org booking test', 'medium', 'todo', 'service_booking', '<BOOKING_ID_OF_OTHER_ORG>');
-- Expect: error from enforce_task_context_org trigger
