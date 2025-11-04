import { Helmet } from "react-helmet";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Package, RefreshCw, Clock, Shield, CheckCircle, XCircle } from "lucide-react";

const ReturnsRefunds = () => {
  return (
    <>
      <Helmet>
        <title>Returns & Refunds Policy</title>
        <meta name="description" content="Our comprehensive returns and refunds policy. Learn about our buyer protection, return process, and refund guidelines." />
      </Helmet>
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl">
          <div className="space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-foreground">Returns & Refunds Policy</h1>
              <p className="text-lg text-muted-foreground">
                Your satisfaction is our priority. Learn about our buyer protection and return guidelines.
              </p>
            </div>

            {/* Quick Info Cards */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-lg p-6 text-center space-y-2">
                <Clock className="h-8 w-8 mx-auto text-primary" />
                <h3 className="font-semibold text-card-foreground">Return Window</h3>
                <p className="text-sm text-muted-foreground">15-30 days from delivery</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 text-center space-y-2">
                <Shield className="h-8 w-8 mx-auto text-primary" />
                <h3 className="font-semibold text-card-foreground">Buyer Protection</h3>
                <p className="text-sm text-muted-foreground">Full refund guarantee</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-6 text-center space-y-2">
                <RefreshCw className="h-8 w-8 mx-auto text-primary" />
                <h3 className="font-semibold text-card-foreground">Easy Process</h3>
                <p className="text-sm text-muted-foreground">Simple return steps</p>
              </div>
            </div>

            {/* Return Policy Section */}
            <section className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-card-foreground">Return Policy</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We offer a hassle-free return policy to ensure your complete satisfaction. If you're not happy with your purchase, 
                  you can return it within the specified timeframe.
                </p>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-card-foreground">Return Timeframe</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Standard items: 15 days from delivery date</li>
                    <li>Electronics & gadgets: 7 days from delivery date</li>
                    <li>Fashion & apparel: 30 days from delivery date</li>
                    <li>Custom or personalized items: Non-returnable unless defective</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-card-foreground">Eligible for Return</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p>Items in original condition with tags attached</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p>Unused and unwashed products</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p>Items in original packaging</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <p>Defective or damaged items</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-card-foreground">Not Eligible for Return</h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p>Items used or worn</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p>Personalized or custom-made products</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p>Hygiene products (unless defective)</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <p>Products without original packaging</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* How to Return Section */}
            <section className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <RefreshCw className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-card-foreground">How to Return an Item</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">Contact Us</h3>
                      <p className="text-muted-foreground">
                        Reach out to our customer support team via WhatsApp or through your order page. 
                        Provide your order number and reason for return.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">Get Return Authorization</h3>
                      <p className="text-muted-foreground">
                        Our team will review your request and provide you with a return authorization 
                        and shipping instructions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">Pack & Ship</h3>
                      <p className="text-muted-foreground">
                        Pack the item securely in its original packaging. Include all accessories, 
                        tags, and documentation. Ship to the provided address.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">Receive Refund</h3>
                      <p className="text-muted-foreground">
                        Once we receive and inspect your return, we'll process your refund within 5-7 business days.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Refund Policy Section */}
            <section className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-card-foreground">Refund Policy</h2>
              </div>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We process refunds promptly to ensure your satisfaction. The refund method and timeline 
                  depend on your original payment method.
                </p>
                
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-card-foreground">Refund Methods</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Cash on Delivery (COD):</strong> Bank transfer or mobile wallet within 7-10 business days</li>
                    <li><strong>Online Payment:</strong> Refund to original payment method within 5-7 business days</li>
                    <li><strong>Mobile Wallet:</strong> Instant refund to wallet within 24-48 hours</li>
                    <li><strong>Bank Transfer:</strong> Refund within 7-14 business days</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-card-foreground">Refund Amount</h3>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Full refund for defective or incorrect items</li>
                    <li>Product price refund (shipping charges may be deducted for voluntary returns)</li>
                    <li>Exchange or store credit available as alternative options</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-card-foreground">Partial Refunds</h3>
                  <p>Partial refunds may be granted for:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Items not in original condition or damaged by customer</li>
                    <li>Items returned after the return period</li>
                    <li>Items missing parts not due to our error</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Exchange Policy Section */}
            <section className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-bold text-card-foreground">Exchange Policy</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  If you'd prefer an exchange instead of a refund, we're happy to accommodate:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Exchanges available for same-value items or higher (pay difference)</li>
                  <li>Size exchanges for apparel within 30 days</li>
                  <li>Color exchanges subject to availability</li>
                  <li>Defective items exchanged free of charge</li>
                </ul>
              </div>
            </section>

            {/* Damaged or Defective Items Section */}
            <section className="bg-card border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-2xl font-bold text-card-foreground">Damaged or Defective Items</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  If your item arrives damaged or defective:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Report within 48 hours of delivery with photos</li>
                  <li>We'll arrange pickup at no cost to you</li>
                  <li>Full refund or replacement provided immediately</li>
                  <li>No questions asked for manufacturer defects</li>
                </ul>
              </div>
            </section>

            {/* Contact Section */}
            <section className="bg-primary/10 border border-primary/20 rounded-lg p-6 text-center space-y-3">
              <h2 className="text-2xl font-bold text-foreground">Need Help?</h2>
              <p className="text-muted-foreground">
                Our customer support team is here to assist you with any questions about returns or refunds.
              </p>
              <a 
                href="https://wa.me/+8801775777308" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </a>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default ReturnsRefunds;
