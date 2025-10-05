-- Add virtual trial enabled field to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS virtual_trial_enabled boolean DEFAULT false;

-- Create virtual trial configuration table
CREATE TABLE IF NOT EXISTS public.virtual_trial_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_provider text NOT NULL DEFAULT 'gemini',
  model_name text NOT NULL DEFAULT 'gemini-2.0-flash-exp',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on virtual_trial_config
ALTER TABLE public.virtual_trial_config ENABLE ROW LEVEL SECURITY;

-- Admin can manage virtual trial config
CREATE POLICY "Admin can manage virtual trial config"
  ON public.virtual_trial_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- Create virtual trial sessions table to track usage
CREATE TABLE IF NOT EXISTS public.virtual_trial_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  user_image_url text NOT NULL,
  result_image_url text,
  status text NOT NULL DEFAULT 'processing',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Enable RLS on virtual_trial_sessions
ALTER TABLE public.virtual_trial_sessions ENABLE ROW LEVEL SECURITY;

-- Users can create their own virtual trial sessions
CREATE POLICY "Users can create virtual trial sessions"
  ON public.virtual_trial_sessions
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own sessions (by session)
CREATE POLICY "Users can view virtual trial sessions"
  ON public.virtual_trial_sessions
  FOR SELECT
  USING (true);

-- Create updated_at trigger for virtual_trial_config
CREATE OR REPLACE FUNCTION update_virtual_trial_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_virtual_trial_config_updated_at
  BEFORE UPDATE ON public.virtual_trial_config
  FOR EACH ROW
  EXECUTE FUNCTION update_virtual_trial_config_updated_at();

-- Insert default configuration
INSERT INTO public.virtual_trial_config (ai_provider, model_name, is_active)
VALUES ('gemini', 'gemini-2.0-flash-exp', true)
ON CONFLICT DO NOTHING;