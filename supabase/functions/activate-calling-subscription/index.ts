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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { orderId, userId } = await req.json();

    if (!orderId || !userId) {
      throw new Error('Missing orderId or userId');
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    // Check if order contains calling subscription product
    const callingProductSKUs = ['CALLING-1M', 'CALLING-3M', 'CALLING-6M'];
    const subscriptionItem = order.order_items.find((item: any) => 
      callingProductSKUs.includes(item.product_id)
    );

    if (!subscriptionItem) {
      return new Response(
        JSON.stringify({ message: 'No subscription product in order' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine subscription duration based on SKU
    let durationMonths = 1;
    const { data: product } = await supabaseClient
      .from('products')
      .select('sku')
      .eq('id', subscriptionItem.product_id)
      .single();

    if (product?.sku === 'CALLING-3M') durationMonths = 3;
    if (product?.sku === 'CALLING-6M') durationMonths = 6;

    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

    // Deactivate any existing active subscriptions
    await supabaseClient
      .from('calling_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'active');

    // Create new subscription
    const { data: subscription, error: subError } = await supabaseClient
      .from('calling_subscriptions')
      .insert({
        user_id: userId,
        plan_duration: durationMonths,
        price: order.total,
        currency: 'BDT',
        status: 'active',
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (subError) {
      console.error('Error creating subscription:', subError);
      throw new Error('Failed to activate subscription');
    }

    console.log('Subscription activated:', subscription);

    return new Response(
      JSON.stringify({ 
        success: true, 
        subscription,
        message: `Subscription activated for ${durationMonths} month(s)` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
