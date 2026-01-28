/* # Add Notifications and Audit Trails 
1. New Tables
  - `notifications_<TIMESTAMP>`: Stores in-app notifications for users.
  - `booking_audit_logs_<TIMESTAMP>`: Stores a history of all actions performed on a booking.
2. Security
  - Enable RLS on both tables.
  - Add policies for users to read their own notifications.
  - Add policies for related users (Parent/Org) to view audit logs.
*/

CREATE TABLE IF NOT EXISTS notifications_1762280000000 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text CHECK (type IN ('booking_created', 'booking_confirmed', 'booking_rejected', 'booking_cancelled', 'booking_completed')),
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_audit_logs_1762280000000 (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.service_bookings(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_status text,
  new_status text,
  actor_id uuid REFERENCES auth.users(id),
  actor_role text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications_1762280000000 ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_audit_logs_1762280000000 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notifications" 
ON notifications_1762280000000 FOR ALL 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Viewable by booking participants" 
ON booking_audit_logs_1762280000000 FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.service_bookings sb
    WHERE sb.id = booking_id 
    AND (sb.parent_id = auth.uid() OR sb.org_id = get_user_organization_id(auth.uid()))
  )
);