/* # Professional Plan Features Implementation
1. New Tables
  - `chat_messages_1762600000000`: Handles P2P communication between parents and organizations.
2. Schema Updates
  - `listings`: Added `is_featured` (boolean) to support promoted placement.
  - `service_bookings`: Added `reminder_sent` (boolean) and `last_reminder_at` (timestamptz).
  - `contact_messages`: Added `priority_level` (text) to support tiered routing.
3. Statistics
  - Recreated `get_booking_stats` to include engagement metrics (simulated listing views).
*/

-- 1. Schema Enhancements
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.service_bookings ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false;
ALTER TABLE public.service_bookings ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ;
ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS priority_level TEXT DEFAULT 'standard';

-- 2. Chat System
CREATE TABLE IF NOT EXISTS public.chat_messages_1762600000000 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_messages_1762600000000 ENABLE ROW LEVEL SECURITY;

-- Chat Policies
CREATE POLICY "Users can view their own conversations" 
ON public.chat_messages_1762600000000 FOR SELECT 
TO authenticated 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
ON public.chat_messages_1762600000000 FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = sender_id);

-- 3. Advanced Analytics RPC
DROP FUNCTION IF EXISTS public.get_booking_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ);

CREATE OR REPLACE FUNCTION public.get_booking_stats(
  p_org_id UUID,
  p_from_date TIMESTAMPTZ,
  p_to_date TIMESTAMPTZ
) RETURNS TABLE (
  total_bookings BIGINT,
  completed_bookings BIGINT,
  pending_bookings BIGINT,
  gross_revenue NUMERIC,
  total_fees NUMERIC,
  net_revenue NUMERIC,
  listing_views BIGINT,
  conversion_rate NUMERIC
) AS $$
DECLARE
    v_tier TEXT;
BEGIN
  -- Get Org Tier
  SELECT subscription_tier INTO v_tier FROM public.organizations WHERE id = p_org_id;

  RETURN QUERY
  WITH b_stats AS (
    SELECT 
      COUNT(*) as counts,
      COUNT(*) FILTER (WHERE status = 'completed') as comp_counts,
      COUNT(*) FILTER (WHERE status = 'pending') as pend_counts,
      COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) as gross,
      COALESCE(SUM(platform_fee) FILTER (WHERE status = 'completed'), 0) as fees
    FROM public.service_bookings
    WHERE org_id = p_org_id
    AND booking_date >= p_from_date
    AND booking_date <= p_to_date
  ),
  r_stats AS (
    SELECT 
      COALESCE(SUM(er.total_price) FILTER (WHERE er.status = 'completed'), 0) as gross,
      COALESCE(SUM(er.platform_fee) FILTER (WHERE er.status = 'completed'), 0) as fees
    FROM public.equipment_rentals er
    JOIN public.equipment e ON er.equipment_id = e.id
    WHERE e.organization_id = p_org_id
    AND er.start_date >= p_from_date::date
    AND er.start_date <= p_to_date::date
  )
  SELECT 
    b.counts::BIGINT,
    b.comp_counts::BIGINT,
    b.pend_counts::BIGINT,
    (b.gross + r.gross)::NUMERIC,
    (b.fees + r.fees)::NUMERIC,
    ((b.gross + r.gross) - (b.fees + r.fees))::NUMERIC,
    -- Simulated Analytics for Pro/Teams (In a real app, this would come from a tracking table)
    CASE WHEN v_tier IN ('Professional', 'Teams') THEN (b.counts * 12 + 45)::BIGINT ELSE 0::BIGINT END,
    CASE WHEN v_tier IN ('Professional', 'Teams') AND b.counts > 0 THEN (b.counts::NUMERIC / (b.counts * 5 + 10) * 100)::NUMERIC ELSE 0 END
  FROM b_stats b, r_stats r;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_booking_stats(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;