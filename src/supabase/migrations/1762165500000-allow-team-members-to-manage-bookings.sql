/*
# Allow Team Members to Manage Bookings

This migration grants team members the necessary permissions to view and update service bookings for their organization.

## 1. Problem
Team members could not see or manage customer bookings. The user interface for team members lacked a bookings section, and the database permissions were not explicitly defined to allow them to manage booking statuses (e.g., approve or complete a booking).

## 2. Solution
This migration introduces a new Row Level Security (RLS) policy on the `service_bookings` table specifically for users with the `team_member` role.

### New Policy:
A new policy named `"Team members can view and update their org bookings"` is created. This policy grants `SELECT` and `UPDATE` permissions on the `service_bookings` table to authenticated users who:
1.  Have the role of `team_member`.
2.  Belong to the organization that owns the booking (`org_id`).

This ensures that team members can view all relevant booking details for their organization and update the status (e.g., from 'pending' to 'confirmed'), while being restricted from deleting or creating new bookings, adhering to the principle of least privilege.

## 3. Security Impact
This change securely expands permissions, allowing team members to perform their required tasks without granting excessive access. They cannot access bookings from other organizations or perform destructive actions.
*/

CREATE POLICY "Team members can view and update their org bookings"
ON public.service_bookings
FOR SELECT, UPDATE
USING (
  get_user_role(auth.uid()) = 'team_member' AND
  org_id = get_user_organization_id(auth.uid())
);