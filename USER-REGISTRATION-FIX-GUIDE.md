# 🔧 User Registration Database Error - Complete Fix

## Problem
Users are getting a database error when trying to sign up. This is caused by:
1. Missing or improperly configured `status` column in the `profiles` table
2. Registration trigger not explicitly setting the `status` value
3. Possible constraint violations or missing foreign keys

## Solution

### Quick Fix (Run This Now)
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the contents of `COMPLETE-USER-REGISTRATION-FIX.sql`
4. Click **Run**

### What the Fix Does

#### 1. Ensures Status Column Exists
```sql
ALTER TABLE public.profiles 
ADD COLUMN status TEXT DEFAULT 'active';
```
- Adds the `status` column if missing
- Sets default value to 'active'
- Updates any NULL values to 'active'
- Adds proper constraint check

#### 2. Updates Registration Trigger
The key fix is explicitly setting the `status` field:
```sql
INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone,
    role,
    status  -- ← CRITICAL FIX
) VALUES (
    NEW.id,
    ...,
    ...,
    ...,
    user_role,
    'active'  -- ← Always set to active
);
```

#### 3. Handles All User Roles
- **Parent**: Creates profile + parents table entry
- **Organization**: Creates profile + organization + links them
- **Team Member**: Creates profile + links to organization

#### 4. Improved Error Handling
The trigger now provides specific error messages for:
- Duplicate email (unique violation)
- Invalid organization (foreign key violation)
- Invalid data (check constraint violation)
- Other unexpected errors

## Testing the Fix

### Test 1: Create a Parent Account
1. Go to your signup page
2. Choose "Parent" role
3. Fill in the form:
   - Full Name
   - Email
   - Phone
   - Password
4. Click Sign Up

### Test 2: Create an Organization Account
1. Go to your signup page
2. Choose "Organization" role
3. Fill in the form:
   - Organization Name
   - Full Name
   - Email
   - Phone
   - Password
4. Click Sign Up

### Test 3: Verify in Database
Run this query in Supabase SQL Editor:
```sql
-- Check recent registrations
SELECT 
    id,
    full_name,
    email,
    role,
    status,  -- Should be 'active'
    created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if organizations were created
SELECT 
    o.name,
    o.email,
    o.verification_status,
    p.full_name as owner_name
FROM organizations o
LEFT JOIN profiles p ON o.owner_id = p.id
ORDER BY o.created_at DESC
LIMIT 5;

-- Check if parents were created
SELECT 
    p.id,
    pr.full_name,
    pr.email,
    pa.preferred_language
FROM parents pa
LEFT JOIN profiles pr ON pa.id = pr.id
ORDER BY pa.created_at DESC
LIMIT 5;
```

## Common Issues & Solutions

### Issue: "duplicate key value violates unique constraint"
**Cause**: Email already exists in database  
**Solution**: Use a different email or delete the existing account

### Issue: "null value in column 'role' violates not-null constraint"
**Cause**: Frontend not sending role in metadata  
**Solution**: Check that your signup form is passing the role:
```javascript
await signUp(email, password, {
    fullName: formData.fullName,
    phone: formData.phone,
    role: formData.role,  // ← Must be present
    organizationName: formData.organizationName
});
```

### Issue: "relation 'profiles' does not exist"
**Cause**: Database tables not created  
**Solution**: Run `database-fix-auth-trigger-complete.sql` first

## Rollback (If Needed)
If something goes wrong, you can rollback:
```sql
-- Remove the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Restore previous version (if you have it backed up)
-- Or just re-run the previous SQL script you were using
```

## Monitoring
To see registration attempts and errors:
1. Go to **Supabase Dashboard**
2. Navigate to **Database** > **Logs**
3. Look for messages starting with "Starting registration" or "Registration failed"

## Additional Notes

### Why This Fix Works
- **Explicit Status Setting**: The trigger now explicitly sets `status = 'active'` instead of relying on column defaults
- **Better Error Handling**: Specific error types are caught and logged with helpful messages
- **Proper Transaction Handling**: If any step fails, the entire registration is rolled back

### Safe to Run Multiple Times
This script is idempotent - it's safe to run multiple times:
- Uses `CREATE TABLE IF NOT EXISTS`
- Checks for column existence before adding
- Uses `DROP IF EXISTS` before recreating functions

### Performance
The fix includes proper indexes for:
- Role-based queries
- Organization lookups
- Status filtering
- Team member relationships

## Support
If the issue persists after running this fix:
1. Check Supabase logs for specific error messages
2. Verify all tables exist with correct structure
3. Check that RLS policies allow inserts
4. Ensure your frontend is passing all required data

## Related Files
- `COMPLETE-USER-REGISTRATION-FIX.sql` - Main fix script (run this)
- `EMERGENCY-FIX-USER-REGISTRATION.sql` - Original emergency fix
- `database-fix-auth-trigger-complete.sql` - Complete database setup
- `database-admin-dashboard-complete.sql` - Adds status column
