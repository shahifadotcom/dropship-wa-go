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
import { Loader2, Wallet, Bitcoin, Banknote, CreditCard, Smartphone } from 'lucide-react';

const getPaymentIcon = (gatewayName: string) => {
  const name = gatewayName.toLowerCase();
  if (name.includes('bkash') || name.includes('nagad') || name.includes('rocket')) {
    return Smartphone;
  }
  if (name.includes('binance') || name.includes('crypto')) {
    return Bitcoin;
  }
  if (name.includes('cod') || name.includes('cash')) {
    return Banknote;
  }
  if (name.includes('wallet')) {
    return Wallet;
  }
  return CreditCard;
};

interface PaymentSelectorProps {
  orderAmount: number;
  productId?: string;
  productIds?: string[];
  countryId?: string;
  onPaymentSubmitted: (orderId: string) => void;
  onCODSelected: (isCOD: boolean) => void;
  customerData?: {
    fullName: string;
    fullAddress: string;
    whatsappNumber: string;
    country: string;
  };
  cartItems?: any[];
}

export const PaymentSelector = ({ 
  orderAmount, 
  productId, 
  productIds, 
  countryId: overrideCountryId,
  onPaymentSubmitted,
  onCODSelected,
  customerData,
  cartItems = []
}: PaymentSelectorProps) => {
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvancePayment, setShowAdvancePayment] = useState(false);
  const [isBinancePay, setIsBinancePay] = useState(false);
  const { countryId: detectedCountryId } = useCountryDetection();
  const effectiveCountryId = overrideCountryId || detectedCountryId;
  useEffect(() => {
    const loadPaymentMethods = async () => {
      try {
        let gateways: PaymentGateway[] = [];
        
        if (effectiveCountryId) {
          if (productId) {
            gateways = await PaymentService.getProductPaymentGateways(productId, effectiveCountryId);
          } else if (productIds && productIds.length > 0) {
            gateways = await PaymentService.getMultipleProductsPaymentGateways(productIds, effectiveCountryId);
          } else {
            gateways = await PaymentService.getPaymentGateways(effectiveCountryId);
          }
        }

        setPaymentGateways(gateways);
      } catch (error) {
        console.error('Failed to load payment methods:', error);
        toast.error('Failed to load payment methods');
      }
    };

    loadPaymentMethods();
  }, [productId, productIds, overrideCountryId, detectedCountryId]);

  const handleBinancePayment = async () => {
    if (!selectedGateway) return;
    
    setIsSubmitting(true);
    
    try {
      // Generate temporary reference ID
      const tempReferenceId = `binance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Get Binance config
      const { data: binanceConfig } = await supabase
        .from('binance_config')
        .select('binance_pay_id, merchant_name')
        .eq('is_active', true)
        .maybeSingle();

      if (!binanceConfig) {
        throw new Error('Binance Pay not configured');
      }

      // Open Binance app with deep link using temporary reference
      const binanceDeepLink = `binance://pay?merchant=${encodeURIComponent(binanceConfig.binance_pay_id)}&amount=${orderAmount}&currency=USD&orderId=${tempReferenceId}&merchantName=${encodeURIComponent(binanceConfig.merchant_name || 'Store')}`;
      
      // Try to open Binance app
      window.location.href = binanceDeepLink;
      
      // Fallback to web after a delay
      setTimeout(() => {
        const binanceWebUrl = `https://www.binance.com/en/pay/checkout?merchant=${encodeURIComponent(binanceConfig.binance_pay_id)}&amount=${orderAmount}&currency=USD&orderId=${tempReferenceId}`;
        window.open(binanceWebUrl, '_blank');
      }, 1500);

      toast.success('Complete payment in Binance, then return here to confirm...');
      
      // Poll for Binance payment confirmation via their API
      let paymentConfirmed = false;
      const pollPayment = setInterval(async () => {
        try {
          // Check if Binance payment is confirmed via verification function
          const { data: verifyData } = await supabase.functions.invoke('binance-payment-verify', {
            body: {
              transactionId: tempReferenceId,
              orderId: '',
              amount: orderAmount
            }
          });
          
          if (verifyData?.success) {
            clearInterval(pollPayment);
            paymentConfirmed = true;
            
            // NOW create the order after payment is confirmed
            const { data: orderData, error: orderError } = await supabase.functions.invoke('verify-otp-and-create-order', {
              body: {
                skipOTP: true,
                orderData: {
                  fullName: customerData?.fullName || '',
                  fullAddress: customerData?.fullAddress || '',
                  whatsappNumber: customerData?.whatsappNumber || '',
                  country: customerData?.country || '',
                  items: cartItems,
                  subtotal: orderAmount,
                  total: orderAmount,
                  paymentMethod: 'binance_pay'
                }
              }
            });

            if (orderError || !orderData?.orderId) {
              throw new Error('Payment confirmed but failed to create order');
            }

            toast.success('Payment confirmed! Order created.');
            onPaymentSubmitted(orderData.orderId);
          }
        } catch (error) {
          console.error('Binance verification check error:', error);
        }
      }, 5000);

      // Stop polling after 10 minutes
      setTimeout(() => {
        clearInterval(pollPayment);
        if (!paymentConfirmed) {
          toast.error('Payment verification timeout. Please contact support if payment was made.');
          setIsSubmitting(false);
        }
      }, 600000);

    } catch (error) {
      console.error('Binance payment error:', error);
      toast.error('Failed to process Binance payment');
      setIsSubmitting(false);
    }
  };

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
            fullName: customerData?.fullName || '',
            fullAddress: customerData?.fullAddress || '',
            whatsappNumber: customerData?.whatsappNumber || '',
            country: customerData?.country || '',
            items: cartItems,
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
            fullName: customerData?.fullName || '',
            fullAddress: customerData?.fullAddress || '',
            whatsappNumber: customerData?.whatsappNumber || '',
            country: customerData?.country || '',
            items: cartItems,
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
            const isCOD = gateway?.name === 'cod';
            const isBinance = gateway?.name.toLowerCase().includes('binance');
            setShowAdvancePayment(isCOD);
            setIsBinancePay(isBinance);
            onCODSelected(isCOD);
          }}
          className="gap-3"
        >
          {paymentGateways.map((gateway) => {
            const PaymentIcon = getPaymentIcon(gateway.name);
            const isSelected = selectedGateway?.id === gateway.id;
            
            return (
              <div key={gateway.id} className="relative">
                <div className={`flex items-start gap-4 rounded-lg border-2 p-4 transition-all cursor-pointer hover:border-primary/50 ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border'
                }`}>
                  <RadioGroupItem value={gateway.id} id={gateway.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={gateway.id} className="cursor-pointer">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                          isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          <PaymentIcon className="h-5 w-5" />
                        </div>
                        <div className="font-semibold text-base">{gateway.display_name}</div>
                      </div>
                      {gateway.wallet_number && (
                        <div className="text-sm text-muted-foreground font-mono bg-muted px-3 py-1.5 rounded inline-block mb-2">
                          {gateway.wallet_number}
                        </div>
                      )}
                      {gateway.instructions && (
                        <div className="text-sm text-muted-foreground mt-2 leading-relaxed">
                          {gateway.instructions}
                        </div>
                      )}
                    </Label>
                  </div>
                </div>
              </div>
            );
          })}
        </RadioGroup>

        {isBinancePay && (
          <div className="space-y-4 pt-4 border-t">
            <Alert>
              <AlertDescription>
                Click below to pay with Binance Pay. The Binance app will open automatically.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleBinancePayment} 
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Opening Binance...
                </>
              ) : (
                <>
                  <Bitcoin className="mr-2 h-4 w-4" />
                  Pay with Binance
                </>
              )}
            </Button>
          </div>
        )}

        {selectedGateway && !showAdvancePayment && !isBinancePay && (
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
