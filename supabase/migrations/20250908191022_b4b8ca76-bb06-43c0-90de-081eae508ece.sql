-- Create countries table for country-wise product management
CREATE TABLE public.countries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE, -- BD, US, AU, CA
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

-- Countries are viewable by everyone
CREATE POLICY "Countries are viewable by everyone" 
ON public.countries 
FOR SELECT 
USING (is_active = true);

-- Create IP ranges table for country detection
CREATE TABLE public.ip_ranges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
  ip_prefix TEXT NOT NULL, -- First 3-4 digits like "101.2", "102.38"
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ip_ranges ENABLE ROW LEVEL SECURITY;

-- IP ranges are viewable by everyone for country detection
CREATE POLICY "IP ranges are viewable by everyone" 
ON public.ip_ranges 
FOR SELECT 
USING (true);

-- Add country_id to products table
ALTER TABLE public.products ADD COLUMN country_id UUID REFERENCES public.countries(id);

-- Create index for better performance
CREATE INDEX idx_products_country ON public.products(country_id) WHERE country_id IS NOT NULL;
CREATE INDEX idx_ip_ranges_prefix ON public.ip_ranges(ip_prefix);

-- Insert default countries
INSERT INTO public.countries (name, code, currency) VALUES
('Bangladesh', 'BD', 'BDT'),
('United States', 'US', 'USD'),
('Australia', 'AU', 'AUD'),
('Canada', 'CA', 'CAD');

-- Insert sample IP ranges for Bangladesh
INSERT INTO public.ip_ranges (country_id, ip_prefix, description)
SELECT id, '101.2', 'Bangladesh IP range 101.2.x.x' FROM public.countries WHERE code = 'BD'
UNION ALL
SELECT id, '102.38', 'Bangladesh IP range 102.38.x.x' FROM public.countries WHERE code = 'BD'
UNION ALL
SELECT id, '103.10', 'Bangladesh IP range 103.10.x.x' FROM public.countries WHERE code = 'BD'
UNION ALL
-- US IP ranges
SELECT id, '208.67', 'US IP range 208.67.x.x' FROM public.countries WHERE code = 'US'
UNION ALL
SELECT id, '173.252', 'US IP range 173.252.x.x' FROM public.countries WHERE code = 'US'
UNION ALL
SELECT id, '199.59', 'US IP range 199.59.x.x' FROM public.countries WHERE code = 'US'
UNION ALL
-- Australia IP ranges
SELECT id, '203.206', 'Australia IP range 203.206.x.x' FROM public.countries WHERE code = 'AU'
UNION ALL
SELECT id, '210.23', 'Australia IP range 210.23.x.x' FROM public.countries WHERE code = 'AU'
UNION ALL
SELECT id, '124.168', 'Australia IP range 124.168.x.x' FROM public.countries WHERE code = 'AU'
UNION ALL
-- Canada IP ranges
SELECT id, '142.104', 'Canada IP range 142.104.x.x' FROM public.countries WHERE code = 'CA'
UNION ALL
SELECT id, '206.167', 'Canada IP range 206.167.x.x' FROM public.countries WHERE code = 'CA'
UNION ALL
SELECT id, '199.212', 'Canada IP range 199.212.x.x' FROM public.countries WHERE code = 'CA';

-- Add payment gateways table for mobile payment options
CREATE TABLE public.payment_gateways (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- bkash, nagad, rocket
  display_name TEXT NOT NULL,
  wallet_number TEXT NOT NULL,
  country_id UUID REFERENCES public.countries(id),
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

-- Payment gateways are viewable by everyone
CREATE POLICY "Payment gateways are viewable by everyone" 
ON public.payment_gateways 
FOR SELECT 
USING (is_active = true);

-- Admins can manage payment gateways
CREATE POLICY "Admins can manage payment gateways" 
ON public.payment_gateways 
FOR ALL 
USING (true);

-- Add Bangladesh payment gateways
INSERT INTO public.payment_gateways (name, display_name, wallet_number, country_id, instructions)
SELECT 
  'bkash', 
  'bKash', 
  '+8801712345678', 
  id, 
  'Send money to this bKash number and enter your transaction ID'
FROM public.countries WHERE code = 'BD'
UNION ALL
SELECT 
  'nagad', 
  'Nagad', 
  '+8801812345678', 
  id, 
  'Send money to this Nagad number and enter your transaction ID'
FROM public.countries WHERE code = 'BD'
UNION ALL
SELECT 
  'rocket', 
  'Rocket', 
  '+8801912345678', 
  id, 
  'Send money to this Rocket number and enter your transaction ID'
FROM public.countries WHERE code = 'BD';

-- Create transaction verifications table
CREATE TABLE public.transaction_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id),
  payment_gateway TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, verified, failed
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transaction_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own transaction verifications
CREATE POLICY "Users can view their own transaction verifications" 
ON public.transaction_verifications 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = transaction_verifications.order_id 
  AND orders.customer_id = auth.uid()
));

-- Users can create transaction verifications for their orders
CREATE POLICY "Users can create transaction verifications" 
ON public.transaction_verifications 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.orders 
  WHERE orders.id = transaction_verifications.order_id 
  AND orders.customer_id = auth.uid()
));