import Header from "@/components/Header";
import ImageSlider from "@/components/ImageSlider";
import ProductGrid from "@/components/ProductGrid";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { products } from "@/lib/data/products";

const Home = () => {
  // Get latest products (first 8)
  const latestProducts = products.slice(0, 8);
  
  // Get featured products for 2-column sections
  const featuredProducts1 = products.slice(8, 10);
  const featuredProducts2 = products.slice(10, 12);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pb-20 md:pb-0">
        {/* Desktop Layout */}
        <div className="hidden md:block">
          <div className="container mx-auto px-4 py-8">
            {/* First 2-column products */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Featured Products</h2>
              <div className="grid grid-cols-2 gap-6">
                {featuredProducts1.map((product) => (
                  <div key={product.id} className="bg-card rounded-lg p-4 border border-navigation/20">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <h3 className="font-semibold text-card-foreground mb-2">{product.name}</h3>
                    <p className="text-primary font-bold">${product.price}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Image Slider */}
            <div className="mb-8">
              <ImageSlider />
            </div>

            {/* Second 2-column products */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Top Deals</h2>
              <div className="grid grid-cols-2 gap-6">
                {featuredProducts2.map((product) => (
                  <div key={product.id} className="bg-card rounded-lg p-4 border border-navigation/20">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <h3 className="font-semibold text-card-foreground mb-2">{product.name}</h3>
                    <p className="text-primary font-bold">${product.price}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4-column latest products */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">Latest Products</h2>
              <div className="grid grid-cols-4 gap-6">
                {latestProducts.map((product) => (
                  <div key={product.id} className="bg-card rounded-lg p-4 border border-navigation/20">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                    <h3 className="font-medium text-sm text-card-foreground mb-2">{product.name}</h3>
                    <p className="text-primary font-bold text-sm">${product.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden">
          <div className="px-4 py-4">
            {/* 2x4 grid with horizontal scroll */}
            <h2 className="text-xl font-bold text-foreground mb-4">Latest Products</h2>
            <div className="overflow-x-auto">
              <div className="grid grid-rows-2 grid-flow-col gap-4 w-max">
                {products.slice(0, 16).map((product, index) => (
                  <div key={product.id} className="w-40 bg-card rounded-lg p-3 border border-navigation/20">
                    <img 
                      src={product.images[0]} 
                      alt={product.name}
                      className="w-full h-24 object-cover rounded-lg mb-2"
                    />
                    <h3 className="font-medium text-xs text-card-foreground mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-primary font-bold text-sm">${product.price}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default Home;