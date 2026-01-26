/* 
    # Restore Legacy Booking Columns
    
    1. Problem: 
      - Migration `1765100000000` dropped `child_name` and `child_age`.
      - The `ServiceBookingForm` still sends these fields.
      - This causes a 400 Bad Request (PGRST204) when trying to book.
    
    2. Solution:
      - Restore these columns to ensure the form submissions don't crash the database.
      - Update the RPC functions to include these fields again for UI consistency.
    */

    -- 1. Restore the columns
    ALTER TABLE public.service_bookings 
      ADD COLUMN IF NOT EXISTS "child_name" TEXT,
      ADD COLUMN IF NOT EXISTS "child_age" INTEGER;

    -- 2. Update RPC functions to return these fields
    CREATE OR REPLACE FUNCTION get_organization_bookings(p_org_id UUID) RETURNS TABLE (
      id UUID, org_id UUID, service_id UUID, parent_id UUID, technician_id UUID, 
      booking_date TIMESTAMPTZ, status TEXT, notes TEXT, total_price NUMERIC, 
      platform_fee NUMERIC, payment_status TEXT, parent_first_name TEXT, 
      parent_last_name TEXT, child_name TEXT, child_age INTEGER, 
      vehicle_info TEXT, service_address TEXT, contact_phone TEXT, 
      reminder_sent BOOLEAN, last_reminder_at TIMESTAMPTZ, 
      created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, 
      service JSON, parent JSON, technician JSON
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN
      RETURN QUERY SELECT 
        sb.*,
        json_build_object('id', s.id, 'name', s.name, 'price', s.price) AS service,
        json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email, 'phone', p.phone) AS parent,
        json_build_object('id', tm.id, 'profile', json_build_object('full_name', tp.full_name)) AS technician
      FROM public.service_bookings sb
      LEFT JOIN public.services s ON sb.service_id = s.id
      LEFT JOIN public.profiles p ON sb.parent_id = p.id
      LEFT JOIN public.team_members tm ON sb.technician_id = tm.id
      LEFT JOIN public.profiles tp ON tm.user_id = tp.id
      WHERE sb.org_id = p_org_id
      ORDER BY sb.booking_date DESC;
    END;
    $$;

    CREATE OR REPLACE FUNCTION get_parent_bookings(p_parent_id UUID) RETURNS TABLE (
      id UUID, org_id UUID, service_id UUID, parent_id UUID, technician_id UUID, 
      booking_date TIMESTAMPTZ, status TEXT, notes TEXT, total_price NUMERIC, 
      platform_fee NUMERIC, payment_status TEXT, parent_first_name TEXT, 
      parent_last_name TEXT, child_name TEXT, child_age INTEGER, 
      vehicle_info TEXT, service_address TEXT, contact_phone TEXT, 
      reminder_sent BOOLEAN, last_reminder_at TIMESTAMPTZ, 
      created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ, 
      service JSON, parent JSON, technician JSON
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$
    BEGIN
      RETURN QUERY SELECT 
        sb.*,
        json_build_object('id', s.id, 'name', s.name, 'price', s.price) AS service,
        json_build_object('id', p.id, 'full_name', p.full_name, 'email', p.email, 'phone', p.phone) AS parent,
        json_build_object('id', tm.id, 'profile', json_build_object('full_name', tp.full_name)) AS technician
      FROM public.service_bookings sb
      LEFT JOIN public.services s ON sb.service_id = s.id
      LEFT JOIN public.profiles p ON sb.parent_id = p.id
      LEFT JOIN public.team_members tm ON sb.technician_id = tm.id
      LEFT JOIN public.profiles tp ON tm.user_id = tp.id
      WHERE sb.parent_id = p_parent_id
      ORDER BY sb.booking_date DESC;
    END;
    $$;