import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Category } from '@/lib/types';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .is('parent_id', null);
      
      if (error) throw error;
      
      // Get subcategories for each category
      const categoriesWithSubs = await Promise.all(
        data.map(async (category) => {
          const { data: subcategories } = await supabase
            .from('categories')
            .select('*')
            .eq('parent_id', category.id);
          
          return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            image: category.image,
            productCount: category.product_count,
            subcategories: subcategories?.map(sub => ({
              id: sub.id,
              name: sub.name,
              slug: sub.slug,
              productCount: sub.product_count
            })) || []
          } as Category;
        })
      );
      
      setCategories(categoriesWithSubs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return { categories, loading, error, refetch: fetchCategories };
}

export function useCategory(slug: string) {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;

    const fetchCategory = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .single();
        
        if (error) throw error;
        
        setCategory({
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description,
          image: data.image,
          productCount: data.product_count
        } as Category);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch category');
      } finally {
        setLoading(false);
      }
    };

    fetchCategory();
  }, [slug]);

  return { category, loading, error };
}