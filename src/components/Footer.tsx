import { Package, Twitter, Github, Linkedin, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStoreSettings } from "@/hooks/useStoreSettings";

const Footer = () => {
  const { settings } = useStoreSettings();
  const footerSections = [
    {
      title: "Platform",
      links: [
        { name: "Features", href: "#" },
        { name: "Integrations", href: "#" },
        { name: "AI Tools", href: "#" },
        { name: "Mobile App", href: "#" },
        { name: "API Docs", href: "#" }
      ]
    },
    {
      title: "Solutions",
      links: [
        { name: "Dropshipping", href: "#" },
        { name: "Print on Demand", href: "#" },
        { name: "Digital Products", href: "#" },
        { name: "WhatsApp Commerce", href: "#" },
        { name: "Global Payments", href: "#" }
      ]
    },
    {
      title: "Resources",
      links: [
        { name: "Documentation", href: "#" },
        { name: "Blog", href: "#" },
        { name: "Case Studies", href: "#" },
        { name: "Webinars", href: "#" },
        { name: "Community", href: "#" }
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "#" },
        { name: "Contact Us", href: "#" },
        { name: "Status Page", href: "#" },
        { name: "Security", href: "#" },
        { name: "Privacy Policy", href: "#" }
      ]
    }
  ];

  return (
    <footer className="hidden md:block bg-background border-t">
      <div className="container mx-auto px-4 py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              {settings?.store_logo ? (
                <img 
                  src={settings.store_logo} 
                  alt={settings.store_name || 'Store Logo'} 
                  className="h-8 w-8 object-contain"
                />
              ) : (
                <Package className="h-8 w-8 text-primary" />
              )}
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {settings?.store_name || 'DropshipPro'}
              </span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              {settings?.store_description || 'The complete e-commerce platform that empowers merchants to build, scale, and optimize their dropshipping businesses with AI-powered tools and global integrations.'}
            </p>
            <div className="flex space-x-4">
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Github className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Linkedin className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Mail className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Footer links */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.href} 
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="border-t pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm mb-4 md:mb-0">
            © 2024 {settings?.store_name || 'DropshipPro'}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Cookie Policy
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              GDPR Compliance
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;