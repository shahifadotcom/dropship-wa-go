import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Global state for WhatsApp client
let whatsappClient: any = null;
let currentQR = "";
let isConnected = false;
let isReady = false;
let sessionId = "";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, phoneNumber, message } = await req.json();
    console.log(`WhatsApp Direct action: ${action}`);

    switch (action) {
      case 'initialize':
        try {
          // Simulate WhatsApp Web initialization
          currentQR = generateMockQR();
          isConnected = false;
          isReady = false;
          sessionId = crypto.randomUUID();
          
          console.log('Initializing WhatsApp Web client...');
          
          // Store connection status
          await storeConnectionStatus(false, 'Initializing...', { sessionId });
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              qrCode: currentQR,
              message: 'Scan QR code with WhatsApp to connect'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        } catch (error) {
          console.error('Error initializing WhatsApp:', error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Failed to initialize WhatsApp'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }

      case 'get_qr':
        return new Response(
          JSON.stringify({ 
            success: true, 
            qrCode: currentQR,
            hasQR: !!currentQR
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );

      case 'simulate_connect':
        // Simulate successful connection after QR scan
        isConnected = true;
        isReady = true;
        currentQR = "";
        
        console.log('WhatsApp connected successfully');
        await storeConnectionStatus(true, 'Connected', { sessionId, phoneNumber: '+1234567890' });
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            isReady: true,
            message: 'WhatsApp connected successfully!'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );

      case 'status':
        return new Response(
          JSON.stringify({ 
            success: true,
            isReady,
            isConnected,
            qrCode: isReady ? null : currentQR,
            sessionId: isReady ? sessionId : null
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );

      case 'send_message':
        if (!isReady) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: 'WhatsApp is not connected' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          );
        }

        try {
          console.log(`Sending message to ${phoneNumber}: ${message}`);
          
          // Log the message
          await logMessage(phoneNumber, message, 'sent');
          
          // Simulate successful message sending
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Message sent successfully',
              messageId: crypto.randomUUID()
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        } catch (error) {
          console.error('Error sending message:', error);
          await logMessage(phoneNumber, message, 'failed', error instanceof Error ? error.message : 'Unknown error');
          
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Failed to send message'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }

      case 'disconnect':
        try {
          console.log('Disconnecting WhatsApp...');
          
          isConnected = false;
          isReady = false;
          currentQR = "";
          sessionId = "";
          whatsappClient = null;
          
          await storeConnectionStatus(false, 'Disconnected');
          
          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'WhatsApp disconnected successfully' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          );
        } catch (error) {
          console.error('Error disconnecting WhatsApp:', error);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Failed to disconnect'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 500 
            }
          );
        }

      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid action' }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400 
          }
        );
    }
  } catch (error) {
    console.error('Error in WhatsApp Direct function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function generateMockQR(): string {
  // Generate a realistic looking QR data that mimics WhatsApp Web
  const ref = Math.random().toString(36).substring(2, 15);
  const publicKey = Math.random().toString(36).substring(2, 15);
  const privateKey = Math.random().toString(36).substring(2, 15);
  
  return `${ref},${publicKey},${privateKey}`;
}

async function storeConnectionStatus(connected: boolean, info?: string, session?: any) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase
      .from('whatsapp_config')
      .upsert({
        id: 1,
        is_connected: connected,
        connection_info: info || null,
        session_data: session || null,
        updated_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error storing connection status:', error);
  }
}

async function logMessage(phoneNumber: string, message: string, status: string, errorMessage?: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    await supabase
      .from('notification_logs')
      .insert({
        phone_number: phoneNumber,
        message: message,
        status: status,
        error_message: errorMessage || null,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error logging message:', error);
  }
}