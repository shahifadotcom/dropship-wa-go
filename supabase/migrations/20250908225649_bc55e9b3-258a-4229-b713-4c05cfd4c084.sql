-- Add product-specific payment gateway and cash on delivery features
ALTER TABLE products ADD COLUMN IF NOT EXISTS allowed_payment_gateways TEXT[];
ALTER TABLE products ADD COLUMN IF NOT EXISTS cash_on_delivery_enabled BOOLEAN DEFAULT false;

-- Add Binance gateway to payment gateways
INSERT INTO payment_gateways (name, display_name, wallet_number, country_id, instructions, is_active)
SELECT 
  'binance_pay',
  'Binance Pay',
  'admin@example.com',
  c.id,
  'Pay using Binance Pay. Transaction will be auto-verified within 5 minutes.',
  true
FROM countries c 
WHERE c.code = 'BD'
ON CONFLICT DO NOTHING;

-- Add Cash on Delivery option
INSERT INTO payment_gateways (name, display_name, wallet_number, country_id, instructions, is_active)
SELECT 
  'cod',
  'Cash on Delivery (COD)',
  'COD-SERVICE',
  c.id,
  'Pay 100 BDT advance for delivery confirmation. Remaining amount will be collected on delivery.',
  true
FROM countries c 
WHERE c.code = 'BD'
ON CONFLICT DO NOTHING;

-- Create table for advance payments
CREATE TABLE IF NOT EXISTS advance_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  amount NUMERIC NOT NULL DEFAULT 100,
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'binance_pay',
  transaction_id TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for advance payments
ALTER TABLE advance_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own advance payments" 
ON advance_payments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = advance_payments.order_id 
  AND orders.customer_id = auth.uid()
));

CREATE POLICY "Users can create advance payments" 
ON advance_payments 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = advance_payments.order_id 
  AND orders.customer_id = auth.uid()
));

-- Admin policies for advance payments
CREATE POLICY "Admin can manage advance payments" 
ON advance_payments 
FOR ALL 
USING (true);