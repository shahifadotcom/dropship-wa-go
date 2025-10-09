-- Create Stripe configuration table
CREATE TABLE IF NOT EXISTS public.stripe_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publishable_key TEXT NOT NULL,
  secret_key TEXT NOT NULL,
  webhook_secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_sandbox BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_config ENABLE ROW LEVEL SECURITY;

-- Admin can manage Stripe config
CREATE POLICY "Admin can manage Stripe config"
  ON public.stripe_config
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

-- Create Stripe transactions table
CREATE TABLE IF NOT EXISTS public.stripe_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  payment_intent_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  customer_email TEXT,
  response_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stripe_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own Stripe transactions
CREATE POLICY "Users can view their own Stripe transactions"
  ON public.stripe_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = stripe_transactions.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Admin can view all Stripe transactions
CREATE POLICY "Admin can view all Stripe transactions"
  ON public.stripe_transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- System can insert Stripe transactions
CREATE POLICY "System can insert Stripe transactions"
  ON public.stripe_transactions
  FOR INSERT
  WITH CHECK (true);

-- System can update Stripe transactions
CREATE POLICY "System can update Stripe transactions"
  ON public.stripe_transactions
  FOR UPDATE
  USING (true);

-- Add updated_at trigger for stripe_config
CREATE TRIGGER update_stripe_config_updated_at
  BEFORE UPDATE ON public.stripe_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for stripe_transactions
CREATE TRIGGER update_stripe_transactions_updated_at
  BEFORE UPDATE ON public.stripe_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();