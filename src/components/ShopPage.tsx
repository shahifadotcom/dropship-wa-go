import { useEffect, useState, useMemo } from 'react';
import Header from '@/components/Header';
import CategoryNav from '@/components/CategoryNav';
import ProductGrid from '@/components/ProductGrid';
import { FilterOptions } from '@/lib/types';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useCountryDetection } from '@/hooks/useCountryDetection';

export default function ShopPage() {
  const { effectiveCountry } = useCountryDetection();
  const { products, loading: productsLoading } = useProducts(undefined, effectiveCountry?.id);
  const { categories, loading: categoriesLoading } = useCategories();
  
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'newest'
  });

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(product => 
        product.category === filters.category || product.subcategory === filters.category
      );
    }

    // Filter by price range
    if (filters.priceRange) {
      filtered = filtered.filter(product => 
        product.price >= filters.priceRange![0] && product.price <= filters.priceRange![1]
      );
    }

    // Filter by brand
    if (filters.brand && filters.brand.length > 0) {
      filtered = filtered.filter(product => 
        product.brand && filters.brand!.includes(product.brand)
      );
    }

    // Filter by stock
    if (filters.inStock !== undefined) {
      filtered = filtered.filter(product => product.inStock === filters.inStock);
    }

    // Filter by rating
    if (filters.rating) {
      filtered = filtered.filter(product => product.rating >= filters.rating!);
    }

    return filtered;
  }, [products, filters]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleCategorySelect = (categorySlug: string) => {
    setFilters(prev => ({ ...prev, category: categorySlug }));
  };

  const getPageTitle = () => {
    if (filters.category) {
      const category = categories.find(cat => cat.slug === filters.category);
      if (category) return category.name;
      
      // Check subcategories
      for (const cat of categories) {
        const subcat = cat.subcategories?.find(sub => sub.slug === filters.category);
        if (subcat) return subcat.name;
      }
    }
    return 'All Products';
  };

  if (productsLoading || categoriesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <CategoryNav 
          categories={categories} 
          onCategorySelect={handleCategorySelect}
          selectedCategory={filters.category}
        />
        <div className="flex gap-8 mt-6">
          <div className="flex-1">
            <ProductGrid
              products={filteredProducts}
              filters={filters}
              onFilterChange={handleFilterChange}
              title={getPageTitle()}
              showFilters={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}