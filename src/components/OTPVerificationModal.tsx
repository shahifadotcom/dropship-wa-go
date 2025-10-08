import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onVerificationSuccess: (phoneNumber: string, otpCode: string) => void;
  orderData: any;
}

export const OTPVerificationModal = ({ 
  isOpen, 
  onClose, 
  phoneNumber, 
  onVerificationSuccess, 
  orderData 
}: OTPVerificationModalProps) => {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit OTP.",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    
    try {
      // Just verify OTP (don't create order yet)
      const { data: verificationData, error: verifyError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('otp_code', otp)
        .eq('is_verified', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (verifyError || !verificationData) {
        toast({
          title: "Invalid OTP",
          description: "The OTP you entered is incorrect or expired.",
          variant: "destructive"
        });
        return;
      }

      // Mark OTP as verified
      await supabase
        .from('otp_verifications')
        .update({ is_verified: true })
        .eq('id', verificationData.id);

      toast({
        title: "Verification Successful!",
        description: "Creating your order..."
      });
      
      onVerificationSuccess(phoneNumber, otp);
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast({
        title: "Verification Failed",
        description: "An error occurred while verifying OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    
    try {
      const { error } = await supabase.functions.invoke('send-otp', {
        body: { phoneNumber }
      });

      if (error) throw error;

      toast({
        title: "OTP Resent",
        description: "A new OTP has been sent to your WhatsApp number."
      });
    } catch (error: any) {
      console.error('Resend OTP error:', error);
      toast({
        title: "Failed to Resend",
        description: "Could not resend OTP. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>WhatsApp OTP Verification</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              We've sent a 6-digit verification code to
            </p>
            <p className="font-semibold">{phoneNumber}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Please check your WhatsApp messages
            </p>
          </div>

          <div className="flex justify-center">
            <InputOTP 
              value={otp} 
              onChange={setOtp}
              maxLength={6}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={handleVerifyOTP}
              disabled={isVerifying || otp.length !== 6}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>

            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Didn't receive the code?{' '}
              </span>
              <Button 
                variant="link" 
                onClick={handleResendOTP}
                disabled={isResending}
                className="p-0 h-auto text-sm"
              >
                {isResending ? 'Resending...' : 'Resend OTP'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};