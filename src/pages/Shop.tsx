import { useState, useMemo } from 'react';
import { products, categories } from '@/lib/data/products';
import { FilterOptions } from '@/lib/types';
import CategoryNav from '@/components/CategoryNav';
import ProductGrid from '@/components/ProductGrid';
import Header from '@/components/Header';

const Shop = () => {
  const [filters, setFilters] = useState<FilterOptions>({});

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(product => 
        product.category === filters.category || 
        product.subcategory === filters.category
      );
    }

    // Filter by price range
    if (filters.priceRange) {
      filtered = filtered.filter(product => 
        product.price >= filters.priceRange![0] && 
        product.price <= filters.priceRange![1]
      );
    }

    // Filter by brand
    if (filters.brand && filters.brand.length > 0) {
      filtered = filtered.filter(product => 
        product.brand && filters.brand!.includes(product.brand)
      );
    }

    // Filter by stock
    if (filters.inStock) {
      filtered = filtered.filter(product => product.inStock);
    }

    // Filter by rating
    if (filters.rating) {
      filtered = filtered.filter(product => product.rating >= filters.rating!);
    }

    return filtered;
  }, [filters]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  const handleCategorySelect = (categoryId: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      category: categoryId
    }));
  };

  const getPageTitle = () => {
    if (filters.category) {
      const selectedCategory = categories
        .flatMap(cat => [cat, ...(cat.subcategories || [])])
        .find(cat => cat.id === filters.category);
      return selectedCategory?.name || 'Shop';
    }
    return 'All Products';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <CategoryNav
              categories={categories}
              selectedCategory={filters.category}
              onCategorySelect={handleCategorySelect}
            />
          </div>

          {/* Main Content */}
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
};

export default Shop;