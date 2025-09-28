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
    // This is a placeholder for actual Binance API integration
    // You would implement actual Binance Pay API verification here
    console.log(`Simulating Binance verification for transaction: ${transactionId}, amount: ${expectedAmount}`);
    
    // For demo purposes, always return true after 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
    
    // Actual implementation would look like:
    // const response = await fetch('https://bpay.binanceapi.com/binancepay/openapi/v2/order/query', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'BinancePay-Timestamp': timestamp,
    //     'BinancePay-Nonce': nonce,
    //     'BinancePay-Certificate-SN': Deno.env.get('BINANCE_CERT_SN'),
    //     'BinancePay-Signature': signature,
    //   },
    //   body: JSON.stringify({
    //     prepayId: transactionId
    //   })
    // });
    // const result = await response.json();
    // return result.status === 'SUCCESS' && result.data.orderStatus === 'PAID';
  } catch (error) {
    console.error('Binance verification error:', error);
    return false;
  }
}