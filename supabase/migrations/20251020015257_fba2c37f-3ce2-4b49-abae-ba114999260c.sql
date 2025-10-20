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