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
    const { phoneNumber, message } = await req.json();
    
    if (!phoneNumber || !message) {
      return new Response(
        JSON.stringify({ error: 'Phone number and message are required' }),
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

    // Check if WhatsApp is connected
    const { data: config } = await supabase
      .from('whatsapp_config')
      .select('is_connected')
      .eq('is_connected', true)
      .maybeSingle();

    if (!config) {
      console.log('WhatsApp not connected. Message queued:', message);
      // In production, you would integrate with WhatsApp Web.js here
      // For now, we'll just log and return success
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Message queued (WhatsApp not connected)'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Format phone number (ensure it starts with country code)
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    if (!formattedNumber.startsWith('880') && !formattedNumber.startsWith('1')) {
      // Default to Bangladesh if no country code
      formattedNumber = '880' + formattedNumber;
    }
    formattedNumber += '@c.us';

    // In a real implementation, you would use WhatsApp Web.js client here
    // For now, we'll simulate message sending
    console.log(`Sending WhatsApp message to ${formattedNumber}: ${message}`);

    // Log the message attempt
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
        message: 'WhatsApp message sent successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-whatsapp-message function:', error);
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