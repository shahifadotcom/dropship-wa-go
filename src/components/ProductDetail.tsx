import { useState } from 'react';
import { Heart, ShoppingCart, Star, Truck, Shield, RotateCcw, Share2, Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Product, ProductVariant } from '@/lib/types';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface ProductDetailProps {
  product: Product;
}

const ProductDetail = ({ product }: ProductDetailProps) => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const { addToCart } = useCart();
  const { toast } = useToast();

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const currentPrice = selectedVariant?.price || product.price;
  const currentStock = selectedVariant?.stockQuantity || product.stockQuantity;

  const handleAddToCart = () => {
    if (!product.inStock || currentStock < quantity) {
      toast({
        title: "Out of Stock",
        description: "This product is currently out of stock or you've selected more than available.",
        variant: "destructive"
      });
      return;
    }

    addToCart(product, quantity, selectedVariant);
    toast({
      title: "Added to Cart",
      description: `${quantity} ${product.name}${selectedVariant ? ` (${selectedVariant.value})` : ''} added to cart.`
    });
  };

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: isWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
      description: `${product.name} ${isWishlisted ? 'removed from' : 'added to'} your wishlist.`
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      {/* Product Images */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
          <img
            src={product.images[selectedImage]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Image Thumbnails */}
        {product.images.length > 1 && (
          <div className="grid grid-cols-4 gap-3">
            {product.images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                  selectedImage === index 
                    ? 'border-primary' 
                    : 'border-transparent hover:border-muted-foreground'
                }`}
              >
                <img
                  src={image}
                  alt={`${product.name} view ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        {/* Header */}
        <div>
          {product.brand && (
            <p className="text-sm font-medium text-muted-foreground mb-2">{product.brand}</p>
          )}
          <h1 className="text-2xl md:text-3xl font-bold mb-4">{product.name}</h1>
          
          {/* Rating */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(product.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviewCount} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl font-bold text-primary">
              ${currentPrice.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
            {discount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground">
                -{discount}% OFF
              </Badge>
            )}
          </div>
        </div>

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Select {product.variants[0].name}:</label>
            <Select onValueChange={(value) => {
              const variant = product.variants?.find(v => v.id === value);
              setSelectedVariant(variant);
            }}>
              <SelectTrigger>
                <SelectValue placeholder={`Choose ${product.variants[0].name}`} />
              </SelectTrigger>
              <SelectContent>
                {product.variants.map((variant) => (
                  <SelectItem key={variant.id} value={variant.id}>
                    {variant.value}
                    {variant.price && variant.price !== product.price && (
                      <span className="ml-2 text-muted-foreground">
                        (+${(variant.price - product.price).toFixed(2)})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Quantity */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Quantity:</label>
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            <span className="w-12 text-center font-medium">{quantity}</span>
            
            <Button
              size="icon"
              variant="outline"
              onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
              disabled={quantity >= currentStock}
            >
              <Plus className="h-4 w-4" />
            </Button>

            <span className="text-sm text-muted-foreground ml-4">
              {currentStock} available
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={handleAddToCart}
              disabled={!product.inStock || currentStock < 1}
              className="flex-1"
              size="lg"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={handleWishlistToggle}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current text-destructive' : ''}`} />
            </Button>
            
            <Button variant="outline" size="lg">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          <Button variant="secondary" size="lg" className="w-full">
            Buy Now
          </Button>
        </div>

        {/* Features */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-3 text-sm">
            <Truck className="h-4 w-4 text-muted-foreground" />
            <span>Free shipping on orders over $100</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
            <span>30-day return policy</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span>2-year warranty included</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;