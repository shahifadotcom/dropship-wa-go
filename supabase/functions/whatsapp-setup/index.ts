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
    
    if (!action) {
      return new Response(
        JSON.stringify({ error: 'Action is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (action) {
      case 'generate_qr': {
        // In a real implementation, this would generate a QR code using WhatsApp Web.js
        // For now, we'll simulate the QR code generation
        
        // Generate a mock QR code data
        const qrData = `whatsapp-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Store the QR code in database
        await supabase
          .from('whatsapp_config')
          .upsert({
            qr_code: qrData,
            is_connected: false,
            session_data: null
          });

        console.log('QR Code generated:', qrData);

        return new Response(
          JSON.stringify({ 
            success: true,
            qrCode: qrData,
            message: 'QR Code generated successfully'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'connect': {
        // This would be called when WhatsApp Web.js successfully connects
        const { sessionData } = await req.json();
        
        await supabase
          .from('whatsapp_config')
          .upsert({
            is_connected: true,
            session_data: sessionData,
            qr_code: null
          });

        console.log('WhatsApp connected successfully');

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

      case 'disconnect': {
        // Clear all WhatsApp configuration
        await supabase
          .from('whatsapp_config')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

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

      case 'status': {
        // Check connection status
        const { data } = await supabase
          .from('whatsapp_config')
          .select('is_connected, qr_code')
          .eq('is_connected', true)
          .maybeSingle();

        return new Response(
          JSON.stringify({ 
            success: true,
            isConnected: !!data?.is_connected,
            qrCode: data?.qr_code || null
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
    console.error('Error in whatsapp-setup function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});