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

    const { products } = await req.json();

    // Get admin WhatsApp number from store settings
    const { data: settings } = await supabaseClient
      .from('store_settings')
      .select('admin_whatsapp')
      .single();

    const adminWhatsApp = settings?.admin_whatsapp;

    if (!adminWhatsApp) {
      console.log('No admin WhatsApp number configured');
      return new Response(
        JSON.stringify({ success: false, error: 'No admin WhatsApp configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format the message
    let message = '🚨 *LOW STOCK ALERT* 🚨\n\n';
    message += 'The following products are running low on inventory:\n\n';

    products.forEach((product: any) => {
      message += `📦 *${product.name}*\n`;
      message += `   Stock remaining: *${product.stock_quantity} pcs*\n\n`;
    });

    message += '⚠️ Please restock these items soon to avoid stockouts.';

    // Send WhatsApp notification
    const { error: whatsappError } = await supabaseClient.functions.invoke(
      'send-whatsapp-message',
      {
        body: {
          phone: adminWhatsApp,
          message: message
        }
      }
    );

    if (whatsappError) {
      console.error('Error sending WhatsApp:', whatsappError);
      throw whatsappError;
    }

    console.log('Low stock alert sent successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
