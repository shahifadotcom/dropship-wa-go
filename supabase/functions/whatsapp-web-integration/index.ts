import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// WhatsApp Web JS integration
let currentQRCode = '';
let isConnected = false;
let sessionActive = false;
let client = null;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, phoneNumber, message } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`WhatsApp action: ${action}`);

    switch (action) {
      case 'initialize': {
        try {
          console.log('Initializing WhatsApp Web client...');
          
          // For now, we'll simulate real QR generation since whatsapp-web.js requires puppeteer
          // In production, this would use actual WhatsApp Web JS with proper server setup
          
          // Generate a more realistic QR code format
          const timestamp = Date.now();
          const sessionId = Math.random().toString(36).substring(2, 15);
          const realQRCode = `${timestamp},${sessionId},44d3oa9r5uqa9r3a4rqo34iar8a9r4r3a4rqo3oiar54i8a9r4`;
          
          currentQRCode = realQRCode;
          isConnected = false;
          sessionActive = true;
          
          // Store QR code in database immediately
          await supabase
            .from('whatsapp_config')
            .upsert({
              qr_code: realQRCode,
              is_connected: false,
              session_data: { initialized: true, timestamp: new Date().toISOString() }
            });
          
          // Simulate QR code timeout after 2 minutes
          setTimeout(async () => {
            if (!isConnected && currentQRCode === realQRCode) {
              currentQRCode = '';
              await supabase
                .from('whatsapp_config')
                .upsert({
                  qr_code: null,
                  is_connected: false,
                  session_data: { expired: true, timestamp: new Date().toISOString() }
                });
            }
          }, 120000);
          
          console.log('WhatsApp client initialization started');
          
          return new Response(
            JSON.stringify({ 
              success: true,
              message: 'WhatsApp client initialization started. Waiting for QR code...'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } catch (error) {
          console.error('Error initializing WhatsApp:', error);
          return new Response(
            JSON.stringify({ 
              success: false,
              message: 'Failed to initialize WhatsApp client',
              error: error.message
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      case 'get_qr': {
        console.log('Getting QR code...');
        
        return new Response(
          JSON.stringify({ 
            success: true,
            qrCode: currentQRCode || null,
            isReady: isConnected
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'send_message': {
        if (!phoneNumber || !message) {
          return new Response(
            JSON.stringify({ error: 'Phone number and message are required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        if (!isConnected || !client) {
          return new Response(
            JSON.stringify({ error: 'WhatsApp client is not connected' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        try {
          // Format phone number for WhatsApp (remove any non-digits and add country code if needed)
          const formattedNumber = phoneNumber.replace(/\D/g, '');
          const chatId = `${formattedNumber}@c.us`;
          
          // Send message using WhatsApp Web JS
          await client.sendMessage(chatId, message);
          
          console.log(`Message sent to ${phoneNumber}: ${message}`);
          
          // Log the message
          await supabase
            .from('notification_logs')
            .insert({
              phone_number: phoneNumber,
              message: message,
              status: 'sent'
            });

          return new Response(
            JSON.stringify({ 
              success: true,
              messageId: `msg_${Date.now()}`,
              timestamp: Date.now()
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } catch (error) {
          console.error('Error sending message:', error);
          
          // Log the error
          await supabase
            .from('notification_logs')
            .insert({
              phone_number: phoneNumber,
              message: message,
              status: 'failed',
              error_message: error.message
            });

          return new Response(
            JSON.stringify({ 
              success: false,
              error: 'Failed to send message',
              details: error.message
            }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      case 'simulate_connect': {
        console.log('Simulating WhatsApp connection...');
        
        // Simulate scanning QR code - mark as connected
        isConnected = true;
        currentQRCode = '';
        
        // Update database to reflect connection
        await supabase
          .from('whatsapp_config')
          .upsert({
            qr_code: null,
            is_connected: true,
            session_data: { 
              connected: true, 
              simulated: true,
              timestamp: new Date().toISOString() 
            }
          });

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'WhatsApp connected successfully (simulated)',
            isReady: true
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'status': {
        // Check database for latest status
        const { data: dbData } = await supabase
          .from('whatsapp_config')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (dbData && dbData.length > 0) {
          const latest = dbData[0];
          isConnected = latest.is_connected || false;
          currentQRCode = latest.qr_code || '';
        }
        
        return new Response(
          JSON.stringify({ 
            success: true,
            isReady: isConnected,
            qrCode: currentQRCode
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'disconnect': {
        console.log('Disconnecting WhatsApp...');
        
        try {
          if (client) {
            await client.destroy();
            client = null;
          }
          
          isConnected = false;
          currentQRCode = '';
          sessionActive = false;
          
          // Update database
          await supabase
            .from('whatsapp_config')
            .delete()
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

          return new Response(
            JSON.stringify({ 
              success: true,
              message: 'WhatsApp client disconnected'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } catch (error) {
          console.error('Error disconnecting WhatsApp:', error);
          return new Response(
            JSON.stringify({ 
              success: false,
              message: 'Error disconnecting WhatsApp client',
              error: error.message
            }),
            { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('Error in whatsapp-web-integration function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});