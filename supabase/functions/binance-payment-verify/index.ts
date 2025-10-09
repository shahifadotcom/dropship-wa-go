import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactionId, orderId, amount } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    console.log(`Verifying Binance payment: ${transactionId} for order: ${orderId}`);

    // Simulate Binance API verification (replace with actual Binance API call)
    const isValidTransaction = await verifyBinanceTransaction(transactionId, amount);

    if (isValidTransaction) {
      // Update transaction verification status
      const { error: updateError } = await supabaseClient
        .from('transaction_verifications')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('transaction_id', transactionId)
        .eq('order_id', orderId);

      if (updateError) throw updateError;

      // Update order payment status
      const { error: orderError } = await supabaseClient
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Send WhatsApp notification
      await supabaseClient.functions.invoke('send-whatsapp-message', {
        body: {
          orderId,
          message: 'Payment verified successfully! Your order is being processed.'
        }
      });

      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Payment verified successfully' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      // Mark as failed
      await supabaseClient
        .from('transaction_verifications')
        .update({
          status: 'failed',
          verified_at: new Date().toISOString()
        })
        .eq('transaction_id', transactionId)
        .eq('order_id', orderId);

      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Payment verification failed' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

  } catch (error) {
    console.error('Error verifying Binance payment:', error);
    const err = error instanceof Error ? error : new Error(String(error));
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

async function verifyBinanceTransaction(transactionId: string, expectedAmount: number): Promise<boolean> {
  try {
    // Get Binance API credentials from config
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { data: config } = await supabaseClient
      .from('binance_config')
      .select('api_key, api_secret')
      .eq('is_active', true)
      .maybeSingle();

    if (!config) {
      console.log('Binance Pay not configured, skipping verification');
      return false;
    }

    // Generate signature for Binance API
    const timestamp = Date.now().toString();
    const nonce = crypto.randomUUID().replace(/-/g, '');
    const payload = JSON.stringify({ prepayId: transactionId });
    
    // Create signature (simplified - actual implementation needs HMAC SHA512)
    const signaturePayload = timestamp + nonce + payload;
    const encoder = new TextEncoder();
    const keyData = encoder.encode(config.api_secret);
    const messageData = encoder.encode(signaturePayload);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    );
    
    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Call Binance API
    const response = await fetch('https://bpay.binanceapi.com/binancepay/openapi/v2/order/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'BinancePay-Timestamp': timestamp,
        'BinancePay-Nonce': nonce,
        'BinancePay-Certificate-SN': config.api_key,
        'BinancePay-Signature': signature.toUpperCase(),
      },
      body: payload
    });

    const result = await response.json();
    console.log('Binance API response:', result);
    
    return result.status === 'SUCCESS' && result.data?.orderStatus === 'PAID';
  } catch (error) {
    console.error('Binance verification error:', error);
    return false;
  }
}