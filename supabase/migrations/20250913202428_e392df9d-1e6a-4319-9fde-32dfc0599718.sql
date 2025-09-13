-- Create a function to store WooCommerce API keys until types are updated
CREATE OR REPLACE FUNCTION public.store_woocommerce_api_key(
  p_user_id UUID,
  p_app_name TEXT,
  p_api_key TEXT,
  p_api_secret TEXT,
  p_scope TEXT,
  p_callback_url TEXT,
  p_external_user_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.woocommerce_api_keys (
    user_id,
    app_name,
    api_key,
    api_secret,
    scope,
    callback_url,
    external_user_id,
    is_active
  ) VALUES (
    p_user_id,
    p_app_name,
    p_api_key,
    p_api_secret,
    p_scope,
    p_callback_url,
    p_external_user_id,
    true
  );
END;
$$;