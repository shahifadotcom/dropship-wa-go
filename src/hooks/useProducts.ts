import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { fetchProducts, fetchProductsByCategory } from '@/lib/services/database';

export const useProducts = (categorySlug?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = categorySlug 
          ? await fetchProductsByCategory(categorySlug)
          : await fetchProducts();
        setProducts(data);
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [categorySlug]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = categorySlug 
        ? await fetchProductsByCategory(categorySlug)
        : await fetchProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { products, loading, error, refetch: loadProducts };
};