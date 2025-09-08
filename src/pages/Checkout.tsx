import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft } from 'lucide-react';

interface CheckoutFormData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address1: string;
  address2: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  sameAsShipping: boolean;
  billingAddress1: string;
  billingAddress2: string;
  billingCity: string;
  billingProvince: string;
  billingCountry: string;
  billingPostalCode: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<CheckoutFormData>({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    phone: '',
    address1: '',
    address2: '',
    city: '',
    province: '',
    country: 'United States',
    postalCode: '',
    sameAsShipping: true,
    billingAddress1: '',
    billingAddress2: '',
    billingCity: '',
    billingProvince: '',
    billingCountry: 'United States',
    billingPostalCode: ''
  });
  
  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.08; // 8% tax
  const shipping = subtotal > 100 ? 0 : 15; // Free shipping over $100
  const total = subtotal + tax + shipping;

  const handleInputChange = (field: keyof CheckoutFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (cart.items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create order data
      const orderData = {
        customerEmail: formData.email,
        items: cart.items.map(item => ({
          productId: item.productId,
          product: item.product,
          quantity: item.quantity,
          price: item.price,
          variant: item.variant
        })),
        subtotal,
        tax,
        shipping,
        total,
        billingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address1: formData.sameAsShipping ? formData.address1 : formData.billingAddress1,
          address2: formData.sameAsShipping ? formData.address2 : formData.billingAddress2,
          city: formData.sameAsShipping ? formData.city : formData.billingCity,
          province: formData.sameAsShipping ? formData.province : formData.billingProvince,
          country: formData.sameAsShipping ? formData.country : formData.billingCountry,
          postalCode: formData.sameAsShipping ? formData.postalCode : formData.billingPostalCode,
          phone: formData.phone
        },
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address1: formData.address1,
          address2: formData.address2,
          city: formData.city,
          province: formData.province,
          country: formData.country,
          postalCode: formData.postalCode,
          phone: formData.phone
        }
      };

      // Call the create-order edge function
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: orderData
      });

      if (error) throw error;

      // Clear cart and redirect to success page
      clearCart();
      toast({
        title: "Order placed successfully!",
        description: `Order ${data.orderNumber} has been created.`
      });
      
      navigate(`/order-success/${data.orderId}`);

    } catch (error) {
      console.error('Order creation failed:', error);
      toast({
        title: "Order failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-muted-foreground mb-6">Add some products to your cart to proceed with checkout.</p>
            <Button onClick={() => navigate('/shop')}>
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/shop')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      required
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address1">Address Line 1</Label>
                    <Input
                      id="address1"
                      value={formData.address1}
                      onChange={(e) => handleInputChange('address1', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="address2">Address Line 2 (Optional)</Label>
                    <Input
                      id="address2"
                      value={formData.address2}
                      onChange={(e) => handleInputChange('address2', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">State/Province</Label>
                      <Input
                        id="province"
                        value={formData.province}
                        onChange={(e) => handleInputChange('province', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Postal Code</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Address */}
              <Card>
                <CardHeader>
                  <CardTitle>Billing Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="sameAsShipping"
                      checked={formData.sameAsShipping}
                      onChange={(e) => handleInputChange('sameAsShipping', e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="sameAsShipping">Same as shipping address</Label>
                  </div>
                  
                  {!formData.sameAsShipping && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="billingAddress1">Address Line 1</Label>
                        <Input
                          id="billingAddress1"
                          value={formData.billingAddress1}
                          onChange={(e) => handleInputChange('billingAddress1', e.target.value)}
                          required={!formData.sameAsShipping}
                        />
                      </div>
                      <div>
                        <Label htmlFor="billingAddress2">Address Line 2 (Optional)</Label>
                        <Input
                          id="billingAddress2"
                          value={formData.billingAddress2}
                          onChange={(e) => handleInputChange('billingAddress2', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="billingCity">City</Label>
                          <Input
                            id="billingCity"
                            value={formData.billingCity}
                            onChange={(e) => handleInputChange('billingCity', e.target.value)}
                            required={!formData.sameAsShipping}
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingProvince">State/Province</Label>
                          <Input
                            id="billingProvince"
                            value={formData.billingProvince}
                            onChange={(e) => handleInputChange('billingProvince', e.target.value)}
                            required={!formData.sameAsShipping}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="billingCountry">Country</Label>
                          <Input
                            id="billingCountry"
                            value={formData.billingCountry}
                            onChange={(e) => handleInputChange('billingCountry', e.target.value)}
                            required={!formData.sameAsShipping}
                          />
                        </div>
                        <div>
                          <Label htmlFor="billingPostalCode">Postal Code</Label>
                          <Input
                            id="billingPostalCode"
                            value={formData.billingPostalCode}
                            onChange={(e) => handleInputChange('billingPostalCode', e.target.value)}
                            required={!formData.sameAsShipping}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3">
                  {cart.items.map((item) => (
                    <div key={`${item.productId}-${item.variant?.id || 'default'}`} className="flex gap-3">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        {item.variant && (
                          <p className="text-xs text-muted-foreground">{item.variant.value}</p>
                        )}
                        <p className="text-sm">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-sm font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isProcessing}
                  onClick={handleSubmit}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Place Order - $${total.toFixed(2)}`
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;