import { ShoppingCart, Search, Menu, User, Heart, Package, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CartDrawer from "./CartDrawer";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-navigation border-b border-navigation/20">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="md:hidden text-navigation-foreground hover:bg-navigation/80">
              <Menu className="h-5 w-5" />
            </Button>
            <a href="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-navigation-foreground" />
              <span className="text-xl font-bold text-navigation-foreground">
                DropshipPro
              </span>
            </a>
          </div>

          {/* Search Bar - Center */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-navigation-foreground/70" />
              <Input
                placeholder="Search products..."
                className="pl-10 bg-background/10 border-navigation-foreground/20 text-navigation-foreground placeholder:text-navigation-foreground/70"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-navigation-foreground hover:bg-navigation/80">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')}>
                    Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="icon" onClick={() => navigate('/auth')} className="text-navigation-foreground hover:bg-navigation/80">
                <User className="h-5 w-5" />
              </Button>
            )}
            <CartDrawer>
              <Button variant="ghost" size="icon" className="relative text-navigation-foreground hover:bg-navigation/80">
                <ShoppingCart className="h-5 w-5" />
              </Button>
            </CartDrawer>
          </div>
        </div>

        {/* Desktop Navigation Menu */}
        <div className="hidden md:block">
          <nav className="flex items-center justify-center space-x-8 py-2 border-t border-navigation-foreground/20">
            <a href="/" className="text-navigation-foreground hover:text-navigation-foreground/80 transition-colors">
              Home
            </a>
            <a href="/shop" className="text-navigation-foreground hover:text-navigation-foreground/80 transition-colors">
              Shop
            </a>
            <a href="/categories" className="text-navigation-foreground hover:text-navigation-foreground/80 transition-colors">
              Categories
            </a>
            <a href="/deals" className="text-navigation-foreground hover:text-navigation-foreground/80 transition-colors">
              Deals
            </a>
            <a href="/contact" className="text-navigation-foreground hover:text-navigation-foreground/80 transition-colors">
              Contact
            </a>
          </nav>
        </div>

        {/* Mobile Search - Only visible on mobile */}
        <div className="md:hidden pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-navigation-foreground/70" />
            <Input
              placeholder="Search products..."
              className="pl-10 bg-background/10 border-navigation-foreground/20 text-navigation-foreground placeholder:text-navigation-foreground/70"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;