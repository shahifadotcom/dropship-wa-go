import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Global state for WhatsApp client and QR code
let whatsappClient: any = null;
let currentQRCode = '';
let isConnected = false;
let clientInfo = '';
let sessionData: any = null;

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  socket.onopen = () => {
    console.log('WebSocket client connected');
    
    // Send current status immediately
    socket.send(JSON.stringify({
      type: 'status',
      isConnected,
      qrCode: currentQRCode,
      clientInfo
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);

      switch (message.action) {
        case 'initialize':
          await initializeWhatsApp(socket);
          break;
        case 'disconnect':
          await disconnectWhatsApp(socket);
          break;
        case 'send_message':
          await sendMessage(socket, message.phoneNumber, message.text);
          break;
        case 'status':
          socket.send(JSON.stringify({
            type: 'status',
            isConnected,
            qrCode: currentQRCode,
            clientInfo,
            sessionData
          }));
          break;
        default:
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Unknown action'
          }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  };

  socket.onclose = () => {
    console.log('WebSocket client disconnected');
  };

  async function initializeWhatsApp(socket: WebSocket) {
    try {
      console.log('Initializing WhatsApp client...');
      
      // For now, we'll simulate WhatsApp Web.js functionality
      // In a real implementation, you'd need to run this in a Node.js environment
      console.log('Simulating WhatsApp Web.js initialization...');
      
      // Simulate QR code generation for demo purposes
      // In production, this would integrate with actual WhatsApp Web.js
      setTimeout(() => {
        const simulatedQR = `https://wa.me/qr/DEMO_QR_${Date.now()}`;
        currentQRCode = simulatedQR;
        socket.send(JSON.stringify({
          type: 'qr',
          qrCode: simulatedQR
        }));
        
        // Simulate connection after 10 seconds
        setTimeout(() => {
          isConnected = true;
          clientInfo = 'Demo WhatsApp (+1234567890)';
          sessionData = {
            pushname: 'Demo User',
            number: '1234567890',
            platform: 'web'
          };

          socket.send(JSON.stringify({
            type: 'ready',
            clientInfo,
            sessionData
          }));

          storeConnectionStatus(true, clientInfo, sessionData);
        }, 10000);
      }, 2000);
      
      socket.send(JSON.stringify({
        type: 'initializing',
        message: 'WhatsApp client is initializing...'
      }));

    } catch (error) {
      console.error('Error initializing WhatsApp:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }

  async function disconnectWhatsApp(socket: WebSocket) {
    try {
      isConnected = false;
      currentQRCode = '';
      clientInfo = '';
      sessionData = null;
      whatsappClient = null;
      
      socket.send(JSON.stringify({
        type: 'disconnected',
        message: 'WhatsApp disconnected successfully'
      }));

      // Update connection status in Supabase
      storeConnectionStatus(false);
      
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: `Failed to disconnect: ${error instanceof Error ? error.message : 'Unknown error'}`
      }));
    }
  }

  async function sendMessage(socket: WebSocket, phoneNumber: string, text: string) {
    try {
      if (!isConnected) {
        throw new Error('WhatsApp client not connected');
      }

      // Simulate message sending for demo
      console.log(`Sending message to ${phoneNumber}: ${text}`);
      
      // Simulate a small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      socket.send(JSON.stringify({
        type: 'message_sent',
        phoneNumber,
        text,
        success: true
      }));

      // Log the message
      logMessage(phoneNumber, text, 'sent');
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.send(JSON.stringify({
        type: 'message_error',
        phoneNumber,
        text,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));

      // Log the failed message
      logMessage(phoneNumber, text, 'failed', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async function storeConnectionStatus(connected: boolean, info?: string, session?: any) {
    try {
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Delete old entries
      await supabase.from('whatsapp_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      if (connected && info) {
        // Insert new connection status
        await supabase.from('whatsapp_config').insert({
          is_connected: true,
          qr_code: info,
          session_data: session || {},
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error storing connection status:', error);
    }
  }

  async function logMessage(phoneNumber: string, message: string, status: string, errorMessage?: string) {
    try {
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      await supabase.from('notification_logs').insert({
        phone_number: phoneNumber,
        message: message,
        status: status,
        error_message: errorMessage,
        sent_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error logging message:', error);
    }
  }

  return response;
});