-- Enable real-time for tables
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.transaction_verifications REPLICA IDENTITY FULL;
ALTER TABLE public.order_items REPLICA IDENTITY FULL;

-- Add orders table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transaction_verifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;