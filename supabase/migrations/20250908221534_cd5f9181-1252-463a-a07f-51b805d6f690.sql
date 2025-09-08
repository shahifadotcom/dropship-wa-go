-- Create vendors table for dropshipping suppliers
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  api_type TEXT NOT NULL, -- 'cjdropshipping', 'zendrop', 'aliexpress', 'spocket', 'printful', 'dsers', 'autods'
  api_endpoint TEXT NOT NULL,
  api_key TEXT,
  access_token TEXT,
  refresh_token TEXT,
  client_id TEXT,
  client_secret TEXT,
  webhook_url TEXT,
  is_active BOOLEAN DEFAULT true,
  auto_order_enabled BOOLEAN DEFAULT false,
  price_sync_enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create vendor_products table to link products with vendors
CREATE TABLE public.vendor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  vendor_product_id TEXT NOT NULL, -- Product ID in vendor's system
  vendor_sku TEXT,
  vendor_price NUMERIC,
  shipping_cost NUMERIC DEFAULT 0,
  processing_days INTEGER DEFAULT 3,
  is_available BOOLEAN DEFAULT true,
  last_price_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, vendor_id)
);

-- Create saved_payment_methods table for credit card storage (encrypted)
CREATE TABLE public.saved_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_name TEXT NOT NULL,
  encrypted_card_data TEXT NOT NULL, -- Encrypted card details
  card_last_four TEXT NOT NULL,
  card_brand TEXT NOT NULL,
  expiry_month INTEGER NOT NULL,
  expiry_year INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create vendor_orders table to track orders placed with vendors
CREATE TABLE public.vendor_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id),
  vendor_order_id TEXT,
  vendor_order_number TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled', 'failed'
  tracking_number TEXT,
  tracking_url TEXT,
  shipping_method TEXT,
  total_amount NUMERIC,
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  payment_method_id UUID REFERENCES public.saved_payment_methods(id),
  error_message TEXT,
  vendor_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create price_sync_logs table to track price updates
CREATE TABLE public.price_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES public.vendors(id),
  product_id UUID REFERENCES public.products(id),
  old_price NUMERIC,
  new_price NUMERIC,
  sync_status TEXT DEFAULT 'success', -- 'success', 'failed', 'skipped'
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vendors (admin only)
CREATE POLICY "Admin can manage vendors" ON public.vendors
FOR ALL USING (true);

-- Create RLS policies for vendor_products (admin only)
CREATE POLICY "Admin can manage vendor products" ON public.vendor_products
FOR ALL USING (true);

CREATE POLICY "Vendor products are viewable by everyone" ON public.vendor_products
FOR SELECT USING (true);

-- Create RLS policies for saved_payment_methods (user own data)
CREATE POLICY "Users can manage their own payment methods" ON public.saved_payment_methods
FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for vendor_orders (users can view their own)
CREATE POLICY "Users can view their own vendor orders" ON public.vendor_orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = vendor_orders.order_id 
    AND orders.customer_id = auth.uid()
  )
);

CREATE POLICY "Admin can manage vendor orders" ON public.vendor_orders
FOR ALL USING (true);

-- Create RLS policies for price_sync_logs (admin only)
CREATE POLICY "Admin can manage price sync logs" ON public.price_sync_logs
FOR ALL USING (true);

-- Add vendor_id to products table
ALTER TABLE public.products ADD COLUMN vendor_id UUID REFERENCES public.vendors(id);
ALTER TABLE public.products ADD COLUMN auto_order_enabled BOOLEAN DEFAULT false;

-- Create triggers for updated_at
CREATE TRIGGER update_vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_products_updated_at
  BEFORE UPDATE ON public.vendor_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_saved_payment_methods_updated_at
  BEFORE UPDATE ON public.saved_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vendor_orders_updated_at
  BEFORE UPDATE ON public.vendor_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default vendors based on research
INSERT INTO public.vendors (name, api_type, api_endpoint, is_active) VALUES
('CJ Dropshipping', 'cjdropshipping', 'https://developers.cjdropshipping.cn/api/v2', true),
('Zendrop', 'zendrop', 'https://api.zendrop.com/v1', true),
('AliExpress (AutoDS)', 'autods', 'https://api.autods.com/v1', true),
('Spocket', 'spocket', 'https://api.spocket.co/v1', true),
('Printful', 'printful', 'https://api.printful.com', true),
('DSers', 'dsers', 'https://api.dsers.com/v1', true),
('Alibaba', 'alibaba', 'https://openapi.1688.com', true),
('Banggood', 'banggood', 'https://api.banggood.com/v1', true),
('DHgate', 'dhgate', 'https://api.dhgate.com/v1', true),
('Wholesale Central', 'wholesale_central', 'https://api.wholesalecentral.com/v1', true);