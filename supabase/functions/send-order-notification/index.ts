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

    // Get order details with items
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles (first_name, last_name),
        order_items (
          product_name,
          product_image,
          quantity,
          price
        )
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

    // Build product details for message
    let productDetails = '';
    if (order.order_items && order.order_items.length > 0) {
      productDetails = '\n\nProducts:\n';
      order.order_items.forEach((item: any) => {
        productDetails += `- ${item.product_name} (Qty: ${item.quantity}) - ৳${item.price}\n`;
      });
    }

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

    // Send WhatsApp message to customer with product details
    const customerMessage = message + productDetails;
    const { error: customerMessageError } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        phoneNumber,
        message: customerMessage
      }
    });

    if (customerMessageError) {
      console.error('Error sending customer notification:', customerMessageError);
    }

    // Send notification to admin with full order details
    const { data: storeSettings } = await supabase
      .from('store_settings')
      .select('admin_whatsapp')
      .single();

    if (storeSettings?.admin_whatsapp) {
      const adminMessage = `🔔 New Order #${order.order_number}\n\n` +
        `Customer: ${customerName}\n` +
        `Phone: ${phoneNumber}\n` +
        `Address: ${order.billing_address.fullAddress || 'N/A'}\n` +
        `Total: ৳${order.total.toFixed(2)}\n` +
        productDetails;

      await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phoneNumber: storeSettings.admin_whatsapp,
          message: adminMessage
        }
      });
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