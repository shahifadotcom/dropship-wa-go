-- Create OTP verification table
CREATE TABLE public.otp_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy for OTP verification
CREATE POLICY "Users can verify their own OTP" 
ON public.otp_verifications 
FOR ALL 
USING (true);

-- Create WhatsApp configuration table for admin
CREATE TABLE public.whatsapp_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code TEXT,
  is_connected BOOLEAN DEFAULT FALSE,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Create policy for WhatsApp config (admin only for now)
CREATE POLICY "Admin can manage WhatsApp config" 
ON public.whatsapp_config 
FOR ALL 
USING (true);

-- Create notification templates table
CREATE TABLE public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  template TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for notification templates
CREATE POLICY "Templates are viewable by everyone" 
ON public.notification_templates 
FOR SELECT 
USING (true);

-- Insert default notification templates
INSERT INTO public.notification_templates (name, template) VALUES
('order_confirmed', 'Hello {{name}}! Your order #{{order_number}} has been confirmed. Total: ${{total}}. Thank you for shopping with us!'),
('order_processing', 'Hi {{name}}! Your order #{{order_number}} is now being processed. We''ll update you once it ships.'),
('order_shipped', 'Great news {{name}}! Your order #{{order_number}} has been shipped. Track your package with the details we''ve sent to your email.'),
('order_delivered', 'Hello {{name}}! Your order #{{order_number}} has been delivered. We hope you love your purchase!'),
('payment_pending', 'Hi {{name}}! Your order #{{order_number}} is confirmed but payment is still pending. Please complete your payment to process your order.');

-- Create notification logs table
CREATE TABLE public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for notification logs
CREATE POLICY "Users can view their own notification logs" 
ON public.notification_logs 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = notification_logs.order_id 
  AND orders.customer_id = auth.uid()
));

-- Add trigger for timestamps
CREATE TRIGGER update_whatsapp_config_updated_at
BEFORE UPDATE ON public.whatsapp_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();