-- Add COD test transaction with 100 BDT confirmation fee
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
  ('COD100TEST', '+8801712345678', 'Bkash confirmation fee received BDT 100.00. TxnID: COD100TEST. Balance: BDT 1100.00', 'bkash', 100.00, 1100.00, now(), false);