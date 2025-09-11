-- Create whatsapp_config table for storing QR codes and connection status
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code TEXT,
  is_connected BOOLEAN DEFAULT false,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on whatsapp_config
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access only
CREATE POLICY "Admin can manage whatsapp config" 
ON public.whatsapp_config 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create notification_logs table for tracking sent messages
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on notification_logs
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to notification logs
CREATE POLICY "Admin can view notification logs" 
ON public.notification_logs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);

-- Create policy for system to insert logs
CREATE POLICY "System can insert notification logs" 
ON public.notification_logs 
FOR INSERT 
WITH CHECK (true);

-- Create trigger to update updated_at for whatsapp_config
CREATE TRIGGER update_whatsapp_config_updated_at
  BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();