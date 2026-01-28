-- ================================================================
-- ADMIN FEATURES: Analytics, Settings, Tickets, Announcements
-- ================================================================

-- 1) Platform Settings Table
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings
INSERT INTO public.platform_settings (key, value, description, category) VALUES
  ('platform_fee_percentage', '10', 'Platform fee percentage on bookings', 'fees'),
  ('minimum_payout_amount', '50', 'Minimum amount for payout requests', 'fees'),
  ('max_booking_days_ahead', '90', 'Maximum days in advance for bookings', 'bookings'),
  ('require_org_verification', 'true', 'Require organization verification before listings', 'organizations'),
  ('allow_instant_booking', 'true', 'Allow instant booking without confirmation', 'bookings'),
  ('support_email', '"support@fitmyseat.com"', 'Support contact email', 'contact'),
  ('maintenance_mode', 'false', 'Enable maintenance mode', 'system')
ON CONFLICT (key) DO NOTHING;

-- 2) Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'billing', 'technical', 'booking', 'organization', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_response', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON public.support_tickets(priority);

-- 3) Ticket Responses Table
CREATE TABLE IF NOT EXISTS public.ticket_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_admin_response BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_responses_ticket ON public.ticket_responses(ticket_id);

-- 4) Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'parents', 'organizations', 'team_members')),
  is_active BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_dates ON public.announcements(starts_at, expires_at);

-- 5) Email Logs Table (for tracking sent emails)
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT,
  email_type TEXT DEFAULT 'general',
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_by UUID REFERENCES public.profiles(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs(status);

-- 6) Blog Posts Table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  featured_image TEXT,
  author_name TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id),
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  meta_title TEXT,
  meta_description TEXT,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(is_published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON public.blog_posts(is_featured);

-- Insert sample blog posts
INSERT INTO public.blog_posts (title, slug, excerpt, content, category, featured_image, author_name, is_published, published_at) VALUES
  ('The Ultimate Guide to Choosing the Right Car Seat', 
   'ultimate-guide-choosing-right-car-seat',
   'Navigating the world of car seats can be overwhelming. This guide breaks down the types, features, and key considerations to help you make the best choice for your child.',
   'Navigating the world of car seats can be overwhelming. This guide breaks down the types, features, and key considerations to help you make the best choice for your child.\n\n## Types of Car Seats\n\n### Infant Car Seats\nDesigned for newborns and infants, these rear-facing seats typically accommodate babies from 4-35 pounds.\n\n### Convertible Car Seats\nThese versatile seats can be used rear-facing for infants and then converted to forward-facing as your child grows.\n\n### Booster Seats\nFor older children who have outgrown their forward-facing seat but are not yet ready for a regular seatbelt.\n\n## Key Features to Consider\n\n1. **Safety Ratings** - Always check NHTSA ratings\n2. **Ease of Installation** - LATCH system compatibility\n3. **Comfort Features** - Padding, recline options\n4. **Growth Capacity** - Weight and height limits',
   'Safety Guides',
   'https://images.unsplash.com/photo-1556912173-356c5a6a1e6d?fit=crop&w=600&h=400&q=80',
   'Dr. Emily Carter',
   true, now()),
  ('Common Car Seat Installation Mistakes and How to Avoid Them',
   'common-car-seat-installation-mistakes',
   'A certified CPST highlights the top 5 installation errors parents make and provides step-by-step instructions to ensure your child''s seat is secure.',
   'A certified CPST highlights the top 5 installation errors parents make and provides step-by-step instructions to ensure your child''s seat is secure.\n\n## Mistake #1: Loose Installation\n\nThe car seat should not move more than 1 inch side-to-side or front-to-back at the belt path.\n\n## Mistake #2: Wrong Recline Angle\n\nInfant seats need proper recline to keep airways open.\n\n## Mistake #3: Twisted Straps\n\nHarness straps should lay flat against your child.\n\n## Mistake #4: Using Both LATCH and Seatbelt\n\nUnless specified by the manufacturer, use one or the other.\n\n## Mistake #5: Expired Car Seats\n\nCheck the expiration date - car seats typically expire after 6-10 years.',
   'Installation Tips',
   'https://images.unsplash.com/photo-1604375484649-f4d642a8e2a3?fit=crop&w=600&h=400&q=80',
   'John Abe',
   true, now()),
  ('When to Transition: Moving from Infant to Convertible Seat',
   'when-to-transition-infant-convertible-seat',
   'Is your little one ready for the next step? We cover the height, weight, and developmental signs to look for when transitioning to a larger car seat.',
   'Is your little one ready for the next step? We cover the height, weight, and developmental signs to look for when transitioning to a larger car seat.\n\n## Signs It''s Time to Transition\n\n1. **Weight Limit Reached** - Check your seat''s maximum weight\n2. **Height Limit** - Head should be 1 inch below the top of the seat\n3. **Age Guidelines** - AAP recommends rear-facing until age 2+\n\n## Making the Transition\n\n- Continue rear-facing as long as possible\n- Ensure proper harness height adjustment\n- Practice installation before the big day',
   'Milestones',
   'https://images.unsplash.com/photo-1599493356248-3ed9a656d053?fit=crop&w=600&h=400&q=80',
   'Sarah Chen',
   true, now()),
  ('Traveling with Kids: A Parent''s Guide to Car Seat Rentals',
   'traveling-kids-car-seat-rentals-guide',
   'Learn the benefits of renting car seats for travel, what to look for in a rental service, and how to ensure safety on the go.',
   'Learn the benefits of renting car seats for travel, what to look for in a rental service, and how to ensure safety on the go.\n\n## Why Rent a Car Seat?\n\n- **Convenience** - No need to lug your seat through airports\n- **Condition** - Professional services maintain seats properly\n- **Flexibility** - Get the right seat for rental vehicle size\n\n## What to Look For\n\n1. Clean, well-maintained equipment\n2. Proper installation assistance\n3. Current safety certifications\n4. Flexibility in pickup/delivery\n\n## FitMySeat Advantage\n\nOur certified professionals ensure every rental meets the highest safety standards.',
   'Travel',
   'https://images.unsplash.com/photo-1502781252691-227b38a70505?fit=crop&w=600&h=400&q=80',
   'David Lee',
   true, now())
ON CONFLICT (slug) DO NOTHING;

-- 6) Revenue Analytics RPC Function
CREATE OR REPLACE FUNCTION public.get_revenue_analytics(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  total_bookings BIGINT,
  total_revenue NUMERIC,
  total_fees NUMERIC,
  new_users BIGINT,
  new_organizations BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - (days_back || ' days')::interval,
      CURRENT_DATE,
      '1 day'::interval
    )::date AS date
  ),
  booking_stats AS (
    SELECT 
      DATE(created_at) as booking_date,
      COUNT(*) as bookings,
      COALESCE(SUM(total_price), 0) as revenue
    FROM public.service_bookings
    WHERE created_at >= CURRENT_DATE - (days_back || ' days')::interval
    GROUP BY DATE(created_at)
  ),
  payout_stats AS (
    SELECT 
      DATE(created_at) as payout_date,
      COALESCE(SUM(fee_amount), 0) as fees
    FROM public.payout_requests
    WHERE status = 'paid' AND created_at >= CURRENT_DATE - (days_back || ' days')::interval
    GROUP BY DATE(created_at)
  ),
  user_stats AS (
    SELECT 
      DATE(created_at) as user_date,
      COUNT(*) as new_users
    FROM public.profiles
    WHERE created_at >= CURRENT_DATE - (days_back || ' days')::interval
    GROUP BY DATE(created_at)
  ),
  org_stats AS (
    SELECT 
      DATE(created_at) as org_date,
      COUNT(*) as new_orgs
    FROM public.organizations
    WHERE created_at >= CURRENT_DATE - (days_back || ' days')::interval
    GROUP BY DATE(created_at)
  )
  SELECT 
    ds.date,
    COALESCE(bs.bookings, 0) as total_bookings,
    COALESCE(bs.revenue, 0) as total_revenue,
    COALESCE(ps.fees, 0) as total_fees,
    COALESCE(us.new_users, 0) as new_users,
    COALESCE(os.new_orgs, 0) as new_organizations
  FROM date_series ds
  LEFT JOIN booking_stats bs ON ds.date = bs.booking_date
  LEFT JOIN payout_stats ps ON ds.date = ps.payout_date
  LEFT JOIN user_stats us ON ds.date = us.user_date
  LEFT JOIN org_stats os ON ds.date = os.org_date
  ORDER BY ds.date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7) Get platform settings function
CREATE OR REPLACE FUNCTION public.get_platform_settings()
RETURNS TABLE (
  key TEXT,
  value JSONB,
  description TEXT,
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT ps.key, ps.value, ps.description, ps.category
  FROM public.platform_settings ps
  ORDER BY ps.category, ps.key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8) Update platform setting function
