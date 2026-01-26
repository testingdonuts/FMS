-- Fix RLS policies for booking_audit_logs and notifications tables
-- Run this in your Supabase SQL Editor

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
DROP POLICY IF EXISTS "Viewable by booking participants" ON booking_audit_logs;
DROP POLICY IF EXISTS "Users can view audit logs for their bookings" ON booking_audit_logs;
DROP POLICY IF EXISTS "Users can insert audit logs for their bookings" ON booking_audit_logs;

-- Fix notifications table policies
CREATE POLICY "Users can view their own notifications" ON notifications
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" ON notifications
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON notifications
FOR DELETE TO authenticated
USING (auth.uid() = user_id);

-- Fix booking_audit_logs table policies
CREATE POLICY "Users can view audit logs for their bookings" ON booking_audit_logs
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.service_bookings sb
        WHERE sb.id = booking_id AND (sb.parent_id = auth.uid() OR sb.org_id = auth.uid())
    )
);

CREATE POLICY "Users can insert audit logs for their bookings" ON booking_audit_logs
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.service_bookings sb
        WHERE sb.id = booking_id AND (sb.parent_id = auth.uid() OR sb.org_id = auth.uid())
    )
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT ON booking_audit_logs TO authenticated;

-- Test the setup
SELECT 'RLS policies for notifications and audit logs updated successfully!' as message;
