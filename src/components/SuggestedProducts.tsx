import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/lib/types';
import { useCountryDetection } from '@/hooks/useCountryDetection';

interface DBProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  in_stock: boolean;
  slug: string;
  product_type?: string;
  description?: string;
}

interface SuggestedProductsProps {
  currentProductIds?: string[];
  categoryId?: string;
  limit?: number;
}

export function SuggestedProducts({ currentProductIds = [], categoryId, limit = 8 }: SuggestedProductsProps) {
  const [products, setProducts] = useState<DBProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const { countryId } = useCountryDetection();

  useEffect(() => {
    loadSuggestedProducts();
  }, [currentProductIds, categoryId, countryId]);

  // Auto-scroll functionality
  useEffect(() => {
    const container = document.getElementById('suggested-products-scroll');
    if (!container || products.length === 0) return;

    let scrollInterval: NodeJS.Timeout;
    let isScrolling = true;
    let direction: 'right' | 'left' = 'right';

    const autoScroll = () => {
      if (!isScrolling) return;

      const maxScroll = container.scrollWidth - container.clientWidth;
      const currentScroll = container.scrollLeft;

      if (direction === 'right') {
        if (currentScroll >= maxScroll - 10) {
          direction = 'left';
        } else {
          container.scrollTo({ left: currentScroll + 2, behavior: 'smooth' });
        }
      } else {
        if (currentScroll <= 10) {
          direction = 'right';
        } else {
          container.scrollTo({ left: currentScroll - 2, behavior: 'smooth' });
        }
      }
    };

    scrollInterval = setInterval(autoScroll, 30);

    // Pause on hover
    const pauseScroll = () => { isScrolling = false; };
    const resumeScroll = () => { isScrolling = true; };

    container.addEventListener('mouseenter', pauseScroll);
    container.addEventListener('mouseleave', resumeScroll);

    return () => {
      clearInterval(scrollInterval);
      container.removeEventListener('mouseenter', pauseScroll);
      container.removeEventListener('mouseleave', resumeScroll);
    };
  }, [products]);

  const loadSuggestedProducts = async () => {
    // Don't load anything until country is selected
    if (!countryId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('id, name, price, images, in_stock, slug, product_type, description, country_id')
        .eq('in_stock', true)
        .eq('country_id', countryId) // Force country filtering
        .limit(limit);

      // Exclude current products in cart
      if (currentProductIds.length > 0) {
        query = query.not('id', 'in', `(${currentProductIds.join(',')})`);
      }

      // Filter by category if provided
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      // Order by rating or created date
      query = query.order('rating', { ascending: false, nullsFirst: false });

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading suggested products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: DBProduct) => {
    try {
      const fullProduct: Product = {
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.images,
        description: product.description || '',
        category: '',
        inStock: product.in_stock,
        stockQuantity: 1,
        sku: product.slug || product.id,
        slug: product.slug,
        tags: [],
        rating: 0,
        reviewCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      addToCart(fullProduct, 1);

      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error('Failed to add product to cart');
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('suggested-products-scroll');
    if (!container) return;

    const scrollAmount = 300;
    const newPosition = direction === 'left' 
      ? Math.max(0, scrollPosition - scrollAmount)
      : Math.min(container.scrollWidth - container.clientWidth, scrollPosition + scrollAmount);

    container.scrollTo({ left: newPosition, behavior: 'smooth' });
    setScrollPosition(newPosition);
  };

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>You May Also Like</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll('left')}
              disabled={scrollPosition === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scroll('right')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div
          id="suggested-products-scroll"
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="flex-none w-48 group cursor-pointer"
            >
              <div
                onClick={() => navigate(`/products/${product.slug}`)}
                className="relative aspect-square mb-2 overflow-hidden rounded-lg bg-muted"
              >
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {product.product_type && product.product_type !== 'physical' && (
                  <Badge
                    variant="secondary"
                    className="absolute top-2 right-2 text-xs"
                  >
                    {product.product_type === 'digital' ? 'Digital' : 'Print on Demand'}
                  </Badge>
                )}
              </div>
              <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
              <p className="text-sm font-semibold mb-2">${product.price.toFixed(2)}</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product);
                }}
              >
                <ShoppingCart className="h-3 w-3 mr-1" />
                Add to Cart
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
