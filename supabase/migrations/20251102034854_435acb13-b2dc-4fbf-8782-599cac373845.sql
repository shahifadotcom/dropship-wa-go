-- Create social_links table for managing social media accounts
CREATE TABLE IF NOT EXISTS public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read active social links
CREATE POLICY "Anyone can view active social links"
  ON public.social_links
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage social links
CREATE POLICY "Admins can manage social links"
  ON public.social_links
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Insert default social links
INSERT INTO public.social_links (name, platform, url, display_order) VALUES
  ('Facebook', 'facebook', 'https://facebook.com/yourstore', 1),
  ('Instagram', 'instagram', 'https://instagram.com/yourstore', 2),
  ('Twitter', 'twitter', 'https://twitter.com/yourstore', 3),
  ('YouTube', 'youtube', 'https://youtube.com/yourstore', 4),
  ('TikTok', 'tiktok', 'https://tiktok.com/@yourstore', 5);