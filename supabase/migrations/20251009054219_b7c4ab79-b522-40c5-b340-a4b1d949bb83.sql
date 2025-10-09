-- Insert 5 sample SMS transactions for testing
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
  ('TXN001TEST', '+8801712345678', 'You have received BDT 500.00 from Bkash. TxnID: TXN001TEST. New Balance: BDT 2500.00', 'bkash', 500.00, 2500.00, now(), false),
  ('TXN002TEST', '+8801812345678', 'Nagad payment received BDT 750.00. Transaction ID: TXN002TEST. Balance: BDT 3250.00', 'nagad', 750.00, 3250.00, now(), false),
  ('TXN003TEST', '+8801912345678', 'Rocket money received BDT 1000.00. TxnID: TXN003TEST. Current Balance: BDT 5000.00', 'rocket', 1000.00, 5000.00, now(), false),
  ('TXN004TEST', '+8801612345678', 'Bkash payment BDT 300.00 received successfully. ID: TXN004TEST. Balance: BDT 1800.00', 'bkash', 300.00, 1800.00, now(), false),
  ('TXN005TEST', '+8801512345678', 'You got BDT 1500.00 via Nagad. Transaction: TXN005TEST. New Balance: BDT 6500.00', 'nagad', 1500.00, 6500.00, now(), false);