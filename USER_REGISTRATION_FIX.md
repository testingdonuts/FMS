# 🔧 Fix: Database Error Saving New User

## Problem
After running the admin dashboard SQL script, new user registration fails because the registration trigger doesn't account for the new `status` column in the `profiles` table.

## Solution

### Step 1: Run the Updated Admin Dashboard Script
The `database-admin-dashboard-complete.sql` has been updated to be safe for existing databases:
- Uses existence checks before adding columns
- Adds constraints separately from columns
- Updates existing records with default values

### Step 2: Fix the User Registration Trigger
Run the new script to update the registration trigger:

```bash
# In Supabase SQL Editor, run:
fix-user-registration-for-admin.sql
```

This script:
- Updates the `handle_new_user_registration()` function
- Explicitly sets `status = 'active'` for new users
- Maintains compatibility with all user types (parent, organization, team_member)

### Step 3: Verify the Fix

Test user registration:
1. Try creating a new parent account
2. Try creating a new organization account
3. Check the database:
```sql
SELECT id, email, role, status FROM profiles ORDER BY created_at DESC LIMIT 5;
```

All new users should have `status = 'active'`.

## What Was Fixed

### Before (Broken)
```sql
INSERT INTO profiles (id, full_name, email, phone, role)
VALUES (NEW.id, ..., ..., ..., user_role);
-- ❌ status column not specified, relied on DEFAULT
-- ❌ Could fail if DEFAULT not set properly
```

### After (Fixed)
```sql
INSERT INTO profiles (id, full_name, email, phone, role, status)
VALUES (NEW.id, ..., ..., ..., user_role, 'active');
-- ✅ Explicitly sets status = 'active'
-- ✅ Works reliably every time
```

## Quick Fix (If You Already Ran the Old Script)

If you already ran the admin dashboard script and have broken user registration:

```sql
-- 1. Check if status column exists
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'status';

-- 2. If it exists but DEFAULT is missing, fix it:
ALTER TABLE public.profiles 
ALTER COLUMN status SET DEFAULT 'active';

-- 3. Update existing nulls:
UPDATE public.profiles 
SET status = 'active' 
WHERE status IS NULL;

-- 4. Then run: fix-user-registration-for-admin.sql
```

## Prevention for Future

The updated `database-admin-dashboard-complete.sql` now includes:
- Safer column addition with DO blocks
- Existence checks for all new columns
- Automatic default value updates
- Separate constraint addition

## Files Changed
✅ `database-admin-dashboard-complete.sql` - Made safer  
✅ `fix-user-registration-for-admin.sql` - New trigger fix  
✅ `USER_REGISTRATION_FIX.md` - This guide  

## Test Commands

```sql
-- Test new user creation
SELECT handle_new_user_registration();

-- Check trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- View recent registrations
SELECT p.id, p.email, p.role, p.status, p.created_at
FROM profiles p
ORDER BY p.created_at DESC
LIMIT 10;
```

## Need More Help?

1. Check Supabase logs for specific error messages
2. Verify all tables exist: `profiles`, `organizations`, `parents`, `team_members`
3. Check RLS policies aren't blocking inserts
4. Ensure auth trigger is enabled

---

**Status**: ✅ RESOLVED  
**Date**: January 27, 2026
