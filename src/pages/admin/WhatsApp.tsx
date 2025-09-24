import { useState, useEffect, useRef } from "react";
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
  clientInfo?: string;
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
  const [connectionLog, setConnectionLog] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchMessageStats();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    const wsUrl = `wss://mofwljpreecqqxkilywh.supabase.co/functions/v1/whatsapp-realtime`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    wsRef.current = new WebSocket(wsUrl);
    
    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      addLog('WebSocket connected successfully');
    };
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message:', data);
        
        switch (data.type) {
          case 'status':
            setStatus({
              isConnected: data.isConnected || false,
              isReady: data.isConnected || false,
              qrCode: data.qrCode,
              clientInfo: data.clientInfo,
              sessionData: data.sessionData
            });
            break;
            
          case 'qr':
            generateQRImage(data.qrCode);
            addLog('QR code generated - scan with WhatsApp');
            break;
            
          case 'ready':
            setStatus(prev => ({
              ...prev,
              isConnected: true,
              isReady: true,
              clientInfo: data.clientInfo,
              sessionData: data.sessionData
            }));
            setQrDataUrl(null);
            toast.success(`WhatsApp connected: ${data.clientInfo}`);
            addLog(`WhatsApp connected: ${data.clientInfo}`);
            break;
            
          case 'disconnected':
            setStatus({
              isConnected: false,
              isReady: false
            });
            setQrDataUrl(null);
            addLog('WhatsApp disconnected');
            break;
            
          case 'message_sent':
            toast.success('Test message sent successfully');
            addLog(`Message sent to ${data.phoneNumber}`);
            fetchMessageStats();
            break;
            
          case 'message_error':
            toast.error(`Failed to send message: ${data.error}`);
            addLog(`Failed to send message: ${data.error}`);
            break;
            
          case 'error':
            toast.error(data.message);
            addLog(`Error: ${data.message}`);
            break;
            
          case 'initializing':
            addLog('Initializing WhatsApp client...');
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    wsRef.current.onclose = (event) => {
      console.log('WebSocket closed:', event);
      addLog('WebSocket connection closed');
      
      // Reconnect after 3 seconds if not manually closed
      if (event.code !== 1000) {
        setTimeout(connectWebSocket, 3000);
      }
    };
    
    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      addLog('WebSocket connection error');
    };
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setConnectionLog(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
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

  const initializeWhatsApp = () => {
    setLoading(true);
    connectWebSocket();
    
    // Wait for connection then send initialize message
    const checkConnection = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'initialize' }));
        addLog('Initializing WhatsApp connection...');
        setLoading(false);
      } else {
        setTimeout(checkConnection, 100);
      }
    };
    
    checkConnection();
  };

  const disconnectWhatsApp = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'disconnect' }));
      addLog('Disconnecting WhatsApp...');
    }
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

  const sendTestMessage = () => {
    if (!status.isReady) {
      toast.error('WhatsApp is not ready');
      return;
    }

    const phoneNumber = prompt('Enter phone number (with country code):');
    if (!phoneNumber) return;

    const message = 'Test message from Shahifa Store - WhatsApp integration is working!';
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        action: 'send_message', 
        phoneNumber, 
        text: message 
      }));
      addLog(`Sending test message to ${phoneNumber}`);
    } else {
      toast.error('WebSocket not connected');
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
                  {status.clientInfo && (
                    <Badge variant="outline">{status.clientInfo}</Badge>
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
                  <Button onClick={sendTestMessage} variant="outline" disabled={!status.isReady}>
                    Send Test Message
                  </Button>
                  <Button onClick={disconnectWhatsApp} variant="destructive" disabled={!status.isReady}>
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connection Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Connection Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto bg-muted/30 p-3 rounded-md">
              {connectionLog.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet</p>
              ) : (
                connectionLog.map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    {log}
                  </div>
                ))
              )}
            </div>
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