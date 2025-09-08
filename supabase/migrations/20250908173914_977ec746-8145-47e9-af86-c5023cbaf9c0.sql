-- Create whatsapp_config table for storing WhatsApp connection status
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  qr_code TEXT,
  is_connected BOOLEAN DEFAULT FALSE,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role access (for admin functions)
CREATE POLICY "Service role can manage whatsapp config" ON public.whatsapp_config
  FOR ALL USING (auth.role() = 'service_role');