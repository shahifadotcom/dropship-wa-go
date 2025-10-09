-- Remove balance field from payment_gateways table
ALTER TABLE payment_gateways DROP COLUMN IF EXISTS balance;