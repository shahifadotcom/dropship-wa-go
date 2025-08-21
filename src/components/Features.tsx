import { 
  Package, 
  Zap, 
  Globe, 
  Smartphone, 
  CreditCard, 
  Bot, 
  ShoppingBag, 
  Truck,
  BarChart3,
  MessageSquare
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Package,
      title: "Multi-Source Importing",
      description: "Import products from Shopify, WooCommerce, AliExpress, Amazon, Zendrop, and more with one-click Chrome extension.",
      color: "text-blue-500"
    },
    {
      icon: Truck,
      title: "Dropshipping Automation",
      description: "Auto-order placement, smart stock monitoring, tiered pricing rules, and automated shipping ETAs.",
      color: "text-green-500"
    },
    {
      icon: Bot,
      title: "AI Optimization",
      description: "AI-powered SEO rewriting, meta optimization, image compression, and bulk product enhancement.",
      color: "text-purple-500"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Integration",
      description: "OTP verification, order notifications, customer support, and automated campaigns via WhatsApp.",
      color: "text-green-600"
    },
    {
      icon: CreditCard,
      title: "Global Payments",
      description: "PayPal, Stripe, Binance Pay, Skrill, bKash, Nagad with geo-based payment control and automation.",
      color: "text-yellow-500"
    },
    {
      icon: Globe,
      title: "Geo-Commerce",
      description: "Multi-currency, country-specific pricing, geo-based product visibility and shipping rules.",
      color: "text-blue-600"
    },
    {
      icon: Smartphone,
      title: "Mobile Apps",
      description: "Native Android e-commerce app with full shopping experience and WhatsApp integration.",
      color: "text-indigo-500"
    },
    {
      icon: ShoppingBag,
      title: "Virtual Try-On",
      description: "2D/3D virtual try-on for fashion items with AI size suggestions and enhanced product visualization.",
      color: "text-pink-500"
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Real-time sales analytics, conversion tracking, customer behavior insights, and performance optimization.",
      color: "text-orange-500"
    }
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="block bg-gradient-primary bg-clip-text text-transparent">
              Scale Your Business
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From product importing to AI optimization, payments to mobile apps - 
            our comprehensive platform handles every aspect of your e-commerce journey.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div 
                key={index} 
                className="bg-gradient-card p-8 rounded-2xl border shadow-soft hover:shadow-medium transition-all duration-300 group"
              >
                <div className={`${feature.color} mb-4`}>
                  <IconComponent className="h-12 w-12 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;