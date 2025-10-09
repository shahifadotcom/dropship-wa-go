-- Add print_on_demand and product_type fields to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS print_on_demand boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS product_type text DEFAULT 'physical' CHECK (product_type IN ('physical', 'digital', 'print_on_demand'));

-- Create index for product_type filtering
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(product_type);

-- Update existing digital products to have correct product_type
UPDATE public.products 
SET product_type = 'digital' 
WHERE is_digital = true;

-- Update existing non-digital products to physical
UPDATE public.products 
SET product_type = 'physical' 
WHERE is_digital = false OR is_digital IS NULL;

-- Update print_on_demand products
UPDATE public.products 
SET product_type = 'print_on_demand' 
WHERE print_on_demand = true;

COMMENT ON COLUMN public.products.print_on_demand IS 'Whether this product is print-on-demand';
COMMENT ON COLUMN public.products.product_type IS 'Type of product: physical, digital, or print_on_demand';