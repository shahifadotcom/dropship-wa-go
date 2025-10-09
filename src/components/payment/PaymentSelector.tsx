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
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancePayment, setShowAdvancePayment] = useState(false);
  const [isVerifyingBinance, setIsVerifyingBinance] = useState(false);
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
    if (!selectedGateway || !transactionId.trim() || !amount.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if transaction already exists
      const existingTx = await PaymentService.checkSMSTransaction(transactionId);
      if (existingTx) {
        toast.error('This transaction ID has already been used');
        setIsSubmitting(false);
        return;
      }

      // Create order first
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

      // Handle Binance Pay differently - auto verify
      if (selectedGateway.name === 'binance_pay') {
        setIsVerifyingBinance(true);
        
        const verified = await PaymentService.verifyBinancePayment(
          transactionId,
          newOrderId,
          parsedAmount
        );

        setIsVerifyingBinance(false);

        if (verified) {
          toast.success('Payment verified! Your order has been confirmed.');
          onPaymentSubmitted(newOrderId);
        } else {
          toast.error('Payment verification failed. Please contact support.');
        }
        return;
      }

      // For other payment methods, submit for manual verification
      const submitted = await PaymentService.submitTransaction(
        newOrderId,
        selectedGateway.name,
        transactionId,
        parsedAmount
      );

      if (submitted) {
        toast.success('Transaction submitted for verification. You will be notified once verified.');
        onPaymentSubmitted(newOrderId);
      } else {
        throw new Error('Failed to submit transaction');
      }

    } catch (error) {
      console.error('Payment submission error:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvancePayment = async () => {
    if (!transactionId.trim() || !amount.trim()) {
      toast.error('Please enter transaction ID and amount');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount !== 100) {
      toast.error('Advance payment must be exactly 100 BDT');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if transaction already exists
      const existingTx = await PaymentService.checkSMSTransaction(transactionId);
      if (existingTx) {
        toast.error('This transaction ID has already been used');
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

      // Create advance payment record (store method used for audit)
      const advancePaymentId = await PaymentService.createAdvancePayment(newOrderId, 100, selectedGateway?.name || 'cod');
      if (!advancePaymentId) {
        throw new Error('Failed to create advance payment record');
      }

      // Create transaction verification record for admin review
      const transactionSubmitted = await PaymentService.submitTransaction(
        newOrderId,
        selectedGateway?.name || 'cod',
        transactionId,
        100
      );

      if (transactionSubmitted) {
        toast.success('Confirmation fee submitted. Your COD order is pending verification.');
        onPaymentSubmitted(newOrderId);
      } else {
        throw new Error('Failed to submit transaction for verification');
      }

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
              <Label htmlFor="amount">Amount Sent (BDT)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="Enter amount you sent"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting || isVerifyingBinance}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                placeholder="Enter your transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                disabled={isSubmitting || isVerifyingBinance}
              />
            </div>

            <Button 
              onClick={handleSubmitPayment} 
              className="w-full"
              disabled={isSubmitting || isVerifyingBinance || !transactionId.trim() || !amount.trim()}
            >
              {isSubmitting || isVerifyingBinance ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isVerifyingBinance ? 'Verifying...' : 'Processing...'}
                </>
              ) : (
                'Submit Payment'
              )}
            </Button>
          </div>
        )}

        {showAdvancePayment && (
          <div className="space-y-4 pt-4 border-t">
            <Alert>
              <AlertDescription>
                For Cash on Delivery orders, please pay 100 BDT as a confirmation fee. The remaining amount will be paid to the delivery person.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="cod-amount">Confirmation Fee Amount (BDT)</Label>
              <Input
                id="cod-amount"
                type="number"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">Must be exactly 100 BDT</p>
            </div>

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
              disabled={isSubmitting || !transactionId.trim() || !amount.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Submit Confirmation Fee'
              )}
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  );
};
