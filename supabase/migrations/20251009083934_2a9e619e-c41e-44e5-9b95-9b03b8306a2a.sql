-- Add is_digital field to products table to distinguish digital from physical products
ALTER TABLE products 
ADD COLUMN is_digital boolean NOT NULL DEFAULT false;

-- Update the calling subscription to be a digital product
UPDATE products 
SET is_digital = true,
    stock_quantity = 9999,
    in_stock = true,
    shipping_cost = 0
WHERE sku = 'CALLING-12M';

-- Add comment for clarity
COMMENT ON COLUMN products.is_digital IS 'Indicates if this is a digital product (no physical shipping required)';