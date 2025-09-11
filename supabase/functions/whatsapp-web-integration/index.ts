import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Global state for WhatsApp simulation
let currentQRCode = '';
let isConnected = false;
let isInitializing = false;
let sessionId = '';

// Generate a realistic WhatsApp QR code format
const generateWhatsAppQR = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const serverRef = Math.random().toString(36).substring(2, 8);
  
  // WhatsApp QR codes typically follow this format
  return `1@${random},${serverRef},${timestamp}`;
};

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
          
          if (isInitializing) {
            return new Response(
              JSON.stringify({ 
                success: false,
                message: 'WhatsApp client is already initializing'
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }

          isInitializing = true;
          
          // Generate a new session ID
          sessionId = `whatsapp_session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
          
          // Generate a realistic WhatsApp QR code
          currentQRCode = generateWhatsAppQR();
          isConnected = false;
          
          console.log('Generated WhatsApp QR Code:', currentQRCode.substring(0, 50) + '...');
          
          // Store QR code in database
          await supabase
            .from('whatsapp_config')
            .upsert({
              qr_code: currentQRCode,
              is_connected: false,
              session_data: { 
                qr_generated: true, 
                session_id: sessionId,
                timestamp: new Date().toISOString(),
                expires_at: new Date(Date.now() + 60000).toISOString() // QR expires in 1 minute
              }
            });
          
          // Set timeout for QR expiration
          setTimeout(async () => {
            if (!isConnected && currentQRCode) {
              console.log('QR Code expired, generating new one...');
              currentQRCode = generateWhatsAppQR();
              
              await supabase
                .from('whatsapp_config')
                .upsert({
                  qr_code: currentQRCode,
                  is_connected: false,
                  session_data: { 
                    qr_regenerated: true, 
                    session_id: sessionId,
                    timestamp: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 60000).toISOString()
                  }
                });
            }
          }, 60000); // Refresh QR every minute
          
          isInitializing = false;
          
          console.log('WhatsApp QR code generated successfully');
          
          return new Response(
            JSON.stringify({ 
              success: true,
              message: 'WhatsApp QR code generated. Scan with your mobile device.',
              qrCode: currentQRCode
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        } catch (error) {
          console.error('Error initializing WhatsApp:', error);
          isInitializing = false;
          return new Response(
            JSON.stringify({ 
              success: false,
              message: 'Failed to generate WhatsApp QR code',
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

        if (!isConnected) {
          return new Response(
            JSON.stringify({ error: 'WhatsApp client is not connected' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        try {
          // Format phone number for WhatsApp
          const formattedNumber = phoneNumber.replace(/\D/g, '');
          
          console.log(`Simulating message send to ${formattedNumber}: ${message}`);
          
          // Log the message as sent (simulation)
          await supabase
            .from('notification_logs')
            .insert({
              phone_number: phoneNumber,
              message: message,
              status: 'sent',
              session_data: { 
                simulated: true, 
                session_id: sessionId,
                timestamp: new Date().toISOString() 
              }
            });

          return new Response(
            JSON.stringify({ 
              success: true,
              messageId: `msg_${Date.now()}`,
              timestamp: Date.now(),
              simulated: true
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
          isConnected = false;
          currentQRCode = '';
          isInitializing = false;
          sessionId = '';
          
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