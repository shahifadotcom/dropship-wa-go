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
    const { phoneNumber } = await req.json();
    
    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
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

    // Rate limiting disabled - unlimited OTP requests allowed

    // Generate secure OTP using database function
    const { data: otpData, error: otpError } = await supabase
      .rpc('generate_secure_otp');

    if (otpError) {
      console.error('OTP generation error:', otpError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate OTP',
          details: otpError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const otpCode = otpData;
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Store OTP in database
    const { error: otpStoreError } = await supabase
      .from('otp_verifications')
      .insert({
        phone_number: phoneNumber,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        is_verified: false
      });

    if (otpStoreError) {
      console.error('Error storing OTP:', otpStoreError);
      throw otpStoreError;
    }

    // Send OTP via WhatsApp
    const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        phoneNumber,
        message: `Your verification code is: ${otpCode}\n\nThis code expires in 10 minutes. Do not share this code with anyone.`
      }
    });

    if (whatsappError) {
      console.error('Error sending WhatsApp message:', whatsappError);
      // Don't throw error here, OTP is still stored and can be used
    }

    // Removed OTP logging for security reasons

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'OTP sent successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-otp function:', error);
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