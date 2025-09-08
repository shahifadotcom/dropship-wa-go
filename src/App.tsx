import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Home from "./pages/Home";
import ShopPage from "./components/ShopPage";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import Orders from "./pages/admin/Orders";
import Categories from "./pages/admin/Categories";
import Settings from "./pages/admin/Settings";
import Customers from "./pages/admin/Customers";
import Analytics from "./pages/admin/Analytics";
import Shipping from "./pages/admin/Shipping";
import Reports from "./pages/admin/Reports";
import PaymentGateways from "./pages/admin/PaymentGateways";
import GoogleServices from "./pages/admin/GoogleServices";
import SEO from "./pages/admin/SEO";
import UserDashboard from "./pages/Dashboard";
import WhatsAppSetup from "./pages/WhatsAppSetup";
import AndroidApp from "./pages/AndroidApp";
import NotFound from "./pages/NotFound";
import ErrorLogger from "./components/ErrorLogger";

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
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success/:orderId" element={<OrderSuccess />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/orders" element={<Orders />} />
              <Route path="/admin/categories" element={<Categories />} />
              <Route path="/admin/customers" element={<Customers />} />
              <Route path="/admin/analytics" element={<Analytics />} />
              <Route path="/admin/shipping" element={<Shipping />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/payment-gateways" element={<PaymentGateways />} />
              <Route path="/admin/google-services" element={<GoogleServices />} />
              <Route path="/admin/seo" element={<SEO />} />
              <Route path="/admin/whatsapp" element={<WhatsAppSetup />} />
              
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/whatsapp-setup" element={<WhatsAppSetup />} />
              <Route path="/android-app" element={<AndroidApp />} />
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
