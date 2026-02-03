-- CRITICAL FIX: Secure binance_config table - API credentials are exposed!
-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.binance_config;
DROP POLICY IF EXISTS "Allow authenticated read" ON public.binance_config;
DROP POLICY IF EXISTS "Anyone can read binance_config" ON public.binance_config;
DROP POLICY IF EXISTS "Public read access" ON public.binance_config;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.binance_config;

-- Enable RLS
ALTER TABLE public.binance_config ENABLE ROW LEVEL SECURITY;

-- Only admins can access binance_config (contains sensitive API credentials)
CREATE POLICY "Only admins can view binance_config"
ON public.binance_config
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can insert binance_config"
ON public.binance_config
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update binance_config"
ON public.binance_config
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete binance_config"
ON public.binance_config
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- FIX: Secure advance_payments table - payment records are exposed
-- Drop any existing permissive policies
DROP POLICY IF EXISTS "Allow public read access" ON public.advance_payments;
DROP POLICY IF EXISTS "Anyone can read advance_payments" ON public.advance_payments;
DROP POLICY IF EXISTS "Public read access" ON public.advance_payments;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.advance_payments;

-- Keep existing secure policies if they exist, otherwise create new ones
-- Check existing policies and ensure only secure ones remain

-- Users can only view their own payments via order ownership
DROP POLICY IF EXISTS "Users can view own payments via orders" ON public.advance_payments;
CREATE POLICY "Users can view own payments via orders"
ON public.advance_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = advance_payments.order_id
    AND orders.customer_id = auth.uid()
  )
);

-- Admins can view all payments
DROP POLICY IF EXISTS "Admins can view all payments" ON public.advance_payments;
CREATE POLICY "Admins can view all payments"
ON public.advance_payments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);