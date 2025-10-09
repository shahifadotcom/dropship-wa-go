-- Delete existing test transactions and insert fresh sample data
DELETE FROM sms_transactions WHERE transaction_id LIKE '%TEST';

-- Insert 5 fresh sample SMS transactions for testing
INSERT INTO sms_transactions (
  transaction_id,
  sender_number,
  message_content,
  wallet_type,
  amount,
  new_balance,
  transaction_date,
  is_processed
) VALUES
  ('BKASH001', '+8801712345678', 'You have received BDT 500.00 from Bkash. TxnID: BKASH001. New Balance: BDT 2500.00', 'bkash', 500.00, 2500.00, now(), false),
  ('NAGAD002', '+8801812345678', 'Nagad payment received BDT 750.00. Transaction ID: NAGAD002. Balance: BDT 3250.00', 'nagad', 750.00, 3250.00, now(), false),
  ('ROCKET003', '+8801912345678', 'Rocket money received BDT 1000.00. TxnID: ROCKET003. Current Balance: BDT 5000.00', 'rocket', 1000.00, 5000.00, now(), false),
  ('BKASH004', '+8801612345678', 'Bkash payment BDT 300.00 received successfully. ID: BKASH004. Balance: BDT 1800.00', 'bkash', 300.00, 1800.00, now(), false),
  ('NAGAD005', '+8801512345678', 'You got BDT 1500.00 via Nagad. Transaction: NAGAD005. New Balance: BDT 6500.00', 'nagad', 1500.00, 6500.00, now(), false);