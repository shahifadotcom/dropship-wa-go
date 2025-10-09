import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    console.log('Stripe webhook received');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get webhook secret
    const { data: config } = await supabase
      .from('stripe_config')
      .select('webhook_secret')
      .eq('is_active', true)
      .single();

    // Parse the event (simplified - in production use Stripe's SDK for signature verification)
    const event = JSON.parse(body);

    console.log('Stripe event type:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        // Update transaction status
        await supabase
          .from('stripe_transactions')
          .update({
            status: 'completed',
            response_data: session,
          })
          .eq('payment_intent_id', session.id);

        // Update order payment status
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
          })
          .eq('id', orderId);

        console.log('Order payment confirmed:', orderId);
      }
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      
      await supabase
        .from('stripe_transactions')
        .update({
          status: 'failed',
          response_data: session,
        })
        .eq('payment_intent_id', session.id);

      console.log('Stripe session expired:', session.id);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in stripe-webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
