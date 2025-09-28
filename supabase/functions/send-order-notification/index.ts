import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId, templateName } = await req.json();
    
    if (!orderId || !templateName) {
      return new Response(
        JSON.stringify({ error: 'Order ID and template name are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles (first_name, last_name)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      throw new Error('Order not found');
    }

    // Get notification template
    const { data: template, error: templateError } = await supabase
      .from('notification_templates')
      .select('template')
      .eq('name', templateName)
      .single();

    if (templateError || !template) {
      console.error('Error fetching template:', templateError);
      throw new Error('Template not found');
    }

    // Prepare template variables
    const customerName = order.profiles 
      ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim()
      : order.billing_address.fullName || 'Customer';

    const templateVars = {
      name: customerName,
      order_number: order.order_number,
      total: order.total.toFixed(2),
      id: order.id
    };

    // Replace template placeholders
    let message = template.template;
    Object.entries(templateVars).forEach(([key, value]) => {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value.toString());
    });

    // Get customer's WhatsApp number from billing address
    const phoneNumber = order.billing_address.whatsappNumber;

    if (!phoneNumber) {
      console.error('No WhatsApp number found for order:', orderId);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No WhatsApp number found'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Send WhatsApp message
    const { error: messageError } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        phoneNumber,
        message
      }
    });

    if (messageError) {
      console.error('Error sending notification:', messageError);
      // Don't throw error, just log it
    }

    console.log(`Notification sent for order ${order.order_number} using template ${templateName}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Notification sent successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-order-notification function:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});