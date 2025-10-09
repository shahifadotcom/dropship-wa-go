-- Add download_url field to products for digital downloadable products
ALTER TABLE products 
ADD COLUMN download_url text;

-- Add comment for clarity
COMMENT ON COLUMN products.download_url IS 'Download URL for digital products (software, ebooks, etc.)';