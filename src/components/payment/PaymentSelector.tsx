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
  onPaymentSubmitted?: () => void;
}

export const PaymentSelector = ({ orderId, orderAmount, onPaymentSubmitted }: PaymentSelectorProps) => {
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { effectiveCountry } = useCountryDetection();
  const { toast } = useToast();

  useEffect(() => {
    const loadPaymentGateways = async () => {
      if (!effectiveCountry?.id) {
        // Fallback to Bangladesh payment gateways
        const gateways = await PaymentService.getBangladeshPaymentGateways();
        setPaymentGateways(gateways);
      } else {
        const gateways = await PaymentService.getPaymentGateways(effectiveCountry.id);
        setPaymentGateways(gateways);
      }
    };

    loadPaymentGateways();
  }, [effectiveCountry]);

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

        {selectedGateway && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Send <strong>৳{orderAmount}</strong> to <strong>{selectedGateway.wallet_number}</strong> 
                using {selectedGateway.display_name}, then enter your transaction ID below.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                placeholder="Enter your transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                You will receive this ID via SMS after completing the payment
              </p>
            </div>

            <Button 
              onClick={handleSubmitPayment}
              disabled={isSubmitting || !transactionId.trim()}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Verify Payment'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};