CREATE OR REPLACE FUNCTION public.update_platform_setting(
  setting_key TEXT,
  setting_value JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.platform_settings
  SET value = setting_value, updated_at = now(), updated_by = auth.uid()
  WHERE key = setting_key;
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9) Get ticket stats function
CREATE OR REPLACE FUNCTION public.get_ticket_stats()
RETURNS TABLE (
  open_tickets BIGINT,
  in_progress_tickets BIGINT,
  resolved_today BIGINT,
  avg_resolution_hours NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.support_tickets WHERE status = 'open') as open_tickets,
    (SELECT COUNT(*) FROM public.support_tickets WHERE status = 'in_progress') as in_progress_tickets,
    (SELECT COUNT(*) FROM public.support_tickets WHERE status = 'resolved' AND DATE(resolved_at) = CURRENT_DATE) as resolved_today,
    COALESCE(
      (SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) 
       FROM public.support_tickets 
       WHERE resolved_at IS NOT NULL),
      0
    ) as avg_resolution_hours;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10) Enable RLS on new tables
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 11) RLS Policies
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "admins_manage_settings" ON public.platform_settings;
DROP POLICY IF EXISTS "users_view_own_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "users_create_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "admins_manage_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "users_view_own_responses" ON public.ticket_responses;
DROP POLICY IF EXISTS "users_add_responses" ON public.ticket_responses;
DROP POLICY IF EXISTS "admins_manage_responses" ON public.ticket_responses;
DROP POLICY IF EXISTS "public_view_announcements" ON public.announcements;
DROP POLICY IF EXISTS "admins_manage_announcements" ON public.announcements;
DROP POLICY IF EXISTS "admins_view_email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "public_view_published_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "admins_manage_blog_posts" ON public.blog_posts;

-- Platform Settings: Only admins can view/edit
CREATE POLICY "admins_manage_settings" ON public.platform_settings
  FOR ALL USING (public.is_admin());

-- Support Tickets: Users can view their own, admins can view all
CREATE POLICY "users_view_own_tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_create_tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins_manage_tickets" ON public.support_tickets
  FOR ALL USING (public.is_admin());

-- Ticket Responses: Users can view responses on their tickets, admins can view all
CREATE POLICY "users_view_own_responses" ON public.ticket_responses
  FOR SELECT USING (
    ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid())
  );

CREATE POLICY "users_add_responses" ON public.ticket_responses
  FOR INSERT WITH CHECK (
    ticket_id IN (SELECT id FROM public.support_tickets WHERE user_id = auth.uid())
  );

CREATE POLICY "admins_manage_responses" ON public.ticket_responses
  FOR ALL USING (public.is_admin());

-- Announcements: Everyone can view active announcements, admins can manage
CREATE POLICY "public_view_announcements" ON public.announcements
  FOR SELECT USING (is_active = true AND starts_at <= now() AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "admins_manage_announcements" ON public.announcements
  FOR ALL USING (public.is_admin());

-- Email Logs: Only admins can view
CREATE POLICY "admins_view_email_logs" ON public.email_logs
  FOR ALL USING (public.is_admin());

-- Blog Posts: Public can view published, admins can manage all
CREATE POLICY "public_view_published_posts" ON public.blog_posts
  FOR SELECT USING (is_published = true);

CREATE POLICY "admins_manage_blog_posts" ON public.blog_posts
  FOR ALL USING (public.is_admin());

-- 12) Grant permissions
GRANT ALL ON public.platform_settings TO authenticated;
GRANT ALL ON public.support_tickets TO authenticated;
GRANT ALL ON public.ticket_responses TO authenticated;
GRANT ALL ON public.announcements TO authenticated;
GRANT ALL ON public.email_logs TO authenticated;
GRANT ALL ON public.blog_posts TO authenticated;
GRANT SELECT ON public.blog_posts TO anon;

-- 13) Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow authenticated users to upload to blog-images folder
DROP POLICY IF EXISTS "Allow authenticated uploads to blog-images" ON storage.objects;
CREATE POLICY "Allow authenticated uploads to blog-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'public-assets' AND (storage.foldername(name))[1] = 'blog-images');

-- Storage policy: Allow public read access
DROP POLICY IF EXISTS "Allow public read access to public-assets" ON storage.objects;
CREATE POLICY "Allow public read access to public-assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'public-assets');

-- Storage policy: Allow admins to delete blog images
DROP POLICY IF EXISTS "Allow admins to delete blog images" ON storage.objects;
CREATE POLICY "Allow admins to delete blog images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'public-assets' AND public.is_admin());

SELECT '✅ Admin features tables created!' as status;
