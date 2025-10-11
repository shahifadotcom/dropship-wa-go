import { Home, Grid3X3, Phone, User, Share2, Facebook, Instagram, Twitter, Youtube, Music, MessageCircle } from "lucide-react";
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
        <a
          href="https://wa.me/+8801775777308"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-1 bg-[#25D366] rounded-full p-4 -mt-6 shadow-lg hover:bg-[#20BA5A] transition-all duration-300 transform hover:scale-105 border-0"
          style={{ marginBottom: '8px' }}
        >
          <svg 
            viewBox="0 0 24 24" 
            className="h-6 w-6 fill-white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        </a>

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