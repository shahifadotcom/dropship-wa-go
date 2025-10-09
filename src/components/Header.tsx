import { ShoppingCart, Search, Menu, User, Heart, Package, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useStoreSettings } from "@/hooks/useStoreSettings";
import { useCategories } from "@/hooks/useCategories";
import CartDrawer from "./CartDrawer";
import { CountrySelectorDropdown } from "./CountrySelectorDropdown";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { settings } = useStoreSettings();
  const { categories } = useCategories();
  const { countryCode = 'bd' } = useParams<{ countryCode: string }>();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-navigation border-b border-navigation/20 shadow-md">
      <div className="container mx-auto px-4">
        {/* Mobile Header */}
        <div className="flex md:hidden items-center justify-between h-16 gap-4">
          {/* Store Logo */}
          <a href="/" className="flex items-center space-x-2 flex-shrink-0">
            {settings?.store_logo ? (
              <img 
                src={settings.store_logo} 
                alt={settings.store_name || 'Store Logo'} 
                className="h-10 max-w-[120px] object-contain"
              />
            ) : (
              <Package className="h-8 w-8 text-navigation-foreground" />
            )}
            {settings?.store_name && (
              <span className="text-lg font-bold text-navigation-foreground">
                {settings.store_name}
              </span>
            )}
          </a>

          {/* Mobile Search Box */}
          <div className="flex-1 max-w-sm mx-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-navigation-foreground/70" />
              <Input
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-background/10 border border-navigation-foreground/20 rounded-lg text-navigation-foreground placeholder:text-navigation-foreground/70 text-sm h-10"
              />
            </div>
          </div>

          {/* Cart Icon */}
          <CartDrawer>
            <Button variant="ghost" size="icon" className="relative text-navigation-foreground hover:bg-navigation/10 rounded-lg flex-shrink-0">
              <ShoppingCart className="h-6 w-6" />
            </Button>
          </CartDrawer>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <a href="/" className="flex items-center space-x-2">
              {settings?.store_logo ? (
                <img 
                  src={settings.store_logo} 
                  alt={settings.store_name || 'Store Logo'} 
                  className="h-12 max-w-[200px] object-contain"
                />
              ) : (
                <Package className="h-10 w-10 text-navigation-foreground" />
              )}
              {settings?.store_name && (
                <span className="text-xl font-bold text-navigation-foreground">
                  {settings.store_name}
                </span>
              )}
            </a>
          </div>

          {/* Desktop Search Bar */}
          <div className="flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-navigation-foreground/70" />
              <Input
                placeholder="Search products..."
                className="pl-10 bg-background/10 border-navigation-foreground/20 text-navigation-foreground placeholder:text-navigation-foreground/70"
              />
            </div>
          </div>

          {/* Desktop User Actions */}
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
          <nav className="flex items-center justify-center space-x-8 py-3 border-t border-navigation-foreground/20">
            <a href={`/${countryCode}`} className="text-navigation-foreground hover:text-navigation-foreground/80 transition-colors font-medium">
              Home
            </a>
            <a href={`/${countryCode}/blog`} className="text-navigation-foreground hover:text-navigation-foreground/80 transition-colors font-medium">
              Blog
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-navigation-foreground hover:text-navigation-foreground/80 transition-colors font-medium flex items-center gap-1">
                  Categories
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 bg-background z-50">
                {categories.map((category) => (
                  <DropdownMenuItem 
                    key={category.id}
                    onClick={() => navigate(`/category/${category.slug}`)}
                    className="cursor-pointer"
                  >
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <a href="https://wa.me/+8801775777308" target="_blank" rel="noopener noreferrer" className="text-navigation-foreground hover:text-navigation-foreground/80 transition-colors font-medium">
              Contact
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;