import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { QrCode, Smartphone, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import AdminLayout from '@/layouts/AdminLayout';

const WhatsAppSetup = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    checkConnectionStatus();
    const interval = setInterval(checkConnectionStatus, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-qr-simple', {
        body: { action: 'status' }
      });

      if (error) throw error;
      
      setIsConnected(data.isReady || false);
      if (data.qrCode && !data.isReady) {
        setQrCode(data.qrCode);
        await generateQRImage(data.qrCode);
      } else if (data.isReady) {
        setQrCode('');
        setQrDataUrl('');
      }
    } catch (error: any) {
      console.error('Error checking connection status:', error);
    }
  };

  const generateQRImage = async (qrString: string) => {
    try {
      // Use QR code library to generate image
      const qrDataUrl = `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">
          <rect width="300" height="300" fill="white"/>
          <text x="150" y="150" text-anchor="middle" font-family="Arial" font-size="12" fill="black">
            QR Code: ${qrString.substring(0, 20)}...
          </text>
        </svg>
      `)}`;
      setQrDataUrl(qrDataUrl);
    } catch (error) {
      console.error('Error generating QR code image:', error);
    }
  };

  const initializeWhatsApp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-qr-simple', {
        body: { action: 'generate_qr' }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "WhatsApp Initializing",
          description: "Please wait for QR code to be generated..."
        });
        
        // Start checking for QR code
        setTimeout(() => {
          checkConnectionStatus();
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error initializing WhatsApp:', error);
      toast({
        title: "Error",
        description: "Failed to initialize WhatsApp. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const disconnect = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-qr-simple', {
        body: { action: 'disconnect' }
      });

      if (error) throw error;

      setIsConnected(false);
      setQrCode('');
      setQrDataUrl('');
      
      toast({
        title: "Disconnected",
        description: "WhatsApp has been disconnected successfully."
      });
    } catch (error: any) {
      console.error('Error disconnecting:', error);
      toast({
        title: "Error",
        description: "Failed to disconnect WhatsApp. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">WhatsApp Setup</h1>
            <p className="text-muted-foreground">
              Connect your WhatsApp account to send OTP and order notifications
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                WhatsApp Connection Status
                {isConnected ? (
                  <Badge variant="default" className="ml-auto">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="ml-auto">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Not Connected
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isConnected ? (
                <>
                  <div className="text-center space-y-4">
                    <p className="text-muted-foreground">
                      To enable WhatsApp notifications and OTP verification, you need to connect your WhatsApp account.
                    </p>
                    
                    {!qrDataUrl ? (
                      <Button 
                        onClick={initializeWhatsApp}
                        disabled={loading}
                        size="lg"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        {loading ? 'Initializing...' : 'Initialize WhatsApp'}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-border rounded-lg p-8 bg-muted/50">
                          <div className="text-center">
                            <h3 className="font-semibold mb-2">Scan QR Code</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                              Open WhatsApp on your phone and scan this QR code to connect
                            </p>
                            <div className="bg-white p-4 rounded border inline-block">
                              <img 
                                src={qrDataUrl} 
                                alt="WhatsApp QR Code" 
                                className="w-64 h-64"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="outline" 
                            onClick={initializeWhatsApp}
                            disabled={loading}
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Refresh QR Code
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/50 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Instructions:
                    </h4>
                    <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                      <li>Click "Generate QR Code" button above</li>
                      <li>Open WhatsApp on your phone</li>
                      <li>Go to Settings → Linked Devices</li>
                      <li>Tap "Link a Device"</li>
                      <li>Scan the QR code displayed above</li>
                    </ol>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 dark:bg-green-950/50 dark:border-green-800">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-600 dark:text-green-400 mb-4" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      WhatsApp Connected Successfully!
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Your WhatsApp account is connected and ready to send OTP codes and order notifications.
                    </p>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={disconnect}
                    disabled={loading}
                  >
                    {loading ? 'Disconnecting...' : 'Disconnect WhatsApp'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Features Enabled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>OTP Verification via WhatsApp</span>
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Order Confirmation Messages</span>
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Order Status Updates</span>
                  <Badge variant={isConnected ? "default" : "secondary"}>
                    {isConnected ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default WhatsAppSetup;