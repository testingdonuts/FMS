# Admin Dashboard - Complete Implementation Guide

## 🎯 Overview

The Super Admin Dashboard provides comprehensive platform management capabilities for the FitMySeat platform. This guide covers all features, setup, and usage.

## ✨ Features Implemented

### 1. **Overview Tab**
- **Platform Revenue**: Total fees collected from all transactions
- **Pending Payouts**: Sum of all pending payout requests
- **Organization Applications**: Number of orgs pending verification
- **Total Users**: Count of all registered users
- **Organization Statistics**: Breakdown of verified vs pending organizations
- **Platform Health**: System status monitoring

### 2. **Organizations Tab**
- View all organizations on the platform
- Organization details:
  - Name and owner information
  - Contact email
  - Creation date
  - Verification status (pending/verified/rejected)
- **Verification Workflow**:
  - Review pending applications
  - Add admin notes (internal use)
  - Approve or reject organizations
  - Track verification history

### 3. **Users Tab**
- Comprehensive user listing
- User information display:
  - Full name and email
  - User role (parent/organization/team_member/admin)
  - Associated organization
  - Account status (active/suspended)
- **User Management**:
  - Suspend users with reason
  - Reactivate suspended users
  - View user activity

### 4. **Payouts Tab**
- All payout requests across organizations
- Detailed breakdown:
  - Gross amount
  - Platform fee
  - Net payout amount
  - Request date
  - Current status
- **Payout Actions**:
  - Approve pending requests
  - Reject with reason
  - View processing history

### 5. **Activity Tab**
- Real-time platform activity feed
- Tracks:
  - Organization verifications
  - Payout status changes
  - User account modifications
  - System events
- Shows timestamp and responsible user

## 🛠️ Setup Instructions

### Step 1: Database Setup

Run the SQL migration file to set up all necessary tables and functions:

```bash
# Connect to your Supabase project and run:
psql -h your-supabase-host -U postgres -d postgres -f database-admin-dashboard-complete.sql
```

Or execute through Supabase SQL Editor:
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `database-admin-dashboard-complete.sql`
4. Execute

### Step 2: Create Admin User

To assign admin role to a user, run in Supabase SQL Editor:

```sql
-- Update an existing user to admin
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'your-admin@email.com';
```

### Step 3: Verify Implementation

1. **Check Files**:
   - ✅ `src/components/dashboards/AdminDashboard.jsx` - Main dashboard component
   - ✅ `src/services/adminService.js` - Admin API service
   - ✅ `src/components/DashboardRouter.jsx` - Routing with admin case
   - ✅ `database-admin-dashboard-complete.sql` - Database schema

2. **Test Access**:
   - Log in with admin account
   - Should automatically route to Admin Dashboard
   - All tabs should be accessible

## 📋 Database Schema

### New Tables

#### `payout_requests`
```sql
- id (UUID, Primary Key)
- organization_id (UUID, Foreign Key)
- amount_gross (NUMERIC)
- fee_amount (NUMERIC)
- amount_net (NUMERIC)
- status (TEXT: pending|paid|rejected)
- payout_method (TEXT)
- payout_details (JSONB)
- created_at (TIMESTAMPTZ)
- processed_at (TIMESTAMPTZ)
```

#### `audit_logs`
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key)
- action (TEXT)
- entity_type (TEXT)
- entity_id (UUID)
- details (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMPTZ)
```

### Updated Tables

#### `profiles`
Added columns:
- `status` - User account status (active/suspended)
- `suspension_reason` - Reason for suspension
- `suspended_at` - Timestamp of suspension

#### `organizations`
Added columns:
- `verification_status` - Verification state (pending/verified/rejected)
- `admin_notes` - Internal notes for admins
- `verified_at` - Timestamp of verification
- `verified_by` - Admin who verified

## 🔐 Security

### Row Level Security (RLS)
All admin functions include RLS policies that:
- Verify user has 'admin' role
- Prevent unauthorized access
- Log all administrative actions

### Security Definer Functions
All RPC functions run with elevated privileges but include role checks:
```sql
CREATE FUNCTION get_admin_stats()
SECURITY DEFINER
AS $$
BEGIN
    -- Check if user is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied';
    END IF;
    -- ... rest of function
END;
$$;
```

## 📊 API Functions

### Frontend Service Methods

```javascript
// Get platform statistics
await adminService.getGlobalStats();

// Get all payout requests
await adminService.getAllPayouts();

// Update payout status
await adminService.updatePayoutStatus(payoutId, 'paid');

