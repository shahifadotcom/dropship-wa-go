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
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { orderId, amount, customerInfo } = await req.json();

    console.log('Initiating SSLCommerz payment for order:', orderId);

    // Get SSLCommerz config
    const { data: config, error: configError } = await supabaseClient
      .from('sslcommerz_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      throw new Error('SSLCommerz is not configured or inactive');
    }

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    const baseUrl = config.is_sandbox 
      ? 'https://sandbox.sslcommerz.com'
      : 'https://securepay.sslcommerz.com';

    const transactionId = `${orderId}-${Date.now()}`;
    
    // Prepare SSLCommerz request
    const sslcommerzData = {
      store_id: config.store_id,
      store_passwd: config.store_password,
      total_amount: amount.toString(),
      currency: 'BDT',
      tran_id: transactionId,
      success_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/sslcommerz-callback?type=success`,
      fail_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/sslcommerz-callback?type=fail`,
      cancel_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/sslcommerz-callback?type=cancel`,
      ipn_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/sslcommerz-ipn`,
      cus_name: customerInfo.name || 'Customer',
      cus_email: customerInfo.email || 'customer@example.com',
      cus_phone: customerInfo.phone || '01700000000',
      cus_add1: customerInfo.address || 'Dhaka',
      cus_city: customerInfo.city || 'Dhaka',
      cus_country: 'Bangladesh',
      shipping_method: 'NO',
      product_name: `Order #${orderId.substring(0, 8)}`,
      product_category: 'General',
      product_profile: 'general',
    };

    console.log('Sending request to SSLCommerz:', baseUrl);

    // Initialize payment session
    const response = await fetch(`${baseUrl}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(sslcommerzData).toString(),
    });

    const result = await response.json();
    console.log('SSLCommerz response:', result);

    if (result.status === 'SUCCESS') {
      // Store transaction record
      const { error: txError } = await supabaseClient
        .from('sslcommerz_transactions')
        .insert({
          order_id: orderId,
          transaction_id: transactionId,
          session_key: result.sessionkey,
          amount: amount,
          currency: 'BDT',
          status: 'pending',
          response_data: result,
        });

      if (txError) {
        console.error('Error storing transaction:', txError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          gatewayUrl: result.GatewayPageURL,
          transactionId: transactionId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error(result.failedreason || 'Failed to initialize payment');
    }
  } catch (error) {
    console.error('SSLCommerz init error:', error);
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
