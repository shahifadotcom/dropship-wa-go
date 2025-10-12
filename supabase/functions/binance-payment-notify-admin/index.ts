import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, transactionId, amount, customerPhone } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get Binance config with admin WhatsApp
    const { data: config, error: configError } = await supabase
      .from('binance_config')
      .select('*')
      .single();

    if (configError || !config) {
      throw new Error('Binance configuration not found');
    }

    if (!config.admin_whatsapp) {
      console.log('No admin WhatsApp configured, skipping notification');
      return new Response(JSON.stringify({ success: true, message: 'No admin WhatsApp configured' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get order details
    const { data: order } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();

    const message = `🔔 *New Binance Pay Payment Submitted*\n\n` +
      `📝 Order ID: ${orderId}\n` +
      `💰 Amount: $${amount}\n` +
      `🆔 Transaction ID: ${transactionId}\n` +
      `📱 Customer Phone: ${customerPhone}\n\n` +
      `⚠️ *Action Required:*\n` +
      `1. Check your Binance account for transaction ${transactionId}\n` +
      `2. Verify the payment amount matches $${amount}\n` +
      `3. Go to Admin Panel → Orders to approve/reject\n\n` +
      `Please verify and update order status.`;

    // Send WhatsApp notification to admin
    const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        to: config.admin_whatsapp,
        message: message,
        orderId: orderId
      }
    });

    if (whatsappError) {
      console.error('Error sending WhatsApp notification:', whatsappError);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in binance-payment-notify-admin:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});