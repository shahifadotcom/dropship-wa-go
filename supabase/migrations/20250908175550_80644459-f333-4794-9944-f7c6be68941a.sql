-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.create_error_logs_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function exists to satisfy the error logger
  -- The table is already created above
  RETURN;
END;
$$;