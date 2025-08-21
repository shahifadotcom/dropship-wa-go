import { ArrowRight, Zap, Globe, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary-glow/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 text-white">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">AI-Powered Dropshipping</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            All-in-One
            <span className="block bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              E-commerce Platform
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Import products from multiple sources, automate dropshipping, optimize with AI, 
            and scale your business with WhatsApp integration and global payments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-large">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
              Watch Demo
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <Globe className="h-8 w-8 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">Global Ready</h3>
              <p className="text-sm text-white/80">Multi-currency, geo-payments, worldwide shipping automation</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <Zap className="h-8 w-8 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">AI Optimization</h3>
              <p className="text-sm text-white/80">Auto-SEO, smart pricing, AI-powered product descriptions</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
              <Smartphone className="h-8 w-8 mb-3 mx-auto" />
              <h3 className="font-semibold mb-2">WhatsApp Integration</h3>
              <p className="text-sm text-white/80">OTP verification, order notifications, customer support</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;