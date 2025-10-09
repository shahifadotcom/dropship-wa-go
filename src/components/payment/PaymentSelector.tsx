import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { PaymentService, PaymentGateway } from '@/services/paymentService';
import { supabase } from '@/integrations/supabase/client';
import { useCountryDetection } from '@/hooks/useCountryDetection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface PaymentSelectorProps {
  orderAmount: number;
  productId?: string;
  productIds?: string[];
  onPaymentSubmitted: (orderId: string) => void;
  onCODSelected: (isCOD: boolean) => void;
}

export const PaymentSelector = ({ 
  orderAmount, 
  productId, 
  productIds, 
  onPaymentSubmitted,
  onCODSelected 
}: PaymentSelectorProps) => {
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancePayment, setShowAdvancePayment] = useState(false);
  const { detectedCountry } = useCountryDetection();

  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        let gateways: PaymentGateway[] = [];
        
        if (detectedCountry?.id) {
          if (productId) {
            gateways = await PaymentService.getProductPaymentGateways(productId, detectedCountry.id);
          } else if (productIds && productIds.length > 0) {
            gateways = await PaymentService.getPaymentGateways(detectedCountry.id);
          } else {
            gateways = await PaymentService.getPaymentGateways(detectedCountry.id);
          }
        }

        setPaymentGateways(gateways);
      } catch (error) {
        console.error('Failed to load payment methods:', error);
        toast.error('Failed to load payment methods');
      }
    };

    loadPaymentMethods();
  }, [productId, productIds, detectedCountry]);

  const handleSubmitPayment = async () => {
    if (!selectedGateway || !transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return;
    }

    setIsSubmitting(true);

    try {
      // For local wallets, verify SMS transaction BEFORE creating order
      if (PaymentService.isLocalWallet(selectedGateway.name)) {
        const preMatched = await PaymentService.verifyLocalWalletPayment(transactionId, '', selectedGateway.name);
        if (!preMatched) {
          toast.error('Transaction ID not found in SMS records');
          setIsSubmitting(false);
          return;
        }
      }

      // Create order after successful SMS verification (or for non-local gateways)
      const { data: orderData, error: orderError } = await supabase.functions.invoke('verify-otp-and-create-order', {
        body: {
          skipOTP: true,
          orderData: {
            items: [],
            subtotal: orderAmount,
            total: orderAmount,
            paymentMethod: selectedGateway.name
          }
        }
      });

      if (orderError || !orderData?.orderId) {
        throw new Error('Failed to create order');
      }

      const newOrderId = orderData.orderId;

      if (PaymentService.isLocalWallet(selectedGateway.name)) {
        // Mark order verified server-side (no client DB writes)
        await PaymentService.verifyLocalWalletPayment(transactionId, newOrderId, selectedGateway.name);
        toast.success('Order placed and verified via SMS.');
      } else {
        // For Binance/others, use gateway verification
        const verified = await PaymentService.verifyBinancePayment(transactionId, newOrderId, orderAmount);
        if (verified) {
          toast.success('Order placed and payment verified.');
        } else {
          toast.success('Order placed! Verification pending.');
        }
      }

      onPaymentSubmitted(newOrderId);

    } catch (error) {
      console.error('Payment submission error:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvancePayment = async () => {
    if (!transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return;
    }

    setIsSubmitting(true);

    try {
      // Verify SMS transaction BEFORE creating COD order
      const preMatched = await PaymentService.verifyLocalWalletPayment(transactionId, '', selectedGateway?.name || 'cod');
      if (!preMatched) {
        toast.error('Transaction ID not found in SMS records');
        setIsSubmitting(false);
        return;
      }

      // Create COD order
      const { data: orderData, error: orderError } = await supabase.functions.invoke('verify-otp-and-create-order', {
        body: {
          skipOTP: true,
          orderData: {
            items: [],
            subtotal: orderAmount,
            total: orderAmount,
            paymentMethod: 'cod'
          }
        }
      });

      if (orderError || !orderData?.orderId) {
        throw new Error('Failed to create order');
      }

      const newOrderId = orderData.orderId;

      // Create advance payment record
      const advancePaymentId = await PaymentService.createAdvancePayment(newOrderId, 100, selectedGateway?.name || 'cod');
      if (!advancePaymentId) {
        throw new Error('Failed to create advance payment record');
      }

      toast.success('COD order placed! Confirmation fee verified via SMS.');
      onPaymentSubmitted(newOrderId);

    } catch (error) {
      console.error('Advance payment error:', error);
      toast.error('Failed to process advance payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!paymentGateways || paymentGateways.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Method</CardTitle>
          <CardDescription>No payment methods available for your country</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Please contact support for payment options in your region.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Method</CardTitle>
        <CardDescription>Select your payment method and enter transaction details</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup
          value={selectedGateway?.id || ''}
          onValueChange={(value) => {
            const gateway = paymentGateways.find(g => g.id === value);
            setSelectedGateway(gateway || null);
            setShowAdvancePayment(gateway?.name === 'cod');
            onCODSelected(gateway?.name === 'cod');
          }}
        >
          {paymentGateways.map((gateway) => (
            <div key={gateway.id} className="flex items-center space-x-2">
              <RadioGroupItem value={gateway.id} id={gateway.id} />
              <Label htmlFor={gateway.id} className="flex-1 cursor-pointer">
                <div className="font-medium">{gateway.display_name}</div>
                {gateway.wallet_number && (
                  <div className="text-sm text-muted-foreground">
                    Number: {gateway.wallet_number}
                  </div>
                )}
                {gateway.instructions && (
                  <div className="text-sm text-muted-foreground mt-1">
                    {gateway.instructions}
                  </div>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>

        {selectedGateway && !showAdvancePayment && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                placeholder="Enter your transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Send payment to {selectedGateway.wallet_number} and enter the transaction ID here
              </p>
            </div>

            <Button 
              onClick={handleSubmitPayment} 
              className="w-full"
              disabled={isSubmitting || !transactionId.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </Button>
          </div>
        )}

        {showAdvancePayment && (
          <div className="space-y-4 pt-4 border-t">
            <Alert>
              <AlertDescription>
                Pay 100 BDT confirmation fee to {selectedGateway?.wallet_number}. Enter the transaction ID below.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="cod-transactionId">Transaction ID</Label>
              <Input
                id="cod-transactionId"
                placeholder="Enter confirmation fee transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <Button 
              onClick={handleAdvancePayment} 
              className="w-full"
              disabled={isSubmitting || !transactionId.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Place COD Order'
              )}
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  );
};
