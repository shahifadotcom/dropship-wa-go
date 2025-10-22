-- Secure admin-only cascade product deletion helper
CREATE OR REPLACE FUNCTION public.delete_product_cascade(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure only admins can run this
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can delete products';
  END IF;

  -- Clean up dependent data in a safe order
  -- 1) Price sync logs (simple delete)
  DELETE FROM public.price_sync_logs WHERE product_id = p_product_id;

  -- 2) Product reviews (simple delete)
  DELETE FROM public.product_reviews WHERE product_id = p_product_id;

  -- 3) Product variants (simple delete)
  DELETE FROM public.product_variants WHERE product_id = p_product_id;

  -- 4) Break CJ linkage if present
  UPDATE public.cj_product_imports 
  SET local_product_id = NULL 
  WHERE local_product_id = p_product_id;

  -- 5) Preserve order history: detach product reference instead of deleting order items
  UPDATE public.order_items 
  SET product_id = NULL 
  WHERE product_id = p_product_id;

  -- 6) Finally delete the product itself
  DELETE FROM public.products WHERE id = p_product_id;
END;
$$;

-- Allow authenticated users to call it; function itself enforces admin check
GRANT EXECUTE ON FUNCTION public.delete_product_cascade(uuid) TO authenticated;