import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Import WhatsApp Web JS via CDN for Deno
const { Client, LocalAuth } = await import('https://esm.sh/whatsapp-web.js@1.32.0');

// Global client state
let whatsappClient = null;
let currentQRCode = '';
let isConnected = false;
let isInitializing = false;

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
          
          // Destroy existing client if it exists
          if (whatsappClient) {
            try {
              await whatsappClient.destroy();
            } catch (e) {
              console.log('Error destroying existing client:', e);
            }
          }

          // Create new WhatsApp client with proper configuration for server environment
          whatsappClient = new Client({
            authStrategy: new LocalAuth(),
            puppeteer: {
              headless: true,
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
              ],
            }
          });

          // Set up event listeners
          whatsappClient.on('qr', async (qr) => {
            console.log('QR Code received:', qr.substring(0, 50) + '...');
            currentQRCode = qr;
            isConnected = false;
            
            // Store QR code in database
            await supabase
              .from('whatsapp_config')
              .upsert({
                qr_code: qr,
                is_connected: false,
                session_data: { qr_generated: true, timestamp: new Date().toISOString() }
              });
          });

          whatsappClient.on('ready', async () => {
            console.log('WhatsApp client is ready!');
            isConnected = true;
            currentQRCode = '';
            isInitializing = false;
            
            // Update database to reflect connection
            await supabase
              .from('whatsapp_config')
              .upsert({
                qr_code: null,
                is_connected: true,
                session_data: { 
                  connected: true, 
                  timestamp: new Date().toISOString() 
                }
              });
          });

          whatsappClient.on('authenticated', () => {
            console.log('WhatsApp client authenticated');
          });

          whatsappClient.on('auth_failure', async (msg) => {
            console.error('Authentication failed:', msg);
            isConnected = false;
            isInitializing = false;
            currentQRCode = '';
            
            await supabase
              .from('whatsapp_config')
              .upsert({
                qr_code: null,
                is_connected: false,
                session_data: { 
                  auth_failed: true, 
                  error: msg,
                  timestamp: new Date().toISOString() 
                }
              });
          });

          whatsappClient.on('disconnected', async (reason) => {
            console.log('WhatsApp client disconnected:', reason);
            isConnected = false;
            isInitializing = false;
            currentQRCode = '';
            
            await supabase
              .from('whatsapp_config')
              .upsert({
                qr_code: null,
                is_connected: false,
                session_data: { 
                  disconnected: true, 
                  reason: reason,
                  timestamp: new Date().toISOString() 
                }
              });
          });

          // Initialize the client
          await whatsappClient.initialize();
          
          console.log('WhatsApp client initialization started');
          
          return new Response(
            JSON.stringify({ 
              success: true,
              message: 'WhatsApp client initialization started. Generating QR code...'
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

        if (!isConnected || !whatsappClient) {
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
          await whatsappClient.sendMessage(chatId, message);
          
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
          if (whatsappClient) {
            await whatsappClient.destroy();
            whatsappClient = null;
          }
          
          isConnected = false;
          currentQRCode = '';
          isInitializing = false;
          
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