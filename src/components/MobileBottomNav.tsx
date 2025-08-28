import { Home, Grid3X3, MessageCircle, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";

const MobileBottomNav = () => {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);

  const categories = [
    "Electronics", "Fashion", "Home & Garden", "Sports", "Beauty", "Books"
  ];

  const socialMedia = [
    { name: "Facebook", url: "https://facebook.com", icon: "📘" },
    { name: "Instagram", url: "https://instagram.com", icon: "📷" },
    { name: "Twitter", url: "https://twitter.com", icon: "🐦" },
    { name: "YouTube", url: "https://youtube.com", icon: "📺" },
    { name: "TikTok", url: "https://tiktok.com", icon: "🎵" }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-navigation border-t border-navigation/20 md:hidden z-50">
      <div className="flex items-center justify-around py-2">
        {/* Home */}
        <Button
          variant="ghost"
          size="sm"
          className="flex flex-col items-center gap-1 text-navigation-foreground hover:bg-navigation/80"
          onClick={() => window.location.reload()}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Home</span>
        </Button>

        {/* Category */}
        <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 text-navigation-foreground hover:bg-navigation/80"
            >
              <Grid3X3 className="h-5 w-5" />
              <span className="text-xs">Category</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-navigation">
            <div className="grid grid-cols-2 gap-4 p-4">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  className="h-12 border-navigation text-foreground hover:bg-navigation hover:text-navigation-foreground"
                >
                  {category}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* WhatsApp - Elevated */}
        <Button
          variant="default"
          size="sm"
          className="flex flex-col items-center gap-1 -mt-4 rounded-full h-12 w-12 bg-green-500 hover:bg-green-600 text-white shadow-lg"
          onClick={() => window.open("https://wa.me/+8801775777308", "_blank")}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>

        {/* Account */}
        <Dialog open={accountOpen} onOpenChange={setAccountOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 text-navigation-foreground hover:bg-navigation/80"
            >
              <User className="h-5 w-5" />
              <span className="text-xs">Account</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-navigation">
            <div className="flex flex-col gap-4 p-4">
              <Button
                className="h-12 bg-primary hover:bg-primary/90"
                onClick={() => {
                  setAccountOpen(false);
                  // Navigate to login
                }}
              >
                Login
              </Button>
              <Button
                variant="outline"
                className="h-12 border-navigation text-foreground hover:bg-navigation hover:text-navigation-foreground"
                onClick={() => {
                  setAccountOpen(false);
                  // Navigate to register
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
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 text-navigation-foreground hover:bg-navigation/80"
            >
              <Share2 className="h-5 w-5" />
              <span className="text-xs">Social</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-navigation">
            <div className="grid grid-cols-2 gap-4 p-4">
              {socialMedia.map((social) => (
                <Button
                  key={social.name}
                  variant="outline"
                  className="h-12 border-navigation text-foreground hover:bg-navigation hover:text-navigation-foreground flex items-center gap-2"
                  onClick={() => window.open(social.url, "_blank")}
                >
                  <span className="text-lg">{social.icon}</span>
                  {social.name}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default MobileBottomNav;