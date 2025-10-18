import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, Package, MessageCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/lib/types';
import { useCountryDetection } from '@/hooks/useCountryDetection';

const OrderSuccess = () => {
  const { orderId: urlOrderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { currency } = useCountryDetection();

  useEffect(() => {
    const fetchOrder = async () => {
      // Get orderId from URL or localStorage
      const orderId = urlOrderId || localStorage.getItem('lastOrderId');
      
      if (!orderId) {
        setLoading(false);
        return;
      }
      
      try {
        const { data: resp, error } = await supabase.functions.invoke('get-order-public', {
          body: { orderId }
        });
        const data = (resp as any)?.order || null;

        if (error) throw error;
        if (!data) {
          setOrder(null);
          setLoading(false);
          // Clear invalid orderId from localStorage
          localStorage.removeItem('lastOrderId');
          return;
        }
        
        // Map the data to Order type
        const mappedOrder: Order = {
          id: data.id,
          orderNumber: data.order_number,
          customerId: data.customer_id,
          customerEmail: data.customer_email,
          status: data.status as any,
          items: data.order_items?.map((item: any) => ({
            id: item.id,
            productId: item.product_id,
            productName: item.product_name,
            productImage: item.product_image,
            quantity: item.quantity,
            price: Number(item.price),
            variant: item.variant_data
          })) || [],
          subtotal: Number(data.subtotal),
          tax: Number(data.tax),
          shipping: Number(data.shipping),
          total: Number(data.total),
          paymentStatus: data.payment_status as any,
          billingAddress: data.billing_address as any,
          shippingAddress: data.shipping_address as any,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };
        
        setOrder(mappedOrder);

        // Check if order contains calling subscription and activate it
        if (data.customer_id && data.payment_status === 'paid') {
          const callingProductSKU = 'CALLING-12M'; // 1 year subscription only
          
          // Check if any item is a calling subscription
          const hasCallingProduct = data.order_items?.some((item: any) => {
            // We need to check the product SKU from products table
            return item.product_id;
          });

          if (hasCallingProduct) {
            // Activate subscription via edge function
            try {
              await supabase.functions.invoke('activate-calling-subscription', {
                body: { orderId: data.id, userId: data.customer_id }
              });
              console.log('Subscription activation triggered');
            } catch (activationError) {
              console.error('Failed to activate subscription:', activationError);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch order:', error);
        localStorage.removeItem('lastOrderId');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    
    // Clean up localStorage after order is loaded
    return () => {
      localStorage.removeItem('lastOrderId');
    };
  }, [urlOrderId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-4">Order not found</h1>
            <p className="text-muted-foreground mb-6">The order you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate('/')}>
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
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continue Shopping
        </Button>

        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Order Confirmed!</h1>
                <p className="text-muted-foreground mb-4">
                  Thank you for your purchase. Your order has been received and is being processed.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span>A confirmation has been sent to your WhatsApp</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Number</p>
                  <p className="font-medium">{order.orderNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Order Date</p>
                  <p className="font-medium">{order.createdAt.toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant="secondary" className="capitalize">
                    {order.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Status</p>
                  <Badge variant="secondary" className="capitalize">
                    {order.paymentStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Items Ordered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-16 h-16 rounded object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.productName}</h4>
                      {item.variant && (
                        <p className="text-sm text-muted-foreground">
                          {item.variant.name}: {item.variant.value}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{(item.price * item.quantity).toFixed(2)} {currency}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.price.toFixed(2)} {currency} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{order.subtotal.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>{order.shipping === 0 ? 'Free' : `${order.shipping.toFixed(2)} ${currency}`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>{order.tax.toFixed(2)} {currency}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{order.total.toFixed(2)} {currency}</span>
                </div>
                {order.paymentStatus === 'pending' && (
                  <>
                    <Separator />
                    <div className="flex justify-between text-sm text-green-600">
                      <span>✅ Confirmation Fee Paid</span>
                      <span>-100.00 {currency}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-orange-600">
                      <span>💰 Pay on Delivery</span>
                      <span>{(order.total - 100).toFixed(2)} {currency}</span>
                    </div>
                    <Separator />
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-2">
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        📦 <strong>Delivery:</strong> FREE • The 100 {currency} is a confirmation fee only (non-refundable if products not received)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <p className="font-medium">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.address1}</p>
                {order.shippingAddress.address2 && (
                  <p>{order.shippingAddress.address2}</p>
                )}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
                {order.shippingAddress.phone && (
                  <p className="text-muted-foreground">Phone: {order.shippingAddress.phone}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;