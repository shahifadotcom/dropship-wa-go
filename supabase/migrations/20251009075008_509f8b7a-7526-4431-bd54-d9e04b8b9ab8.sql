-- Insert calling subscription products (available globally)
-- First, get or create a global category for services
INSERT INTO public.categories (id, name, slug, description, image, product_count)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Services',
  'services',
  'Digital services and subscriptions',
  NULL,
  0
) ON CONFLICT (slug) DO NOTHING;

-- Insert calling subscription products
INSERT INTO public.products (
  id,
  name,
  description,
  price,
  original_price,
  images,
  category_id,
  in_stock,
  stock_quantity,
  rating,
  review_count,
  sku,
  slug,
  tags,
  brand,
  country_id,
  meta_title,
  meta_description,
  cash_on_delivery_enabled,
  auto_order_enabled
) VALUES
-- 1 Month Subscription
(
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'Audio/Video Calling - 1 Month',
  'Get unlimited audio and video calling for 1 month. Connect with other registered users through high-quality voice and video calls.',
  500.00,
  NULL,
  ARRAY[]::text[],
  'a0000000-0000-0000-0000-000000000001'::uuid,
  true,
  999999,
  5.0,
  0,
  'CALLING-1M',
  'calling-subscription-1-month',
  ARRAY['calling', 'video', 'audio', 'subscription', '1-month'],
  'Shahifa Communications',
  NULL, -- Global product, no country restriction
  'Audio/Video Calling Subscription - 1 Month | Shahifa',
  'Subscribe to our 1-month audio and video calling service. Make unlimited calls to other users.',
  false,
  false
),
-- 3 Month Subscription
(
  'b0000000-0000-0000-0000-000000000002'::uuid,
  'Audio/Video Calling - 3 Months',
  'Get unlimited audio and video calling for 3 months. Connect with other registered users through high-quality voice and video calls. Best value for regular users!',
  1000.00,
  1500.00,
  ARRAY[]::text[],
  'a0000000-0000-0000-0000-000000000001'::uuid,
  true,
  999999,
  5.0,
  0,
  'CALLING-3M',
  'calling-subscription-3-months',
  ARRAY['calling', 'video', 'audio', 'subscription', '3-months'],
  'Shahifa Communications',
  NULL,
  'Audio/Video Calling Subscription - 3 Months | Shahifa',
  'Subscribe to our 3-month audio and video calling service. Save 33% compared to monthly subscription!',
  false,
  false
),
-- 6 Month Subscription
(
  'b0000000-0000-0000-0000-000000000003'::uuid,
  'Audio/Video Calling - 6 Months',
  'Get unlimited audio and video calling for 6 months. Connect with other registered users through high-quality voice and video calls. Maximum savings!',
  2000.00,
  3000.00,
  ARRAY[]::text[],
  'a0000000-0000-0000-0000-000000000001'::uuid,
  true,
  999999,
  5.0,
  0,
  'CALLING-6M',
  'calling-subscription-6-months',
  ARRAY['calling', 'video', 'audio', 'subscription', '6-months'],
  'Shahifa Communications',
  NULL,
  'Audio/Video Calling Subscription - 6 Months | Shahifa',
  'Subscribe to our 6-month audio and video calling service. Save 60% compared to monthly subscription!',
  false,
  false
)
ON CONFLICT (sku) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  updated_at = now();