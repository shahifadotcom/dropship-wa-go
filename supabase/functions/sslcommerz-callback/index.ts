import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const params = new URLSearchParams(await req.text());

    console.log('SSLCommerz callback received:', type, Object.fromEntries(params));

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const transactionId = params.get('tran_id');
    const valId = params.get('val_id');

    if (!transactionId) {
      throw new Error('Transaction ID missing');
    }

    // Get transaction record
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('sslcommerz_transactions')
      .select('*, orders(*)')
      .eq('transaction_id', transactionId)
      .single();

    if (txError || !transaction) {
      throw new Error('Transaction not found');
    }

    const frontendUrl = 'https://shahifa.lovable.app';

    if (type === 'success' && valId) {
      // Verify with SSLCommerz
      const { data: config } = await supabaseAdmin
        .from('sslcommerz_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (!config) {
        throw new Error('SSLCommerz config not found');
      }

      const baseUrl = config.is_sandbox 
        ? 'https://sandbox.sslcommerz.com'
        : 'https://securepay.sslcommerz.com';

      const validationUrl = `${baseUrl}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${config.store_id}&store_passwd=${config.store_password}&format=json`;

      const validationResponse = await fetch(validationUrl);
      const validationResult = await validationResponse.json();

      console.log('Validation result:', validationResult);

      if (validationResult.status === 'VALID' || validationResult.status === 'VALIDATED') {
        // Update transaction
        await supabaseAdmin
          .from('sslcommerz_transactions')
          .update({
            status: 'completed',
            validation_id: valId,
            card_type: params.get('card_type'),
            card_brand: params.get('card_brand'),
            bank_transaction_id: params.get('bank_tran_id'),
            response_data: validationResult,
          })
          .eq('transaction_id', transactionId);

        // Update order
        await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', transaction.order_id);

        return new Response(null, {
          status: 302,
          headers: { Location: `${frontendUrl}/order-success?orderId=${transaction.order_id}` },
        });
      } else {
        throw new Error('Payment validation failed');
      }
    } else if (type === 'fail') {
      await supabaseAdmin
        .from('sslcommerz_transactions')
        .update({ status: 'failed', response_data: Object.fromEntries(params) })
        .eq('transaction_id', transactionId);

      return new Response(null, {
        status: 302,
        headers: { Location: `${frontendUrl}/checkout?error=payment_failed` },
      });
    } else if (type === 'cancel') {
      await supabaseAdmin
        .from('sslcommerz_transactions')
        .update({ status: 'cancelled', response_data: Object.fromEntries(params) })
        .eq('transaction_id', transactionId);

      return new Response(null, {
        status: 302,
        headers: { Location: `${frontendUrl}/checkout?error=payment_cancelled` },
      });
    }

    throw new Error('Invalid callback type');
  } catch (error) {
    console.error('SSLCommerz callback error:', error);
    return new Response(null, {
      status: 302,
      headers: { Location: 'https://shahifa.lovable.app/checkout?error=payment_error' },
    });
  }
});
