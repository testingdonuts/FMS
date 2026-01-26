# Testing the Auth Trigger

## Steps to Test:

1. **Run the Database Setup**
   - Copy and run the `database-fix-auth-trigger-complete.sql` in your Supabase SQL Editor
   - This will create/update all tables and the auth trigger

2. **Test Signup Process**
   - Try signing up with different user roles:
     - **Organization**: Should create profile + organization
     - **Parent**: Should create profile + parent record
     - **Team Member**: Should create profile only

3. **Check Database After Signup**
   ```sql
   -- Check if profile was created
   SELECT * FROM profiles WHERE email = 'your-test-email@example.com';
   
   -- For organization users, check if organization was created
   SELECT * FROM organizations WHERE owner_id = 'user-id-from-above';
   
   -- For parent users, check if parent record was created  
   SELECT * FROM parents WHERE id = 'user-id-from-above';
   ```

4. **Monitor Logs**
   - Check Supabase logs for any trigger errors
   - Look for the LOG messages from the trigger function

## Common Issues:

1. **Trigger Not Firing**: Make sure the trigger exists and is enabled
2. **RLS Blocking**: The policies should allow the trigger to insert data
3. **Missing Data**: Check that user metadata is being passed correctly

## Verification Queries:

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check trigger function
SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user_registration';

-- Check recent user registrations
SELECT 
  au.id,
  au.email,
  au.created_at,
  p.role,
  p.full_name,
  o.name as org_name
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id  
LEFT JOIN organizations o ON au.id = o.owner_id
ORDER BY au.created_at DESC
LIMIT 10;
```