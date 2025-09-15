import { Home, Grid3X3, MessageCircle, User, Share2, Facebook, Instagram, Twitter, Youtube, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);

  const categories = [
    "Electronics", "Fashion", "Home & Garden", "Sports & Outdoors", 
    "Beauty & Health", "Toys & Games", "Books & Media", "Automotive"
  ];

  const socialMedia = [
    { name: "Facebook", url: "https://facebook.com/yourstore", icon: Facebook, color: "#1877F2" },
    { name: "Instagram", url: "https://instagram.com/yourstore", icon: Instagram, color: "#E4405F" },
    { name: "Twitter", url: "https://twitter.com/yourstore", icon: Twitter, color: "#1DA1F2" },
    { name: "YouTube", url: "https://youtube.com/yourstore", icon: Youtube, color: "#FF0000" },
    { name: "TikTok", url: "https://tiktok.com/@yourstore", icon: Music, color: "#000000" }
  ];

  const handleHomeClick = () => {
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-navigation border-t border-navigation/20 md:hidden z-50 shadow-lg">
      <div className="flex items-center justify-around py-1">
        {/* Home */}
        <button
          onClick={handleHomeClick}
          className="flex flex-col items-center gap-1 px-3 py-2 text-navigation-foreground hover:bg-navigation/10 rounded-lg transition-colors"
        >
          <Home className="h-5 w-5" />
          <span className="text-xs font-medium">Home</span>
        </button>

        {/* Category */}
        <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center gap-1 px-3 py-2 text-navigation-foreground hover:bg-navigation/10 rounded-lg transition-colors">
              <Grid3X3 className="h-5 w-5" />
              <span className="text-xs font-medium">Category</span>
            </button>
          </DialogTrigger>
          <DialogContent className="bg-background border-navigation max-w-sm">
            <div className="grid grid-cols-2 gap-3 p-4">
              <h3 className="col-span-2 text-lg font-semibold text-center mb-2">Shop Categories</h3>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  className="h-12 border-navigation text-foreground hover:bg-navigation hover:text-navigation-foreground text-sm"
                  onClick={() => {
                    console.log(`Navigate to ${category}`);
                    setCategoryOpen(false);
                  }}
                >
                  {category}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* WhatsApp - Elevated and styled */}
        <button
          onClick={() => window.open("https://wa.me/+8801775777308", "_blank")}
          className="flex flex-col items-center gap-1 bg-green-500 rounded-full p-4 -mt-6 shadow-lg hover:bg-green-600 transition-all duration-300 transform hover:scale-105"
          style={{ marginBottom: '8px' }}
        >
          <MessageCircle className="h-6 w-6 text-white" />
        </button>

        {/* Account */}
        <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center gap-1 px-3 py-2 text-navigation-foreground hover:bg-navigation/10 rounded-lg transition-colors">
              <User className="h-5 w-5" />
              <span className="text-xs font-medium">Account</span>
            </button>
          </DialogTrigger>
          <DialogContent className="bg-background border-navigation max-w-sm">
            <div className="flex flex-col gap-4 p-6">
              <h3 className="text-lg font-semibold text-center mb-2">Account Access</h3>
              <Button
                variant="outline"
                className="h-12 border-navigation text-foreground hover:bg-navigation hover:text-navigation-foreground"
                onClick={() => {
                  navigate('/auth');
                  setAccountOpen(false);
                }}
              >
                Login
              </Button>
              <Button
                variant="default"
                className="h-12 bg-navigation text-navigation-foreground hover:bg-navigation/90"
                onClick={() => {
                  navigate('/auth');
                  setAccountOpen(false);
                }}
              >
                Register
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Social */}
        <Dialog open={socialOpen} onOpenChange={setSocialOpen}>
          <DialogTrigger asChild>
            <button className="flex flex-col items-center gap-1 px-3 py-2 text-navigation-foreground hover:bg-navigation/10 rounded-lg transition-colors">
              <Share2 className="h-5 w-5" />
              <span className="text-xs font-medium">Social</span>
            </button>
          </DialogTrigger>
          <DialogContent className="bg-background border-navigation max-w-sm">
            <div className="flex flex-col gap-3 p-6">
              <h3 className="text-lg font-semibold text-center mb-3">Follow Us</h3>
              {socialMedia.map((social) => {
                const IconComponent = social.icon;
                return (
                  <Button
                    key={social.name}
                    variant="outline"
                    className="h-12 border-navigation text-foreground hover:bg-navigation hover:text-navigation-foreground flex items-center gap-3 justify-start"
                    onClick={() => {
                      window.open(social.url, "_blank");
                      setSocialOpen(false);
                    }}
                    style={{ borderColor: social.color }}
                  >
                    <IconComponent size={20} style={{ color: social.color }} />
                    <span className="font-medium">{social.name}</span>
                  </Button>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MobileBottomNav;