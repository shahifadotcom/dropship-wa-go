import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <ErrorLogger />
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
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
              
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/android-app" element={<AndroidApp />} />
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

export default App;
