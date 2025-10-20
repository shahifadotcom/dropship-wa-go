-- Update sms_transactions table to support more data extraction and flexible wallet types

-- Add new columns for extracted SMS data
ALTER TABLE public.sms_transactions 
ADD COLUMN IF NOT EXISTS new_balance NUMERIC,
ADD COLUMN IF NOT EXISTS fee NUMERIC,
ADD COLUMN IF NOT EXISTS sender_phone TEXT;

-- Drop the wallet_type constraint to allow 'unknown'
ALTER TABLE public.sms_transactions 
DROP CONSTRAINT IF EXISTS sms_transactions_wallet_type_check;

-- Add new constraint allowing 'unknown'
ALTER TABLE public.sms_transactions 
ADD CONSTRAINT sms_transactions_wallet_type_check 
CHECK (wallet_type IN ('bkash', 'nagad', 'rocket', 'unknown'));

-- Add index for sender phone lookups
CREATE INDEX IF NOT EXISTS idx_sms_transactions_sender_phone 
ON public.sms_transactions(sender_phone);

-- Create view for admin to easily see unprocessed transactions with extracted data
CREATE OR REPLACE VIEW public.unprocessed_sms_transactions AS
SELECT 
  id,
  transaction_id,
  sender_number,
  sender_phone,
  wallet_type,
  amount,
  fee,
  new_balance,
  transaction_date,
  message_content,
  created_at,
  matched_order_id
FROM public.sms_transactions
WHERE is_processed = false
ORDER BY created_at DESC;

-- Grant access to view for admins
ALTER TABLE public.unprocessed_sms_transactions OWNER TO postgres;

-- Create policy for viewing unprocessed transactions
CREATE POLICY "Admins can view unprocessed SMS transactions"
ON public.sms_transactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  )
);