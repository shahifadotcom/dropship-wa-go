import { 
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  FileText,
  MessageSquare,
  Tags,
  Truck,
  CreditCard,
  Search,
  Globe,
  Bot,
  Building2,
  Palette,
  Flag,
  Bell,
  MapPin,
  Key,
  Zap,
  Image,
  Sparkles,
  Phone,
  Wallet,
  Target,
  ShoppingBag,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    { icon: Package, label: "Products", href: "/admin/products" },
    { icon: ShoppingCart, label: "Orders", href: "/admin/orders" },
    { icon: Star, label: "Reviews", href: "/admin/reviews" },
    { icon: Users, label: "Customers", href: "/admin/customers" },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    { icon: Tags, label: "Categories", href: "/admin/categories" },
    { icon: Flag, label: "Countries", href: "/admin/countries" },
    { icon: MapPin, label: "IP Ranges", href: "/admin/ip-ranges" },
    { icon: Building2, label: "Vendors", href: "/admin/vendors" },
    { icon: Package, label: "CJ Dropshipping", href: "/admin/cj-dropshipping" },
    { icon: ShoppingBag, label: "WooCommerce Keys", href: "/admin/woocommerce-keys" },
    { icon: Key, label: "OAuth Clients", href: "/admin/oauth-clients" },
    { icon: Bot, label: "Order Automation", href: "/admin/order-automation" },
    { icon: CreditCard, label: "Payment Methods", href: "/admin/payment-methods" },
    { icon: CreditCard, label: "Payment Gateways", href: "/admin/payment-gateways" },
    { icon: CreditCard, label: "Stripe", href: "/admin/stripe" },
    { icon: CreditCard, label: "SSLCommerz", href: "/admin/sslcommerz" },
    { icon: Truck, label: "Shipping", href: "/admin/shipping" },
    { icon: Globe, label: "Google Services", href: "/admin/google-services" },
    { icon: Search, label: "SEO & Search", href: "/admin/seo" },
    { icon: FileText, label: "Blog", href: "/admin/blog" },
    { icon: Image, label: "Storefront Slider", href: "/admin/storefront-slider" },
    { icon: Palette, label: "Theme", href: "/admin/theme" },
    { icon: Sparkles, label: "Virtual Trial", href: "/admin/virtual-trial" },
    { icon: Bot, label: "AI Settings", href: "/admin/ai-settings" },
    { icon: Target, label: "Ad Platforms", href: "/admin/ad-platforms" },
    { icon: Sparkles, label: "AI Ads Manager", href: "/admin/ai-ads" },
    { icon: Wallet, label: "Binance Pay", href: "/admin/binance-pay" },
    { icon: Phone, label: "Calling Subscriptions", href: "/admin/calling-subscriptions" },
    { icon: MessageSquare, label: "WhatsApp", href: "/admin/whatsapp" },
    { icon: Zap, label: "Vendor Automation", href: "/admin/vendor-automation" },
    { icon: Bell, label: "Notifications", href: "/admin/notifications" },
    { icon: FileText, label: "Reports", href: "/admin/reports" },
    { icon: Settings, label: "Settings", href: "/admin/settings" }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-navigation/20 z-40">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <Package className="h-8 w-8 text-navigation" />
          <span className="text-xl font-bold text-card-foreground">Admin Panel</span>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Button
                key={item.href}
                variant="ghost"
                onClick={() => navigate(item.href)}
                className={cn(
                  "w-full justify-start gap-3 h-10 text-card-foreground hover:bg-navigation/10 hover:text-navigation",
                  isActive && "bg-navigation/10 text-navigation"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-navigation/20">
        <div className="text-sm text-muted-foreground">
          <p>Store Analytics</p>
          <p className="text-xs">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;