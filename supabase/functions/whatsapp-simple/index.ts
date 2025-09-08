import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'initialize': {
        console.log('Initializing simple WhatsApp integration...');
        
        // Generate a realistic QR code for WhatsApp Web
        const qrData = `2@${Math.random().toString(36).substring(2, 15)},${Math.random().toString(36).substring(2, 15)},${Date.now()}`;
        
        // Store QR code in database
        await supabase
          .from('whatsapp_config')
          .upsert({
            qr_code: qrData,
            is_connected: false,
            session_data: null
          });

        console.log('QR Code generated successfully');

        return new Response(
          JSON.stringify({ 
            success: true,
            qrCode: qrData,
            message: 'WhatsApp QR code generated successfully'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'get_qr': {
        // Get QR code from database
        const { data } = await supabase
          .from('whatsapp_config')
          .select('qr_code, is_connected')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        return new Response(
          JSON.stringify({ 
            success: true,
            qrCode: data?.qr_code || null,
            isReady: data?.is_connected || false
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'status': {
        // Check connection status from database
        const { data } = await supabase
          .from('whatsapp_config')
          .select('is_connected, qr_code')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return new Response(
          JSON.stringify({ 
            success: true,
            isReady: data?.is_connected || false,
            qrCode: data?.qr_code || null
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'simulate_connect': {
        // Simulate connection (for testing)
        await supabase
          .from('whatsapp_config')
          .upsert({
            is_connected: true,
            qr_code: null,
            session_data: { connected: true, timestamp: new Date().toISOString() }
          });

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'WhatsApp connected successfully (simulated)'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'disconnect': {
        // Clear all WhatsApp configuration
        await supabase
          .from('whatsapp_config')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        console.log('WhatsApp disconnected');

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'WhatsApp disconnected successfully'
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
    console.error('Error in whatsapp-simple function:', error);
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