-- Add some sample categories if they don't exist
INSERT INTO public.categories (name, slug, description) VALUES
('Electronics', 'electronics', 'Electronic devices and gadgets'),
('Clothing', 'clothing', 'Fashion and apparel'),
('Home & Garden', 'home-garden', 'Home improvement and garden supplies'),
('Sports', 'sports', 'Sports equipment and gear'),
('Books', 'books', 'Books and educational materials')
ON CONFLICT (slug) DO NOTHING;