import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CreditCard, Smartphone } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentService, PaymentGateway } from '@/services/paymentService';
import { useCountryDetection } from '@/hooks/useCountryDetection';
import { useToast } from '@/hooks/use-toast';

interface PaymentSelectorProps {
  orderId: string;
  orderAmount: number;
  productId?: string;
  productIds?: string[];
  onPaymentSubmitted?: () => void;
  onCODSelected?: () => void;
}

export const PaymentSelector = ({ orderId, orderAmount, productId, productIds, onPaymentSubmitted, onCODSelected }: PaymentSelectorProps) => {
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancePayment, setShowAdvancePayment] = useState(false);
  const [isVerifyingBinance, setIsVerifyingBinance] = useState(false);
  const { effectiveCountry } = useCountryDetection();
  const { toast } = useToast();

  useEffect(() => {
    const loadPaymentGateways = async () => {
      const currentProductIds = productIds || (productId ? [productId] : []);
      
      if (!effectiveCountry?.id) {
        // Fallback to Bangladesh payment gateways
        if (currentProductIds.length > 0) {
          // Get intersection of all products' allowed gateways
          const allProductGateways = await Promise.all(
            currentProductIds.map(id => PaymentService.getProductPaymentGateways(id, 'bangladesh-default'))
          );
          // Find common gateways across all products
          let intersectionGateways = allProductGateways[0] || [];
          for (let i = 1; i < allProductGateways.length; i++) {
            intersectionGateways = intersectionGateways.filter(gateway => 
              allProductGateways[i].some(g => g.id === gateway.id)
            );
          }
          setPaymentGateways(intersectionGateways);
        } else {
          const gateways = await PaymentService.getBangladeshPaymentGateways();
          setPaymentGateways(gateways);
        }
      } else {
        if (currentProductIds.length > 0) {
          // Get intersection of all products' allowed gateways
          const allProductGateways = await Promise.all(
            currentProductIds.map(id => PaymentService.getProductPaymentGateways(id, effectiveCountry.id))
          );
          // Find common gateways across all products
          let intersectionGateways = allProductGateways[0] || [];
          for (let i = 1; i < allProductGateways.length; i++) {
            intersectionGateways = intersectionGateways.filter(gateway => 
              allProductGateways[i].some(g => g.id === gateway.id)
            );
          }
          setPaymentGateways(intersectionGateways);
        } else {
          const gateways = await PaymentService.getPaymentGateways(effectiveCountry.id);
          setPaymentGateways(gateways);
        }
      }
    };

    loadPaymentGateways();
  }, [effectiveCountry, productId, productIds]);

  const handleSubmitPayment = async () => {
    if (!selectedGateway || !transactionId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a payment method and enter transaction ID",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Handle COD advance payment
      if (selectedGateway.name === 'cod') {
        onCODSelected?.(); // Notify parent about COD selection
        const advancePaymentId = await PaymentService.createAdvancePayment(orderId, 100, 'binance_pay');
        if (advancePaymentId) {
          setShowAdvancePayment(true);
          toast({
            title: "COD Selected",
            description: "Please pay 100 BDT delivery charge to confirm your order.",
          });
        }
        return;
      }

      // Handle Binance auto-verification
      if (selectedGateway.name === 'binance_pay') {
        setIsVerifyingBinance(true);
        const verified = await PaymentService.verifyBinancePayment(transactionId, orderId, orderAmount);
        
        if (verified) {
          toast({
            title: "Payment Verified",
            description: "Your Binance payment has been automatically verified!",
          });
          onPaymentSubmitted?.();
          return;
        } else {
          toast({
            title: "Verification Failed",
            description: "Binance payment verification failed. Please check your transaction ID.",
            variant: "destructive"
          });
          return;
        }
      }

      // Handle other payment methods
      const success = await PaymentService.submitTransaction(
        orderId,
        selectedGateway.name,
        transactionId,
        orderAmount
      );

      if (success) {
        toast({
          title: "Payment Submitted",
          description: "Your payment is being verified. You will be notified once confirmed.",
        });
        setTransactionId('');
        onPaymentSubmitted?.();
      } else {
        throw new Error('Failed to submit payment');
      }
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "Failed to submit payment details. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
      setIsVerifyingBinance(false);
    }
  };

  const handleAdvancePayment = async () => {
    if (!transactionId.trim()) {
      toast({
        title: "Missing Transaction ID",
        description: "Please enter your Binance Pay transaction ID",
        variant: "destructive"
      });
      return;
    }

    setIsVerifyingBinance(true);
    try {
      const verified = await PaymentService.verifyBinancePayment(transactionId, orderId, 100);
      
      if (verified) {
        toast({
          title: "Advance Payment Verified",
          description: "Your order is confirmed! You'll pay the remaining amount on delivery.",
        });
        setShowAdvancePayment(false);
        onPaymentSubmitted?.();
      } else {
        toast({
          title: "Verification Failed",
          description: "Payment verification failed. Please check your transaction ID.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Verification Error",
        description: "Failed to verify payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingBinance(false);
    }
  };

  if (paymentGateways.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Payment Methods Available</h3>
          <p className="text-muted-foreground">
            Payment methods are not available for your country yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Mobile Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Select Payment Method</Label>
          <div className="grid gap-3">
            {paymentGateways.map((gateway) => (
              <Card
                key={gateway.id}
                className={`cursor-pointer transition-colors ${
                  selectedGateway?.id === gateway.id 
                    ? 'border-primary bg-primary/5' 
                    : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedGateway(gateway)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{gateway.display_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {gateway.wallet_number}
                      </p>
                    </div>
                    <Badge variant="secondary">Mobile</Badge>
                  </div>
                  {selectedGateway?.id === gateway.id && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {gateway.instructions}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {selectedGateway && !showAdvancePayment && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {selectedGateway.name === 'cod' ? (
                  <>Pay <strong>100 BDT delivery charge</strong> using Binance Pay to confirm your order. Remaining <strong>৳{orderAmount - 100}</strong> will be collected on delivery.</>
                ) : selectedGateway.name === 'binance_pay' ? (
                  <>Send <strong>৳{orderAmount}</strong> using Binance Pay, then enter your transaction ID below for automatic verification.</>
                ) : (
                  <>Send <strong>৳{orderAmount}</strong> to <strong>{selectedGateway.wallet_number}</strong> using {selectedGateway.display_name}, then enter your transaction ID below.</>
                )}
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                placeholder={selectedGateway.name === 'binance_pay' ? "Enter Binance Pay transaction ID" : "Enter your transaction ID"}
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {selectedGateway.name === 'binance_pay' 
                  ? "Payment will be automatically verified within 5 minutes"
                  : "You will receive this ID via SMS after completing the payment"
                }
              </p>
            </div>

            <Button 
              onClick={handleSubmitPayment}
              disabled={isSubmitting || isVerifyingBinance || !transactionId.trim()}
              className="w-full"
            >
              {isVerifyingBinance ? 'Verifying...' : isSubmitting ? 'Submitting...' : 
               selectedGateway.name === 'binance_pay' ? 'Auto Verify Payment' : 
               selectedGateway.name === 'cod' ? 'Select COD' : 'Verify Payment'}
            </Button>
          </div>
        )}

        {showAdvancePayment && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Pay <strong>100 BDT delivery charge</strong> using Binance Pay to confirm your Cash on Delivery order.
                Remaining <strong>৳{orderAmount - 100}</strong> will be collected when your order is delivered.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="advanceTransactionId">Binance Pay Transaction ID</Label>
              <Input
                id="advanceTransactionId"
                placeholder="Enter Binance Pay transaction ID for 100 BDT"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Pay exactly 100 BDT using Binance Pay and enter the transaction ID
              </p>
            </div>

            <Button 
              onClick={handleAdvancePayment}
              disabled={isVerifyingBinance || !transactionId.trim()}
              className="w-full"
            >
              {isVerifyingBinance ? 'Verifying Advance Payment...' : 'Verify Advance Payment'}
            </Button>

            <Button 
              variant="outline"
              onClick={() => {
                setShowAdvancePayment(false);
                setSelectedGateway(null);
                setTransactionId('');
              }}
              className="w-full"
            >
              Cancel COD Order
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};