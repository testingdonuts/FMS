# Signup Data Routing Guide

This document explains how user data is properly routed to the correct tables during signup for the FitMySeat platform.

## Overview

The signup process ensures that user information is saved to the appropriate tables based on their role:
- **Organizations**: `profiles` + `organizations` tables
- **Parents**: `profiles` + `parents` tables  
- **Team Members**: `profiles` + `team_members` tables (via invitation)

## Database Schema

### Core Tables

1. **profiles** - Core user information for all users
2. **organizations** - Organization-specific data
3. **parents** - Parent-specific data
4. **team_members** - Links team members to organizations
5. **team_invites** - Handles team member invitations

## Signup Flow by User Type

### 1. Organization Owner Signup

**Flow:**
1. User fills signup form with role = 'organization'
2. `authService.signUp()` is called
3. Supabase creates auth user
4. `handle_new_user_registration()` trigger fires
5. Creates record in `profiles` table
6. Creates record in `organizations` table
7. Updates `profiles.organization_id` with new org ID

**Required Fields:**
- Email
- Password
- Full Name
- Organization Name
- Phone (optional)

**Tables Updated:**
```sql
-- profiles table
INSERT INTO profiles (id, role, full_name, email, phone, organization_id)

-- organizations table  
INSERT INTO organizations (owner_id, name, email, phone)
```

### 2. Parent Signup

**Flow:**
1. User fills signup form with role = 'parent'
2. `authService.signUp()` is called
3. Supabase creates auth user
4. `handle_new_user_registration()` trigger fires
5. Creates record in `profiles` table
6. Creates record in `parents` table

**Required Fields:**
- Email
- Password
- Full Name
- Phone (optional)

**Tables Updated:**
```sql
-- profiles table
INSERT INTO profiles (id, role, full_name, email, phone)

-- parents table
INSERT INTO parents (id)
```

### 3. Team Member Signup (via invitation)

**Flow:**
1. Organization owner sends invitation via `teamService.sendTeamInvitation()`
2. Invitation record created in `team_invites` table
3. Team member receives invitation link
4. Team member completes signup via invitation acceptance
5. `teamService.acceptInvitation()` creates auth user
6. `handle_new_user_registration()` trigger creates profile
7. Manual insertion into `team_members` table links to organization

**Required Fields:**
- Invitation code
- Password
- Full Name
- Phone (optional)

**Tables Updated:**
```sql
-- profiles table
INSERT INTO profiles (id, role, full_name, email, phone)

-- team_members table
INSERT INTO team_members (organization_id, user_id, role)

-- team_invites table (status update)
UPDATE team_invites SET status = 'accepted'
```

## Database Trigger Function

The `handle_new_user_registration()` function handles the automatic data routing:

```sql
CREATE OR REPLACE FUNCTION handle_new_user_registration()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    org_name TEXT;
    new_org_id UUID;
BEGIN
    -- Get user metadata
    user_role := NEW.raw_user_meta_data->>'role';
    org_name := NEW.raw_user_meta_data->>'organization_name';
    
    -- Always create a profile first
    INSERT INTO profiles (
        id, full_name, email, phone, role
    ) VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        user_role
    );
    
    -- Handle organization users
    IF user_role = 'organization' THEN
        -- Create organization and link to profile
        INSERT INTO organizations (owner_id, name, email, phone) 
        VALUES (NEW.id, COALESCE(org_name, 'My Organization'), NEW.email, NEW.raw_user_meta_data->>'phone') 
        RETURNING id INTO new_org_id;
        
        UPDATE profiles SET organization_id = new_org_id WHERE id = NEW.id;
        
    -- Handle parent users  
    ELSIF user_role = 'parent' THEN
        INSERT INTO parents (id) VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Verification Process

After signup, the system verifies data was routed correctly:

```javascript
// In authService.js
async verifyUserCreation(userId, expectedRole) {
  // Check profile was created
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  // Check role-specific table
  if (expectedRole === 'organization') {
    const { data: org } = await supabase
      .from('organizations')  
      .select('*')
      .eq('owner_id', userId)
      .single();
  } else if (expectedRole === 'parent') {
    const { data: parent } = await supabase
      .from('parents')
      .select('*') 
      .eq('id', userId)
      .single();
  }
}
```

## Row Level Security (RLS)

Each table has appropriate RLS policies:

```sql
-- Profiles: Users can only access their own data
CREATE POLICY "profiles_own_data" ON profiles 
FOR ALL USING (auth.uid() = id);

-- Organizations: Owners can manage their organizations
CREATE POLICY "orgs_owners_manage" ON organizations 
FOR ALL USING (auth.uid() = owner_id);

-- Parents: Users can only access their own parent record
CREATE POLICY "parents_own_data" ON parents 
FOR ALL USING (auth.uid() = id);
```

## Troubleshooting

### Common Issues

1. **User created but no profile**: Check trigger function is enabled
2. **Organization not created**: Verify organization_name is provided
3. **Team member not linked**: Check invitation flow and team_members insertion
4. **RLS blocking access**: Verify user permissions and policies

### Debugging Steps

1. Check auth.users table for user creation
2. Verify profiles table has matching record
3. Check role-specific table has corresponding record
4. Review Supabase logs for trigger errors
5. Test RLS policies with different user contexts

## Best Practices

1. **Always validate required fields** before calling signup
2. **Use transactions** for multi-table operations where possible
3. **Implement proper error handling** in trigger functions
4. **Test signup flow** for each user type regularly
5. **Monitor trigger performance** and optimize as needed
6. **Keep RLS policies simple** to avoid recursion issues
7. **Use consistent naming** across all tables and relationships

## Testing Checklist

- [ ] Organization signup creates profile + organization
- [ ] Parent signup creates profile + parent record  
- [ ] Team invitation flow works end-to-end
- [ ] RLS policies prevent unauthorized access
- [ ] Trigger function handles errors gracefully
- [ ] All foreign key relationships work correctly
- [ ] Data verification confirms correct routing