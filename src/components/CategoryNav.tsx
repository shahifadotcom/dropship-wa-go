import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';

interface CategoryNavProps {
  categories: Category[];
  selectedCategory?: string;
  onCategorySelect: (categoryId: string | undefined) => void;
}

const CategoryNav = ({ categories, selectedCategory, onCategorySelect }: CategoryNavProps) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Subscribe to real-time category changes
    const channel = supabase
      .channel('category-nav-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'categories'
        },
        () => {
          // Categories will be refetched by parent component
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <Card className="sticky top-20">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Categories</h3>
            {selectedCategory && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCategorySelect(undefined)}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {/* All Products */}
            <Button
              variant={!selectedCategory ? "default" : "ghost"}
              className="w-full justify-between"
              onClick={() => onCategorySelect(undefined)}
            >
              All Products
              <Badge variant="secondary">
                {categories.reduce((sum, cat) => sum + cat.productCount, 0)}
              </Badge>
            </Button>

            {/* Categories */}
            {categories.map((category) => (
              <div key={category.id} className="space-y-1">
                <Collapsible
                  open={expandedCategories.has(category.id)}
                  onOpenChange={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center">
                    <Button
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      className="flex-1 justify-between"
                      onClick={() => onCategorySelect(category.id)}
                    >
                      <span>{category.name}</span>
                      <Badge variant="secondary">
                        {category.productCount}
                      </Badge>
                    </Button>
                    
                    {category.subcategories && category.subcategories.length > 0 && (
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="ml-1 p-1">
                          {expandedCategories.has(category.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    )}
                  </div>

                  {category.subcategories && (
                    <CollapsibleContent className="space-y-1 ml-4">
                      {category.subcategories.map((subcategory) => (
                        <Button
                          key={subcategory.id}
                          variant={selectedCategory === subcategory.id ? "default" : "ghost"}
                          size="sm"
                          className="w-full justify-between text-sm"
                          onClick={() => onCategorySelect(subcategory.id)}
                        >
                          <span>{subcategory.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {subcategory.productCount}
                          </Badge>
                        </Button>
                      ))}
                    </CollapsibleContent>
                  )}
                </Collapsible>
              </div>
            ))}
          </div>

          {/* Quick Filters */}
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-3">Quick Filters</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {/* Add sale filter logic */}}
              >
                🏷️ On Sale
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {/* Add new arrivals filter logic */}}
              >
                ✨ New Arrivals
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {/* Add bestsellers filter logic */}}
              >
                🔥 Best Sellers
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {/* Add free shipping filter logic */}}
              >
                🚚 Free Shipping
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryNav;