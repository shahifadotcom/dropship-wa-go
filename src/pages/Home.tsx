import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import ImageSlider from "@/components/ImageSlider";
import ProductGrid from "@/components/ProductGrid";
import ProductCard from "@/components/ProductCard";
import ProductDetailModal from "@/components/ProductDetailModal";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { StorefrontSection } from "@/components/StorefrontSection";
import { useProducts } from "@/hooks/useProducts";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { Product } from "@/lib/types";
import { useCountryDetection } from "@/hooks/useCountryDetection";
import { CountrySelectionModal } from "@/components/CountrySelectionModal";
import { CountryService } from "@/services/countryService";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const Home = () => {
  const { 
    selectedCountry, 
    allCountries, 
    loading: countryLoading, 
    needsSelection,
    selectCountry,
    currency,
    countryId 
  } = useCountryDetection();
  
  const { products, loading: productsLoading } = useProducts(undefined, countryId);
  const { settings } = useStoreSettings();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [topDeals, setTopDeals] = useState<Product[]>([]);
  const [loadingTopDeals, setLoadingTopDeals] = useState(true);
  const navigate = useNavigate();

  // Load most ordered products for Top Deals
  useEffect(() => {
    const loadTopDeals = async () => {
      setLoadingTopDeals(true);
      const mostOrdered = await CountryService.getMostOrderedProducts(8, countryId);
      setTopDeals(mostOrdered);
      setLoadingTopDeals(false);
    };

    loadTopDeals();
  }, [countryId]);

  // Update document title when settings load
  useEffect(() => {
    if (settings?.site_title) {
      document.title = settings.site_title;
    }
  }, [settings?.site_title]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductModalOpen(true);
  };

  // Get latest products (first 8)
  const latestProducts = products.slice(0, 8);
  
  // Get featured products for 2-column sections
  const featuredProducts1 = products.slice(0, 2);

  // Show country selection modal if needed
  if (needsSelection && !countryLoading) {
    return (
      <CountrySelectionModal
        countries={allCountries}
        onSelect={selectCountry}
        open={needsSelection}
      />
    );
  }

  if (countryLoading || productsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pb-20 md:pb-0">
        {/* Desktop and Tablet Layout */}
        <div className="hidden md:block">
          <div className="container mx-auto px-4 py-8">
            {/* First 2-column products - Responsive */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredProducts1.map((product) => (
                  <div key={product.id} className="bg-card rounded-lg p-4 border border-navigation/20 hover:shadow-lg transition-shadow">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-48 md:h-64 object-cover rounded-lg mb-4"
                    />
                    <h3 className="font-semibold text-card-foreground mb-2 line-clamp-2">{product.name}</h3>
                    <p className="text-primary font-bold text-lg">{product.price.toFixed(2)} {currency}</p>
                    <Button 
                      onClick={() => handleProductClick(product)} 
                      className="w-full mt-3"
                      variant="outline"
                    >
                      Quick View
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Slider */}
            <div className="mb-8">
              <ImageSlider />
            </div>

            {/* Top Selling Products - Auto Scrolling Carousel */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Top Selling Products</h2>
              {loadingTopDeals ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  plugins={[
                    Autoplay({
                      delay: 3000,
                    }),
                  ]}
                  className="w-full"
                >
                  <CarouselContent>
                    {topDeals.map((product) => (
                      <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4">
                        <div className="p-1">
                          <ProductCard
                            product={product}
                            onQuickView={handleProductClick}
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              )}
            </div>

            {/* Responsive grid for latest products */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Latest Products</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {latestProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={handleProductClick}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Optimized */}
        <div className="md:hidden">
          <div className="px-4 py-4 space-y-6">
            {/* Mobile Image Slider */}
            <div>
              <ImageSlider />
            </div>

            {/* Mobile Latest Products - Horizontal Scroll */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Latest Products</h2>
              <div className="overflow-x-auto">
                <div className="flex gap-3 pb-4">
                  {products.slice(0, 12).map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-40">
                      <ProductCard
                        product={product}
                        onQuickView={handleProductClick}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mobile Grid Products - Perfect 2x4 alignment */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">All Products</h2>
              <div className="grid grid-cols-2 gap-3 items-start">
                {products.slice(12, 20).map((product) => (
                  <div key={product.id} className="flex">
                    <ProductCard
                      product={product}
                      onQuickView={handleProductClick}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Digital Products Section */}
        <StorefrontSection type="digital" title="Digital Products" limit={6} />

        {/* Print on Demand Section */}
        <StorefrontSection type="print_on_demand" title="Print on Demand" limit={6} />
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setSelectedProduct(null);
        }}
      />

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Home;