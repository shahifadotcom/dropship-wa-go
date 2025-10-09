-- AI Ads Management System Tables

-- Ad platforms configuration
CREATE TABLE IF NOT EXISTS public.ad_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'tiktok', 'google_ads')),
  is_active BOOLEAN DEFAULT false,
  access_token TEXT,
  refresh_token TEXT,
  ad_account_id TEXT,
  pixel_id TEXT,
  business_id TEXT,
  credentials JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI-managed ad campaigns
CREATE TABLE IF NOT EXISTS public.ai_ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_id TEXT, -- Platform campaign ID
  objective TEXT NOT NULL, -- conversions, traffic, awareness
  budget_daily NUMERIC,
  budget_total NUMERIC,
  target_audience JSONB,
  ad_creative JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  performance_metrics JSONB DEFAULT '{}'::jsonb,
  ai_insights JSONB DEFAULT '{}'::jsonb,
  created_by_ai BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Pixel tracking events
CREATE TABLE IF NOT EXISTS public.tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL, -- PageView, ViewContent, AddToCart, Purchase, etc.
  user_id UUID,
  session_id TEXT,
  event_data JSONB DEFAULT '{}'::jsonb,
  product_id UUID,
  order_id UUID,
  value NUMERIC,
  currency TEXT DEFAULT 'USD',
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,
  platform_sent JSONB DEFAULT '[]'::jsonb, -- Track which platforms received the event
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI audience insights
CREATE TABLE IF NOT EXISTS public.ai_audience_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL, -- demographics, interests, behaviors
  audience_data JSONB NOT NULL,
  conversion_rate NUMERIC,
  avg_order_value NUMERIC,
  products_interested JSONB DEFAULT '[]'::jsonb,
  ai_recommendations JSONB DEFAULT '{}'::jsonb,
  last_analyzed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI campaign optimization logs
CREATE TABLE IF NOT EXISTS public.ai_optimization_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.ai_ad_campaigns(id) ON DELETE CASCADE,
  optimization_type TEXT NOT NULL, -- budget, audience, creative, bidding
  changes_made JSONB NOT NULL,
  reasoning TEXT,
  expected_impact TEXT,
  actual_impact JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Server-side conversion tracking
CREATE TABLE IF NOT EXISTS public.server_side_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_id TEXT UNIQUE NOT NULL,
  user_data JSONB,
  custom_data JSONB,
  order_id UUID,
  sent_successfully BOOLEAN DEFAULT false,
  platform_response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ad_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audience_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_optimization_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.server_side_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ad_platforms
CREATE POLICY "Admin can manage ad platforms"
  ON public.ad_platforms
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- RLS Policies for ai_ad_campaigns
CREATE POLICY "Admin can view campaigns"
  ON public.ai_ad_campaigns
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "System can manage campaigns"
  ON public.ai_ad_campaigns
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for tracking_events
CREATE POLICY "Anyone can insert tracking events"
  ON public.tracking_events
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can view tracking events"
  ON public.tracking_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- RLS Policies for ai_audience_insights
CREATE POLICY "Admin can view audience insights"
  ON public.ai_audience_insights
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "System can manage insights"
  ON public.ai_audience_insights
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for ai_optimization_logs
CREATE POLICY "Admin can view optimization logs"
  ON public.ai_optimization_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "System can insert optimization logs"
  ON public.ai_optimization_logs
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for server_side_events
CREATE POLICY "Admin can view server events"
  ON public.server_side_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "System can manage server events"
  ON public.server_side_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_ad_platforms_updated_at
  BEFORE UPDATE ON public.ad_platforms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_ad_campaigns_updated_at
  BEFORE UPDATE ON public.ai_ad_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_tracking_events_created_at ON public.tracking_events(created_at);
CREATE INDEX idx_tracking_events_event_name ON public.tracking_events(event_name);
CREATE INDEX idx_tracking_events_product_id ON public.tracking_events(product_id);
CREATE INDEX idx_ai_campaigns_status ON public.ai_ad_campaigns(status);
CREATE INDEX idx_ai_campaigns_platform ON public.ai_ad_campaigns(platform);
CREATE INDEX idx_server_events_platform ON public.server_side_events(platform);
CREATE INDEX idx_server_events_event_id ON public.server_side_events(event_id);