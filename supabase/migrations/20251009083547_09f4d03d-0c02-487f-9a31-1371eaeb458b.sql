-- Update the 1-month product to become 12-month annual subscription
UPDATE products 
SET 
  name = 'Audio/Video Calling - Annual Plan',
  sku = 'CALLING-12M',
  price = 500.00,
  description = 'Get unlimited audio and video calling for 1 year (12 months). Connect with other registered users through high-quality voice and video calls. Best annual value!'
WHERE sku = 'CALLING-1M';

-- Delete the 3-month and 6-month subscription products
DELETE FROM products WHERE sku IN ('CALLING-3M', 'CALLING-6M');