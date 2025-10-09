import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Stripe config
    const { data: config, error: configError } = await supabase
      .from('stripe_config')
      .select('*')
      .single();

    if (configError || !config) {
      throw new Error('Stripe configuration not found');
    }

    // Test Stripe API by fetching account details
    const stripeResponse = await fetch('https://api.stripe.com/v1/balance', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.secret_key}`,
      },
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json();
      throw new Error(errorData.error?.message || 'Invalid Stripe credentials');
    }

    const balance = await stripeResponse.json();

    console.log('Stripe test successful, balance:', balance);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Stripe connection successful',
        mode: config.is_sandbox ? 'test' : 'live'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in stripe-test:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
