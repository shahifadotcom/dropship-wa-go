-- Create SSLCommerz configuration table
CREATE TABLE IF NOT EXISTS public.sslcommerz_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id TEXT NOT NULL,
  store_password TEXT NOT NULL,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sslcommerz_config ENABLE ROW LEVEL SECURITY;

-- Admin can manage SSLCommerz config
CREATE POLICY "Admin can manage SSLCommerz config"
  ON public.sslcommerz_config
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
CREATE TRIGGER update_sslcommerz_config_updated_at
  BEFORE UPDATE ON public.sslcommerz_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create SSLCommerz transactions table
CREATE TABLE IF NOT EXISTS public.sslcommerz_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  transaction_id TEXT UNIQUE NOT NULL,
  session_key TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  status TEXT NOT NULL DEFAULT 'pending',
  card_type TEXT,
  card_brand TEXT,
  bank_transaction_id TEXT,
  validation_id TEXT,
  response_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sslcommerz_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view their own SSLCommerz transactions"
  ON public.sslcommerz_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = sslcommerz_transactions.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Admin can view all transactions
CREATE POLICY "Admin can view all SSLCommerz transactions"
  ON public.sslcommerz_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- System can insert transactions
CREATE POLICY "System can insert SSLCommerz transactions"
  ON public.sslcommerz_transactions
  FOR INSERT
  WITH CHECK (true);

-- System can update transactions
CREATE POLICY "System can update SSLCommerz transactions"
  ON public.sslcommerz_transactions
  FOR UPDATE
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_sslcommerz_transactions_updated_at
  BEFORE UPDATE ON public.sslcommerz_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();