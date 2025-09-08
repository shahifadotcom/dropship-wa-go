import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { CountryService } from '@/services/countryService';

export const useProducts = (categorySlug?: string, countryId?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await CountryService.getProductsByCountry(countryId);
        setProducts(data);
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [categorySlug, countryId]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await CountryService.getProductsByCountry(countryId);
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