-- Create WooCommerce API keys table for managing external application access
CREATE TABLE public.woocommerce_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  app_name TEXT NOT NULL,
  api_key TEXT NOT NULL UNIQUE,
  api_secret TEXT NOT NULL,
  scope TEXT NOT NULL DEFAULT 'read_write',
  callback_url TEXT,
  external_user_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_access_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.woocommerce_api_keys ENABLE ROW LEVEL SECURITY;

-- Create policies for API keys
CREATE POLICY "Users can view their own API keys" 
ON public.woocommerce_api_keys 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys" 
ON public.woocommerce_api_keys 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
ON public.woocommerce_api_keys 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
ON public.woocommerce_api_keys 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_woocommerce_api_keys_updated_at
BEFORE UPDATE ON public.woocommerce_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_woocommerce_api_keys_user_id ON public.woocommerce_api_keys(user_id);
CREATE INDEX idx_woocommerce_api_keys_api_key ON public.woocommerce_api_keys(api_key);
CREATE INDEX idx_woocommerce_api_keys_active ON public.woocommerce_api_keys(is_active);