// Get all organizations
await adminService.getAllOrganizations();

// Update organization verification
await adminService.updateOrgVerification(orgId, 'verified', 'Notes here');

// Get all users
await adminService.getAllUsers(limit, offset);

// Get recent activity
await adminService.getRecentActivity(limit);

// Suspend a user
await adminService.suspendUser(userId, 'Reason for suspension');

// Activate a user
await adminService.activateUser(userId);
```

### Database RPC Functions

```sql
-- Get platform stats
SELECT * FROM get_admin_stats();

-- Get all payouts
SELECT * FROM get_admin_payouts();

-- Get platform metrics (for charts)
SELECT * FROM get_platform_metrics();
```

## 🎨 UI Components

### Stat Cards
Display key metrics with icons and colors:
```jsx
<StatCard 
  icon={FiTrendingUp} 
  label="Platform Revenue" 
  value={`$${revenue}`} 
  color="text-green-600" 
/>
```

### Data Tables
Responsive tables with hover effects and action buttons

### Modal Workflows
Organization review with notes input

### Status Badges
Color-coded status indicators

## 🚀 Usage Examples

### Verify an Organization
1. Navigate to "Organizations" tab
2. Find pending organization
3. Click "Review" button
4. Add admin notes (optional)
5. Click "Verify" or "Reject"

### Approve a Payout
1. Navigate to "Payouts" tab
2. Find pending payout request
3. Review amounts (gross, fee, net)
4. Click green checkmark to approve
5. Click red X to reject

### Suspend a User
1. Navigate to "Users" tab
2. Find user to suspend
3. Click red user icon
4. Enter suspension reason in prompt
5. Confirm action

### View Activity
1. Navigate to "Activity" tab
2. See chronological list of actions
3. View user, timestamp, and details

## 🔧 Customization

### Adding New Stats
Edit `AdminDashboard.jsx` and add to overview:
```jsx
<StatCard 
  icon={YourIcon} 
  label="Your Metric" 
  value={stats.your_metric} 
  color="text-your-color" 
/>
```

### Adding New Admin Actions
1. Add method to `adminService.js`
2. Add handler in `AdminDashboard.jsx`
3. Add UI button/control
4. Create corresponding SQL function if needed

### Customizing Appearance
Modify Tailwind classes in `AdminDashboard.jsx`:
- Colors: `bg-navy`, `text-blue-600`, etc.
- Spacing: `p-6`, `gap-4`, etc.
- Borders: `rounded-3xl`, `border-gray-100`, etc.

## 📈 Performance Considerations

- Tables use indexes on frequently queried columns
- RPC functions are optimized for large datasets
- Pagination implemented for user listing
- Activity logs limited to recent 20 entries by default

## 🐛 Troubleshooting

### Issue: "Access Denied" Error
**Solution**: Verify user has 'admin' role:
```sql
SELECT role FROM profiles WHERE id = 'user-id';
```

### Issue: No Data Showing
**Solution**: Check RLS policies and function permissions:
```sql
SELECT has_table_privilege('authenticated', 'payout_requests', 'SELECT');
```

### Issue: Functions Not Found
**Solution**: Ensure SQL migration ran successfully:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE 'get_admin%';
```

## 📝 Audit Trail

All admin actions are automatically logged:
- Organization verifications
- Payout approvals/rejections
- User suspensions/activations
- Status changes

View in Activity tab or query directly:
```sql
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50;
```

## 🔄 Future Enhancements

Potential additions:
- [ ] Bulk actions (approve multiple payouts)
- [ ] Advanced filtering and search
- [ ] Export data to CSV
- [ ] Email notifications for admin actions
- [ ] Dashboard analytics charts
- [ ] Custom report generation
- [ ] Multi-admin role levels

## 📞 Support

For issues or questions:
1. Check error logs in browser console
2. Review Supabase logs
3. Verify database schema matches migration
4. Check user permissions and RLS policies

## ✅ Checklist for Deployment

Before deploying to production:

- [ ] Run SQL migration on production database
- [ ] Create at least one admin user
- [ ] Test all admin functions
- [ ] Verify RLS policies are active
- [ ] Check audit logging is working
- [ ] Test with non-admin user (should be blocked)
- [ ] Review and set appropriate indexes
- [ ] Configure backup schedules
- [ ] Set up monitoring/alerts

---

**Version**: 1.0.0  
**Last Updated**: January 27, 2026  
**Status**: ✅ Complete & Production Ready
