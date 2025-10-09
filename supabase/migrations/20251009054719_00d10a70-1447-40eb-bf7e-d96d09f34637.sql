-- Add fresh COD test transactions
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
  ('CODFRESH01', '+8801712345678', 'Bkash confirmation fee BDT 100.00. TxnID: CODFRESH01. Balance: BDT 1200.00', 'bkash', 100.00, 1200.00, now(), false),
  ('CODFRESH02', '+8801812345678', 'Nagad confirmation fee BDT 100.00. TxnID: CODFRESH02. Balance: BDT 1300.00', 'nagad', 100.00, 1300.00, now(), false),
  ('CODFRESH03', '+8801912345678', 'Rocket confirmation fee BDT 100.00. TxnID: CODFRESH03. Balance: BDT 1400.00', 'rocket', 100.00, 1400.00, now(), false);