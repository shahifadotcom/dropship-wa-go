import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, QrCode, MessageSquare, Settings, Users, Activity } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/layouts/AdminLayout";

interface WhatsAppStatus {
  isConnected: boolean;
  isReady: boolean;
  qrCode?: string;
  sessionData?: any;
  phoneNumber?: string;
}

const WhatsApp = () => {
  const [status, setStatus] = useState<WhatsAppStatus>({
    isConnected: false,
    isReady: false
  });
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [messageStats, setMessageStats] = useState({
    total: 0,
    today: 0,
    failed: 0
  });

  useEffect(() => {
    checkWhatsAppStatus();
    fetchMessageStats();
    const interval = setInterval(checkWhatsAppStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkWhatsAppStatus = async () => {
    try {
      const { data: config, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching WhatsApp config:', error);
        return;
      }

      if (config) {
        setStatus({
          isConnected: config.is_connected || false,
          isReady: config.is_connected || false,
          sessionData: config.session_data,
          phoneNumber: config.qr_code || undefined
        });
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
    }
  };

  const fetchMessageStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: totalMessages } = await supabase
        .from('notification_logs')
        .select('id', { count: 'exact' });

      const { data: todayMessages } = await supabase
        .from('notification_logs')
        .select('id', { count: 'exact' })
        .gte('created_at', today);

      const { data: failedMessages } = await supabase
        .from('notification_logs')
        .select('id', { count: 'exact' })
        .eq('status', 'failed');

      setMessageStats({
        total: totalMessages?.length || 0,
        today: todayMessages?.length || 0,
        failed: failedMessages?.length || 0
      });
    } catch (error) {
      console.error('Error fetching message stats:', error);
    }
  };

  const initializeWhatsApp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-web-integration', {
        body: { action: 'initialize' }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('WhatsApp initialization started');
        pollForQR();
      } else {
        toast.error(data.message || 'Failed to initialize WhatsApp');
      }
    } catch (error) {
      console.error('Error initializing WhatsApp:', error);
      toast.error('Failed to initialize WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const pollForQR = async () => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        toast.error('QR code generation timeout');
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('whatsapp-web-integration', {
          body: { action: 'get_qr' }
        });

        if (error) throw error;

        if (data.qr_code && data.qr_code !== 'pending') {
          await generateQRImage(data.qr_code);
          setLoading(false);
          checkForConnection();
        } else if (data.connected) {
          toast.success('WhatsApp connected successfully!');
          setLoading(false);
          checkWhatsAppStatus();
        } else {
          attempts++;
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Error polling for QR:', error);
        attempts++;
        setTimeout(poll, 2000);
      }
    };

    poll();
  };

  const generateQRImage = async (qrString: string) => {
    try {
      const QRCode = await import('qrcode');
      const dataUrl = await QRCode.toDataURL(qrString, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setQrDataUrl(`data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
          <rect width="256" height="256" fill="#f3f4f6"/>
          <text x="128" y="128" text-anchor="middle" font-family="Arial" font-size="14" fill="#6b7280">
            QR Code Error
          </text>
        </svg>
      `)}`);
    }
  };

  const checkForConnection = () => {
    const connectionCheck = setInterval(async () => {
      try {
        const { data, error } = await supabase.functions.invoke('whatsapp-web-integration', {
          body: { action: 'status' }
        });

        if (error) throw error;

        if (data.connected) {
          clearInterval(connectionCheck);
          toast.success('WhatsApp connected successfully!');
          setQrDataUrl(null);
          checkWhatsAppStatus();
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }, 3000);

    setTimeout(() => clearInterval(connectionCheck), 60000);
  };

  const disconnectWhatsApp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-web-integration', {
        body: { action: 'disconnect' }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('WhatsApp disconnected successfully');
        setStatus({ isConnected: false, isReady: false });
        setQrDataUrl(null);
      } else {
        toast.error('Failed to disconnect WhatsApp');
      }
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      toast.error('Failed to disconnect WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = async () => {
    if (!status.isReady) {
      toast.error('WhatsApp is not ready');
      return;
    }

    const phoneNumber = prompt('Enter phone number (with country code):');
    if (!phoneNumber) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phoneNumber,
          message: 'Test message from Shahifa Store - WhatsApp integration is working!'
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Test message sent successfully');
        fetchMessageStats();
      } else {
        toast.error(data.message || 'Failed to send test message');
      }
    } catch (error) {
      console.error('Error sending test message:', error);
      toast.error('Failed to send test message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">WhatsApp Integration</h1>
            <p className="text-muted-foreground">
              Connect and manage WhatsApp Web for automated notifications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            <Badge variant={status.isReady ? "default" : "secondary"}>
              {status.isReady ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messageStats.total}</div>
              <p className="text-xs text-muted-foreground">All time sent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Messages</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{messageStats.today}</div>
              <p className="text-xs text-muted-foreground">Sent today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Messages</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{messageStats.failed}</div>
              <p className="text-xs text-muted-foreground">Failed to send</p>
            </CardContent>
          </Card>
        </div>

        {/* WhatsApp Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              WhatsApp Connection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!status.isReady ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Connect your WhatsApp account to enable automated notifications
                </p>
                
                {qrDataUrl && (
                  <div className="flex flex-col items-center space-y-4">
                    <div className="p-4 bg-white rounded-lg border">
                      <img src={qrDataUrl} alt="WhatsApp QR Code" className="w-64 h-64" />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="font-medium">Scan QR Code with WhatsApp</p>
                      <p className="text-sm text-muted-foreground">
                        1. Open WhatsApp on your phone<br/>
                        2. Go to Settings → Linked Devices<br/>
                        3. Tap "Link a Device" and scan this QR code
                      </p>
                    </div>
                  </div>
                )}

                <Button 
                  onClick={initializeWhatsApp} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Connecting...' : 'Connect WhatsApp'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>WhatsApp is connected and ready</span>
                  {status.phoneNumber && (
                    <Badge variant="outline">{status.phoneNumber}</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Available Features:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ Order confirmation messages</li>
                    <li>✓ Shipping notifications</li>
                    <li>✓ Delivery confirmations</li>
                    <li>✓ Customer support messages</li>
                  </ul>
                </div>

                <div className="flex gap-2">
                  <Button onClick={sendTestMessage} variant="outline" disabled={loading}>
                    Send Test Message
                  </Button>
                  <Button onClick={disconnectWhatsApp} variant="destructive" disabled={loading}>
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Order Confirmations</p>
                  <p className="text-sm text-muted-foreground">Send WhatsApp message when order is confirmed</p>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Shipping Updates</p>
                  <p className="text-sm text-muted-foreground">Notify customers when order ships</p>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delivery Confirmations</p>
                  <p className="text-sm text-muted-foreground">Send confirmation when order is delivered</p>
                </div>
                <Badge variant="default">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default WhatsApp;