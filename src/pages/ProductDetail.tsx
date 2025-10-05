import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Product } from '@/lib/types';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useCountryDetection } from '@/hooks/useCountryDetection';
import { VirtualTryOn } from '@/components/VirtualTryOn';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Heart, ArrowLeft } from 'lucide-react';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [virtualTrialEnabled, setVirtualTrialEnabled] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { currency } = useCountryDetection();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, virtual_trial_enabled')
          .eq('slug', slug)
          .single();

        if (error) throw error;
        
        if (data) {
          setVirtualTrialEnabled(data.virtual_trial_enabled || false);
          setProduct({
            id: data.id,
            name: data.name,
            description: data.description,
            price: data.price,
            originalPrice: data.original_price,
            images: data.images || [],
            category: data.category_id,
            subcategory: data.subcategory_id,
            inStock: data.in_stock,
            stockQuantity: data.stock_quantity,
            rating: data.rating,
            reviewCount: data.review_count,
            sku: data.sku,
            slug: data.slug,
            brand: data.brand,
            tags: data.tags || [],
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Error',
          description: 'Failed to load product details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!product.inStock) {
      toast({
        title: 'Out of Stock',
        description: 'This product is currently out of stock.',
        variant: 'destructive',
      });
      return;
    }

    addToCart(product);
    toast({
      title: 'Added to Cart',
      description: `${product.name} has been added to your cart.`,
    });
  };

  const handleBuyNow = () => {
    if (!product.inStock) {
      toast({
        title: 'Out of Stock',
        description: 'This product is currently out of stock.',
        variant: 'destructive',
      });
      return;
    }

    addToCart(product);
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-muted">
              <img
                src={product.images[selectedImage] || product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImage === index
                        ? 'border-primary'
                        : 'border-transparent'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div className="space-y-6">
            {product.brand && (
              <p className="text-sm text-muted-foreground">{product.brand}</p>
            )}
            
            <h1 className="text-3xl font-bold">{product.name}</h1>

            <div className="flex items-center gap-4">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({product.reviewCount} reviews)
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-primary">
                  {product.price.toFixed(2)} {currency}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">
                      {product.originalPrice.toFixed(2)} {currency}
                    </span>
                    {discount > 0 && (
                      <Badge className="bg-destructive text-destructive-foreground">
                        -{discount}%
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-semibold">SKU:</span> {product.sku}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Stock:</span>{' '}
                {product.inStock ? (
                  <span className="text-green-600">{product.stockQuantity} in stock</span>
                ) : (
                  <span className="text-destructive">Out of stock</span>
                )}
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed">
              {product.description}
            </p>

            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              {virtualTrialEnabled && product.images.length > 0 && (
                <div className="w-full mb-4">
                  <VirtualTryOn
                    productId={product.id}
                    productImage={product.images[0]}
                    productName={product.name}
                  />
                </div>
              )}
              
              <Button
                onClick={handleAddToCart}
                disabled={!product.inStock}
                size="lg"
                variant="outline"
                className="flex-1"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              
              <Button
                onClick={handleBuyNow}
                disabled={!product.inStock}
                size="lg"
                className="flex-1"
              >
                Buy Now
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default ProductDetail;
