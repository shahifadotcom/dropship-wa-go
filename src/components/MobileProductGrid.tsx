import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCountryDetection } from '@/hooks/useCountryDetection';
import { ShoppingCart, Heart } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating?: number;
}

interface MobileProductGridProps {
  title: string;
  products: Product[];
}

const MobileProductGrid: React.FC<MobileProductGridProps> = ({ title, products }) => {
  const navigate = useNavigate();
  const { currency } = useCountryDetection();

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const addToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    // Cart logic here
    console.log('Added to cart:', product);
  };

  const toggleWishlist = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    // Wishlist logic here
    console.log('Added to wishlist:', product);
  };

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
        <Button variant="ghost" size="sm" className="text-primary">
          View All
        </Button>
      </div>
      
      {/* 2x4 Horizontal Scrollable Grid */}
      <div className="relative">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-4" style={{ width: 'max-content' }}>
            {/* Create pairs of products for 2 rows */}
            {Array.from({ length: Math.ceil(products.length / 2) }, (_, colIndex) => (
              <div key={colIndex} className="flex flex-col gap-3">
                {/* Top product */}
                {products[colIndex * 2] && (
                  <ProductCard
                    product={products[colIndex * 2]}
                    currency={currency}
                    onProductClick={handleProductClick}
                    onAddToCart={addToCart}
                    onToggleWishlist={toggleWishlist}
                  />
                )}
                
                {/* Bottom product */}
                {products[colIndex * 2 + 1] && (
                  <ProductCard
                    product={products[colIndex * 2 + 1]}
                    currency={currency}
                    onProductClick={handleProductClick}
                    onAddToCart={addToCart}
                    onToggleWishlist={toggleWishlist}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none flex items-center justify-center">
          <div className="w-1 h-8 bg-primary/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  currency: string;
  onProductClick: (id: string) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onToggleWishlist: (product: Product, e: React.MouseEvent) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  currency,
  onProductClick,
  onAddToCart,
  onToggleWishlist
}) => {
  return (
    <div 
      className="bg-card border border-border rounded-xl p-3 cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-102 w-40"
      onClick={() => onProductClick(product.id)}
    >
      {/* Product Image */}
      <div className="relative mb-3">
        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            loading="lazy"
          />
        </div>
        
        {/* Wishlist Button */}
        <button
          onClick={(e) => onToggleWishlist(product, e)}
          className="absolute top-2 right-2 w-7 h-7 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
        >
          <Heart className="w-4 h-4 text-muted-foreground hover:text-red-500" />
        </button>

        {/* Discount Badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-md text-xs font-medium">
            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        <h3 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
          {product.name}
        </h3>
        
        {/* Category */}
        <p className="text-xs text-muted-foreground">{product.category}</p>
        
        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={`text-xs ${
                    i < Math.floor(product.rating!)
                      ? 'text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({product.rating})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-primary">
            {currency} {product.price.toFixed(2)}
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {currency} {product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart Button */}
        <Button
          size="sm"
          className="w-full h-8 text-xs bg-primary hover:bg-primary/90"
          onClick={(e) => onAddToCart(product, e)}
        >
          <ShoppingCart className="w-3 h-3 mr-1" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
};

export default MobileProductGrid;