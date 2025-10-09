-- Create binance_config table
CREATE TABLE IF NOT EXISTS public.binance_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key TEXT NOT NULL,
  api_secret TEXT NOT NULL,
  binance_pay_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  merchant_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.binance_config ENABLE ROW LEVEL SECURITY;

-- Admin can manage Binance config
CREATE POLICY "Admin can manage binance config"
  ON public.binance_config
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

-- Create trigger for updated_at
CREATE TRIGGER update_binance_config_updated_at
  BEFORE UPDATE ON public.binance_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();