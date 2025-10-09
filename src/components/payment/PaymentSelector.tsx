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
import { supabase } from '@/integrations/supabase/client';

interface PaymentSelectorProps {
  orderAmount: number;
  productId?: string;
  productIds?: string[];
  onPaymentSubmitted?: (orderId: string) => void;
  onCODSelected?: () => void;
  orderData: any;
}

export const PaymentSelector = ({ orderAmount, productId, productIds, onPaymentSubmitted, onCODSelected, orderData }: PaymentSelectorProps) => {
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancePayment, setShowAdvancePayment] = useState(false);
  const [isVerifyingBinance, setIsVerifyingBinance] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [failedTransactionId, setFailedTransactionId] = useState('');
  const [showContactSupport, setShowContactSupport] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const { effectiveCountry } = useCountryDetection();
  const { toast } = useToast();

  useEffect(() => {
    const loadPaymentGateways = async () => {
      const currentProductIds = productIds || (productId ? [productId] : []);
      
      // Always get Bangladesh country ID first
      const bangladeshCountryId = await PaymentService.getBangladeshCountryId();
      const targetCountryId = effectiveCountry?.id || bangladeshCountryId;
      
      if (!targetCountryId) {
        console.error('No country ID available');
        return;
      }
      
      if (currentProductIds.length > 0) {
        // Get intersection of all products' allowed gateways
        const allProductGateways = await Promise.all(
          currentProductIds.map(id => PaymentService.getProductPaymentGateways(id, targetCountryId))
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
        const gateways = await PaymentService.getPaymentGateways(targetCountryId);
        setPaymentGateways(gateways);
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
    setShowContactSupport(false);
    
    try {
      // Handle COD advance payment
      if (selectedGateway.name === 'cod') {
        onCODSelected?.();
        setShowAdvancePayment(true);
        toast({
          title: "COD Selected",
          description: "Please pay 100 BDT delivery charge to confirm your order.",
        });
        return;
      }

      // Check if transaction ID exists in SMS transactions first
      const smsExists = await PaymentService.checkSMSTransaction(transactionId);
      
      if (!smsExists) {
        setFailedTransactionId(transactionId);
        setShowContactSupport(true);
        toast({
          title: "Transaction Not Found",
          description: "We couldn't find this transaction ID in our records. Please contact support.",
          variant: "destructive"
        });
        return;
      }

      // Create order after payment verified
      const { data: orderResponse, error: orderError } = await supabase.functions.invoke('verify-otp-and-create-order', {
        body: {
          phoneNumber: orderData.phoneNumber,
          otpCode: 'verified', // OTP already verified
          skipOTPVerification: true,
          orderData: {
            ...orderData,
            paymentMethod: selectedGateway.name,
            transactionId: transactionId
          }
        }
      });

      if (orderError) throw orderError;
      if (!orderResponse.success || !orderResponse.orderId) {
        throw new Error('Failed to create order');
      }

      const newOrderId = orderResponse.orderId;
      setCreatedOrderId(newOrderId);

      // Handle Binance auto-verification
      if (selectedGateway.name === 'binance_pay') {
        setIsVerifyingBinance(true);
        const verified = await PaymentService.verifyBinancePayment(transactionId, newOrderId, orderAmount);
        
        if (verified) {
          toast({
            title: "Payment Verified",
            description: "Your Binance payment has been automatically verified!",
          });
          onPaymentSubmitted?.(newOrderId);
          return;
        } else {
          setFailedTransactionId(transactionId);
          setShowContactSupport(true);
          toast({
            title: "Verification Failed",
            description: "Payment verification failed. Please contact support.",
            variant: "destructive"
          });
          return;
        }
      }

      // Handle other payment methods - submit for manual verification
      const success = await PaymentService.submitTransaction(
        newOrderId,
        selectedGateway.name,
        transactionId,
        orderAmount
      );

      if (success) {
        toast({
          title: "Payment Verified",
          description: "Your payment has been confirmed! Completing your order...",
        });
        onPaymentSubmitted?.(newOrderId);
      } else {
        setFailedTransactionId(transactionId);
        setShowContactSupport(true);
        throw new Error('Failed to submit payment');
      }
    } catch (error) {
      setFailedTransactionId(transactionId);
      setShowContactSupport(true);
      toast({
        title: "Submission Failed",
        description: "Failed to submit payment. Please contact support.",
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
        description: "Please enter your transaction ID",
        variant: "destructive"
      });
      return;
    }

    setIsVerifyingBinance(true);
    setVerificationFailed(false);
    
    try {
      // Check if transaction exists in SMS records first
      const smsExists = await PaymentService.checkSMSTransaction(transactionId);
      
      if (!smsExists) {
        setVerificationFailed(true);
        setFailedTransactionId(transactionId);
        toast({
          title: "Transaction Not Found",
          description: "We couldn't find this transaction ID. Please contact support.",
          variant: "destructive"
        });
        return;
      }

      // Create order first with COD
      const { data: orderResponse, error: orderError } = await supabase.functions.invoke('verify-otp-and-create-order', {
        body: {
          phoneNumber: orderData.phoneNumber,
          otpCode: 'verified',
          skipOTPVerification: true,
          orderData: {
            ...orderData,
            paymentMethod: 'cod',
            advanceAmount: 100,
            transactionId: transactionId
          }
        }
      });

      if (orderError) throw orderError;
      if (!orderResponse.success || !orderResponse.orderId) {
        throw new Error('Failed to create order');
      }

      const newOrderId = orderResponse.orderId;
      setCreatedOrderId(newOrderId);

      // Create advance payment record
      const advancePaymentId = await PaymentService.createAdvancePayment(newOrderId, 100, 'binance_pay');
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

      if (!transactionSubmitted) {
        console.error('Failed to create transaction verification record');
      }

      // Verify the advance payment
      const verified = await PaymentService.verifyBinancePayment(transactionId, newOrderId, 100);
      
      if (verified) {
        toast({
          title: "Advance Payment Verified",
          description: "Your order is confirmed! You'll pay the remaining amount on delivery.",
        });
        setShowAdvancePayment(false);
        onPaymentSubmitted?.(newOrderId);
      } else {
        setVerificationFailed(true);
        setFailedTransactionId(transactionId);
        toast({
          title: "Verification Failed",
          description: "Payment verification failed. Please contact support.",
          variant: "destructive"
        });
      }
    } catch (error) {
      setVerificationFailed(true);
      setFailedTransactionId(transactionId);
      toast({
        title: "Verification Error",
        description: "Failed to verify payment. Please contact support.",
        variant: "destructive"
      });
    } finally {
      setIsVerifyingBinance(false);
    }
  };

  const handleContactSupport = () => {
    const message = encodeURIComponent(`I have sent 100BDT but order not submitted, kindly check and confirm my order thank you. Transaction ID: ${failedTransactionId}`);
    window.open(`https://wa.me/+8801775777308?text=${message}`, '_blank');
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
                  <>Pay <strong>100 BDT delivery charge</strong> to confirm your order. Remaining <strong>৳{orderAmount - 100}</strong> will be collected on delivery.</>
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
               selectedGateway.name === 'cod' ? 'Submit Order' : 'Submit Order'}
            </Button>

            {showContactSupport && (
              <Button 
                variant="default"
                onClick={handleContactSupport}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Contact Support via WhatsApp
              </Button>
            )}
          </div>
        )}

        {showAdvancePayment && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Pay <strong>100 BDT delivery charge</strong> to confirm your Cash on Delivery order.
                Remaining <strong>৳{orderAmount - 100}</strong> will be collected when your order is delivered.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="advanceTransactionId">Transaction ID</Label>
              <Input
                id="advanceTransactionId"
                placeholder="Enter transaction ID for 100 BDT"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Pay exactly 100 BDT and enter the transaction ID
              </p>
            </div>

            <Button 
              onClick={handleAdvancePayment}
              disabled={isVerifyingBinance || !transactionId.trim()}
              className="w-full"
            >
              {isVerifyingBinance ? 'Verifying...' : 'Submit Order'}
            </Button>

            {verificationFailed && (
              <Button 
                variant="default"
                onClick={handleContactSupport}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Contact Support via WhatsApp
              </Button>
            )}

            <Button 
              variant="outline"
              onClick={() => {
                setShowAdvancePayment(false);
                setSelectedGateway(null);
                setTransactionId('');
                setVerificationFailed(false);
                setFailedTransactionId('');
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