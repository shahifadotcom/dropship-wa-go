import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Global state
let connections = new Map<string, WebSocket>();
let qrCode = '';
let isConnected = false;
let clientInfo = '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  const connectionId = crypto.randomUUID();
  
  socket.onopen = () => {
    console.log(`WebSocket client connected: ${connectionId}`);
    connections.set(connectionId, socket);
    
    // Send current status
    socket.send(JSON.stringify({
      type: 'status',
      isConnected,
      qrCode,
      clientInfo
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const message = JSON.parse(event.data);
      console.log('Received message:', message);

      switch (message.action) {
        case 'initialize':
          await initializeWhatsApp();
          break;
        case 'disconnect':
          await disconnectWhatsApp();
          break;
        case 'send_message':
          await sendMessage(message.phoneNumber, message.text);
          break;
        case 'status':
          socket.send(JSON.stringify({
            type: 'status',
            isConnected,
            qrCode,
            clientInfo
          }));
          break;
      }
    } catch (err) {
      console.error('Error processing message:', err);
      socket.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  };

  socket.onclose = () => {
    console.log(`WebSocket client disconnected: ${connectionId}`);
    connections.delete(connectionId);
  };

  async function initializeWhatsApp() {
    try {
      console.log('Initializing WhatsApp...');
      
      // Broadcast initialization
      broadcastToAll({
        type: 'initializing',
        message: 'Starting WhatsApp connection...'
      });

      // Generate a realistic QR code format
      const timestamp = Date.now();
      qrCode = `1@${generateRandomCode()},${generateRandomCode()},${timestamp},2,AaLp6dd+agWhXQ==,${generateRandomCode()}==,Aw==`;
      
      broadcastToAll({
        type: 'qr',
        qrCode
      });

      // Simulate connection after scanning QR (for demo)
      setTimeout(() => {
        isConnected = true;
        clientInfo = 'WhatsApp Web (+880123456789)';
        
        broadcastToAll({
          type: 'ready',
          clientInfo,
          sessionData: {
            pushname: 'Store Admin',
            number: '880123456789',
            platform: 'web'
          }
        });

        // Store in Supabase
        storeConnectionStatus(true, clientInfo);
      }, 15000); // 15 seconds to scan

    } catch (err) {
      console.error('Error initializing WhatsApp:', err);
      broadcastToAll({
        type: 'error',
        message: 'Failed to initialize WhatsApp'
      });
    }
  }

  async function disconnectWhatsApp() {
    try {
      isConnected = false;
      qrCode = '';
      clientInfo = '';
      
      broadcastToAll({
        type: 'disconnected',
        message: 'WhatsApp disconnected successfully'
      });

      await storeConnectionStatus(false);
      
    } catch (err) {
      console.error('Error disconnecting WhatsApp:', err);
      broadcastToAll({
        type: 'error',
        message: 'Failed to disconnect WhatsApp'
      });
    }
  }

  async function sendMessage(phoneNumber: string, text: string) {
    try {
      if (!isConnected) {
        throw new Error('WhatsApp not connected');
      }

      console.log(`Sending message to ${phoneNumber}: ${text}`);
      
      // Simulate sending delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      broadcastToAll({
        type: 'message_sent',
        phoneNumber,
        text,
        success: true
      });

      // Log message
      await logMessage(phoneNumber, text, 'sent');
      
    } catch (err) {
      console.error('Error sending message:', err);
      broadcastToAll({
        type: 'message_error',
        phoneNumber,
        text,
        error: 'Failed to send message'
      });

      await logMessage(phoneNumber, text, 'failed', 'Connection error');
    }
  }

  function broadcastToAll(message: any) {
    const messageStr = JSON.stringify(message);
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  function generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async function storeConnectionStatus(connected: boolean, info?: string) {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Clear old entries
      await supabase.from('whatsapp_config').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      if (connected && info) {
        await supabase.from('whatsapp_config').insert({
          is_connected: true,
          qr_code: info,
          session_data: { connected_at: new Date().toISOString() },
          created_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('Error storing connection status:', err);
    }
  }

  async function logMessage(phoneNumber: string, message: string, status: string, errorMessage?: string) {
    try {
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
    } catch (err) {
      console.error('Error logging message:', err);
    }
  }

  return response;
});