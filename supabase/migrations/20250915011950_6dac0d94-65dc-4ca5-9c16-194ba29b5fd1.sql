-- Phase 2: Enhanced Payment Systems Migration
-- Adding support for Binance Pay, PayPal personal, and Bangladesh mobile wallets

-- Create mobile wallet configurations table
CREATE TABLE public.mobile_wallet_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('bkash', 'nagad', 'rocket')),
  wallet_number TEXT NOT NULL,
  wallet_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_type)
);

-- Enable RLS on mobile wallet config
ALTER TABLE public.mobile_wallet_config ENABLE ROW LEVEL SECURITY;

-- Create policies for mobile wallet config (admin only)
CREATE POLICY "Admin can manage mobile wallet config"
ON public.mobile_wallet_config
FOR ALL
TO authenticated
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

-- Create SMS transactions table for Android app monitoring
CREATE TABLE public.sms_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  sender_number TEXT NOT NULL,
  message_content TEXT NOT NULL,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('bkash', 'nagad', 'rocket')),
  amount NUMERIC,
  transaction_date TIMESTAMP WITH TIME ZONE,
  device_id TEXT,
  is_processed BOOLEAN NOT NULL DEFAULT false,
  matched_order_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(transaction_id, wallet_type)
);

-- Enable RLS on SMS transactions
ALTER TABLE public.sms_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for SMS transactions (system only)
CREATE POLICY "System can manage SMS transactions"
ON public.sms_transactions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);

-- Create service role policy for SMS transactions (for Android app)
CREATE POLICY "Service role can insert SMS transactions"
ON public.sms_transactions
FOR INSERT
TO service_role
WITH CHECK (true);

-- Create Binance Pay configuration table
CREATE TABLE public.binance_pay_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  api_key TEXT,
  api_secret TEXT,
  merchant_id TEXT,
  webhook_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  test_mode BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on Binance Pay config
ALTER TABLE public.binance_pay_config ENABLE ROW LEVEL SECURITY;

-- Create policies for Binance Pay config (admin only)
CREATE POLICY "Admin can manage Binance Pay config"
ON public.binance_pay_config
FOR ALL
TO authenticated
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

-- Create PayPal personal account configuration table
CREATE TABLE public.paypal_personal_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paypal_email TEXT NOT NULL,
  webhook_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  auto_verification BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on PayPal personal config
ALTER TABLE public.paypal_personal_config ENABLE ROW LEVEL SECURITY;

-- Create policies for PayPal personal config (admin only)
CREATE POLICY "Admin can manage PayPal personal config"
ON public.paypal_personal_config
FOR ALL
TO authenticated
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

-- Update payment_gateways table with new gateway types
INSERT INTO public.payment_gateways (name, display_name, wallet_number, instructions, is_active) 
VALUES 
  ('bkash', 'bKash', '', 'Send money to our bKash number and provide transaction ID', false),
  ('nagad', 'Nagad', '', 'Send money to our Nagad number and provide transaction ID', false),
  ('rocket', 'Rocket', '', 'Send money to our Rocket number and provide transaction ID', false),
  ('binance_pay', 'Binance Pay', '', 'Pay securely with Binance Pay', false),
  ('paypal_personal', 'PayPal', '', 'Send payment to our PayPal account', false)
ON CONFLICT (name) DO NOTHING;

-- Create triggers for updated_at columns
CREATE TRIGGER update_mobile_wallet_config_updated_at
  BEFORE UPDATE ON public.mobile_wallet_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_binance_pay_config_updated_at
  BEFORE UPDATE ON public.binance_pay_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_paypal_personal_config_updated_at
  BEFORE UPDATE ON public.paypal_personal_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add realtime support for SMS transactions monitoring
ALTER TABLE public.sms_transactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sms_transactions;

-- Add index for faster transaction lookups
CREATE INDEX idx_sms_transactions_transaction_id ON public.sms_transactions(transaction_id);
CREATE INDEX idx_sms_transactions_wallet_type ON public.sms_transactions(wallet_type);
CREATE INDEX idx_sms_transactions_processed ON public.sms_transactions(is_processed);

-- Create function to match SMS transactions with orders
CREATE OR REPLACE FUNCTION public.match_sms_transaction_with_order(
  p_transaction_id TEXT,
  p_wallet_type TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  matched_order_id UUID;
BEGIN
  -- Look for pending orders with matching transaction verification
  SELECT o.id INTO matched_order_id
  FROM orders o
  JOIN transaction_verifications tv ON tv.order_id = o.id
  WHERE tv.transaction_id = p_transaction_id
    AND tv.payment_gateway = p_wallet_type
    AND tv.status = 'pending'
    AND o.payment_status = 'pending'
  LIMIT 1;
  
  -- If found, update the SMS transaction and order
  IF matched_order_id IS NOT NULL THEN
    -- Mark SMS transaction as processed
    UPDATE sms_transactions 
    SET is_processed = true, matched_order_id = matched_order_id
    WHERE transaction_id = p_transaction_id AND wallet_type = p_wallet_type;
    
    -- Update transaction verification status
    UPDATE transaction_verifications
    SET status = 'verified', verified_at = now()
    WHERE transaction_id = p_transaction_id AND payment_gateway = p_wallet_type;
    
    -- Update order payment status
    UPDATE orders
    SET payment_status = 'paid', updated_at = now()
    WHERE id = matched_order_id;
  END IF;
  
  RETURN matched_order_id;
END;
$$;