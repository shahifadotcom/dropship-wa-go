import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/lib/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id(name, slug),
          subcategories:subcategory_id(name, slug),
          product_variants(*)
        `);
      
      if (error) throw error;
      
      const mappedProducts = data.map((product): Product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: Number(product.price),
        originalPrice: product.original_price ? Number(product.original_price) : undefined,
        images: product.images || [],
        category: product.categories?.slug || '',
        subcategory: product.subcategories?.slug,
        brand: product.brand,
        inStock: product.in_stock,
        stockQuantity: product.stock_quantity,
        sku: product.sku,
        tags: product.tags || [],
        rating: Number(product.rating),
        reviewCount: product.review_count,
        createdAt: new Date(product.created_at),
        updatedAt: new Date(product.updated_at),
        variants: product.product_variants?.map(variant => ({
          id: variant.id,
          name: variant.name,
          value: variant.value,
          price: variant.price ? Number(variant.price) : undefined,
          stockQuantity: variant.stock_quantity,
          sku: variant.sku
        }))
      }));
      
      setProducts(mappedProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, error, refetch: fetchProducts };
}

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories:category_id(name, slug),
            subcategories:subcategory_id(name, slug),
            product_variants(*)
          `)
          .eq('id', id)
          .single();
        
        if (error) throw error;
        
        const mappedProduct: Product = {
          id: data.id,
          name: data.name,
          description: data.description,
          price: Number(data.price),
          originalPrice: data.original_price ? Number(data.original_price) : undefined,
          images: data.images || [],
          category: data.categories?.slug || '',
          subcategory: data.subcategories?.slug,
          brand: data.brand,
          inStock: data.in_stock,
          stockQuantity: data.stock_quantity,
          sku: data.sku,
          tags: data.tags || [],
          rating: Number(data.rating),
          reviewCount: data.review_count,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          variants: data.product_variants?.map(variant => ({
            id: variant.id,
            name: variant.name,
            value: variant.value,
            price: variant.price ? Number(variant.price) : undefined,
            stockQuantity: variant.stock_quantity,
            sku: variant.sku
          }))
        };
        
        setProduct(mappedProduct);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  return { product, loading, error };
}