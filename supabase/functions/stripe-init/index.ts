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
    const { orderId, amount, customerEmail, customerName } = await req.json();

    console.log('Stripe payment init:', { orderId, amount, customerEmail });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Stripe config
    const { data: config, error: configError } = await supabase
      .from('stripe_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      throw new Error('Stripe is not configured or not active');
    }

    // Create Stripe checkout session
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.secret_key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'payment',
        'success_url': `${req.headers.get('origin')}/order-success?session_id={CHECKOUT_SESSION_ID}`,
        'cancel_url': `${req.headers.get('origin')}/checkout`,
        'customer_email': customerEmail,
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': 'Order Payment',
        'line_items[0][price_data][unit_amount]': Math.round(amount * 100).toString(),
        'line_items[0][quantity]': '1',
        'metadata[order_id]': orderId,
      }).toString(),
    });

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.json();
      console.error('Stripe API error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to create Stripe session');
    }

    const session = await stripeResponse.json();

    // Store transaction
    await supabase.from('stripe_transactions').insert({
      order_id: orderId,
      payment_intent_id: session.id,
      amount: amount,
      currency: 'usd',
      status: 'pending',
      customer_email: customerEmail,
      response_data: session,
    });

    console.log('Stripe session created:', session.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sessionUrl: session.url,
        sessionId: session.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in stripe-init:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
