import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PixelTracker from "@/components/PixelTracker";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import { useEffect } from "react";
import { initializeAndroidAuth } from "./utils/androidAuthBridge";
import { FaviconUpdater } from "@/components/FaviconUpdater";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { CallButton } from "@/components/calling/CallButton";
import Index from "./pages/Index";
import Home from "./pages/Home";

import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import Categories from "./pages/admin/Categories";
import Settings from "./pages/admin/Settings";
import Customers from "./pages/admin/Customers";
import Analytics from "./pages/admin/Analytics";
import Shipping from "./pages/admin/Shipping";
import Reports from "./pages/admin/Reports";
import PaymentGateways from "./pages/admin/PaymentGateways";
import GoogleServices from "./pages/admin/GoogleServices";
import SEO from "./pages/admin/SEO";
import Vendors from "./pages/admin/Vendors";
import PaymentMethods from "./pages/admin/PaymentMethods";
import OrderAutomation from "./pages/admin/OrderAutomation";
import UserDashboard from "./pages/Dashboard";
import AndroidApp from "./pages/AndroidApp";
import WCAuth from "./pages/WCAuth";
import NotFound from "./pages/NotFound";
import ErrorLogger from "./components/ErrorLogger";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import Theme from "./pages/admin/Theme";
import IPRanges from "./pages/admin/IPRanges";
import Countries from "./pages/admin/Countries";
import Notifications from "./pages/admin/Notifications";
import CJDropshipping from "./pages/admin/CJDropshipping";
import OAuthClients from "./pages/admin/OAuthClients";
import CJOAuthCallback from "./pages/CJOAuthCallback";
import WhatsApp from "./pages/admin/WhatsApp";
import VendorAutomation from "./pages/admin/VendorAutomation";
import StorefrontSlider from "./pages/admin/StorefrontSlider";
import VirtualTrial from "./pages/admin/VirtualTrial";
import ProductDetail from "./pages/ProductDetail";
import Calling from "./pages/Calling";
import CallingSubscriptions from "./pages/admin/CallingSubscriptions";
import SSLCommerz from "./pages/admin/SSLCommerz";
import Sitemap from "./pages/Sitemap";
import RobotsTxt from "./pages/RobotsTxt";
import AdminBlog from "./pages/admin/Blog";
import AISettings from "./pages/admin/AISettings";
import WooCommerceKeys from "./pages/admin/WooCommerceKeys";
import AdPlatforms from "./pages/admin/AdPlatforms";
import AIAdsManager from "./pages/admin/AIAdsManager";
import BinancePay from "./pages/admin/BinancePay";
import Stripe from "./pages/admin/Stripe";
import Reviews from "./pages/admin/Reviews";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize Android auth bridge if running in WebView
    initializeAndroidAuth();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <ErrorLogger />
          <FaviconUpdater />
          <GoogleAnalytics />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PixelTracker />
            <CallButton />
            <Routes>
              {/* Country-based routes */}
              <Route path="/:countryCode" element={<Home />} />
              <Route path="/:countryCode/blog" element={<Blog />} />
              <Route path="/:countryCode/blog/:slug" element={<BlogPost />} />
              <Route path="/:countryCode/products/:slug" element={<ProductDetail />} />
              <Route path="/:countryCode/checkout" element={<Checkout />} />
              
              {/* Legacy routes without country code - redirect to country selection */}
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              
              <Route path="/auth" element={<Auth />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success/:orderId" element={<OrderSuccess />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/categories" element={<Categories />} />
              <Route path="/admin/customers" element={<Customers />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/shipping" element={<Shipping />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/payment-gateways" element={<PaymentGateways />} />
              <Route path="/admin/vendors" element={<Vendors />} />
              <Route path="/admin/oauth-clients" element={<OAuthClients />} />
              <Route path="/admin/woocommerce-keys" element={<WooCommerceKeys />} />
              <Route path="/admin/payment-methods" element={<PaymentMethods />} />
              <Route path="/admin/order-automation" element={<OrderAutomation />} />
              <Route path="/admin/google-services" element={<GoogleServices />} />
              <Route path="/admin/seo" element={<SEO />} />
              <Route path="/admin/theme" element={<Theme />} />
              <Route path="/admin/countries" element={<Countries />} />
              <Route path="/admin/ip-ranges" element={<IPRanges />} />
              <Route path="/admin/notifications" element={<Notifications />} />
              <Route path="/admin/whatsapp" element={<WhatsApp />} />
              <Route path="/admin/vendor-automation" element={<VendorAutomation />} />
              <Route path="/admin/storefront-slider" element={<StorefrontSlider />} />
              <Route path="/admin/virtual-trial" element={<VirtualTrial />} />
              <Route path="/admin/calling-subscriptions" element={<CallingSubscriptions />} />
              <Route path="/admin/blog" element={<AdminBlog />} />
          <Route path="/admin/ai-settings" element={<AISettings />} />
          <Route path="/admin/ad-platforms" element={<AdPlatforms />} />
          <Route path="/admin/ai-ads" element={<AIAdsManager />} />
              <Route path="/admin/binance-pay" element={<BinancePay />} />
              <Route path="/admin/stripe" element={<Stripe />} />
              <Route path="/admin/sslcommerz" element={<SSLCommerz />} />
              <Route path="/admin/reviews" element={<Reviews />} />
              
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/android-app" element={<AndroidApp />} />
              <Route path="/calling" element={<Calling />} />
              
              {/* SEO Routes */}
              <Route path="/sitemap.xml" element={<Sitemap />} />
              <Route path="/robots.txt" element={<RobotsTxt />} />
              
        <Route path="/wc-auth/v1/authorize" element={<WCAuth />} />
        <Route path="/wp-json/*" element={<WCAuth />} />
        <Route path="/wc/v3/*" element={<WCAuth />} />
        <Route path="/cj-oauth-callback" element={<CJOAuthCallback />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
