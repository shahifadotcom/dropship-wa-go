-- Create store settings table
CREATE TABLE public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_name TEXT,
  store_tagline TEXT,
  store_description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_address TEXT,
  site_title TEXT,
  currency TEXT DEFAULT 'USD',
  email_notifications BOOLEAN DEFAULT true,
  whatsapp_notifications BOOLEAN DEFAULT true,
  inventory_alerts BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can manage store settings"
ON public.store_settings
FOR ALL
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.store_settings (
  store_name,
  store_tagline,
  store_description,
  contact_email,
  site_title,
  currency
) VALUES (
  'Shahifa Store',
  'Your Trusted E-commerce Partner',
  'High-quality products with fast delivery',
  'admin@shahifa.com',
  'Shahifa - E-commerce Store',
  'BDT'
);