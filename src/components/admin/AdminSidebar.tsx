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
  CreditCard
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
    { icon: Users, label: "Customers", href: "/admin/customers" },
    { icon: BarChart3, label: "Analytics", href: "/admin/analytics" },
    { icon: Tags, label: "Categories", href: "/admin/categories" },
    { icon: CreditCard, label: "Payment Gateways", href: "/admin/payment-gateways" },
    { icon: Truck, label: "Shipping", href: "/admin/shipping" },
    { icon: MessageSquare, label: "WhatsApp", href: "/whatsapp-setup" },
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