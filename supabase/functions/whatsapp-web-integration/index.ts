import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory storage for QR code and status
let currentQRCode = '';
let isConnected = false;
let sessionActive = false;

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
          
          // Generate a realistic mock QR code for testing
          const mockQRCode = `2@${Math.random().toString(36).substr(2, 9)},${Math.random().toString(36).substr(2, 9)},${Math.random().toString(36).substr(2, 9)}==,${Math.random().toString(36).substr(2, 9)},${Math.random().toString(36).substr(2, 9)},${Math.random().toString(36).substr(2, 9)}`;
          
          currentQRCode = mockQRCode;
          isConnected = false;
          sessionActive = true;
          
          // Store QR code in database
          await supabase
            .from('whatsapp_config')
            .upsert({
              qr_code: mockQRCode,
              is_connected: false,
              session_data: { initialized: true, timestamp: new Date().toISOString() }
            });
          
          console.log('QR code generated and stored');
          
          return new Response(
            JSON.stringify({ 
              success: true,
              message: 'WhatsApp client initialized successfully',
              qrCode: mockQRCode
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

        if (!isConnected) {
          return new Response(
            JSON.stringify({ error: 'WhatsApp client is not connected' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Simulate message sending for now
        console.log(`Simulating message send to ${phoneNumber}: ${message}`);
        
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
      }

      case 'simulate_connect': {
        console.log('Simulating WhatsApp connection...');
        
        isConnected = true;
        currentQRCode = '';
        
        // Update database
        await supabase
          .from('whatsapp_config')
          .upsert({
            qr_code: null,
            is_connected: true,
            session_data: { connected: true, timestamp: new Date().toISOString() }
          });

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'WhatsApp connected successfully'
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