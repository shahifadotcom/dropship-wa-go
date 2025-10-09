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

    // Determine if COD payment
    const isCOD = order.payment_method?.toLowerCase().includes('cod') || 
                  order.payment_method?.toLowerCase().includes('cash');
    
    // Build product details for customer message (without image URLs)
    let productDetails = '';
    if (order.order_items && order.order_items.length > 0) {
      productDetails = '\n\n📦 Products:\n';
      order.order_items.forEach((item: any, index: number) => {
        productDetails += `\n${index + 1}. ${item.product_name}\n`;
        productDetails += `   Qty: ${item.quantity} × ৳${item.price}\n`;
      });
    }

    // Add payment message for COD
    let paymentMessage = '';
    if (isCOD) {
      const remainingAmount = order.total - 100;
      paymentMessage = `\n\n💰 Payment: Cash on Delivery\n✅ Confirmation fee received: ৳100\n⚠️ Remaining amount (৳${remainingAmount.toFixed(2)}) to be paid to delivery person`;
    } else {
      paymentMessage = '\n\n✅ Payment: Completed';
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

    // Send WhatsApp message to customer with product details and payment info
    const customerMessage = message + productDetails + paymentMessage;
    
    // Send text message first
    const { error: customerMessageError } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        phoneNumber,
        message: customerMessage
      }
    });

    if (customerMessageError) {
      console.error('Error sending customer notification:', customerMessageError);
    }

    // Send product images separately
    if (order.order_items && order.order_items.length > 0) {
      console.log(`Sending ${order.order_items.length} product images to customer`);
      for (const item of order.order_items) {
        if (item.product_image) {
          console.log(`Sending product image: ${item.product_name} - ${item.product_image}`);
          const imageCaption = `🖼️ ${item.product_name}\nQty: ${item.quantity} × ৳${item.price}`;
          const { error: imageError } = await supabase.functions.invoke('send-whatsapp-message', {
            body: {
              phoneNumber,
              message: imageCaption,
              mediaUrl: item.product_image
            }
          });
          if (imageError) {
            console.error(`Failed to send image for ${item.product_name}:`, imageError);
          }
        }
      }
    }

    // Send notification to admin with full order details
    const { data: storeSettings, error: settingsError } = await supabase
      .from('store_settings')
      .select('admin_whatsapp, contact_phone')
      .single();

    console.log('Store settings:', { 
      admin_whatsapp: storeSettings?.admin_whatsapp, 
      contact_phone: storeSettings?.contact_phone 
    });

    // Use admin_whatsapp if set, otherwise fall back to contact_phone
    const adminPhone = storeSettings?.admin_whatsapp || storeSettings?.contact_phone;

    if (adminPhone) {
      console.log(`Sending admin notification to: ${adminPhone}`);
      let adminProductList = '';
      if (order.order_items && order.order_items.length > 0) {
        adminProductList = '\n📦 Items:\n';
        order.order_items.forEach((item: any, index: number) => {
          adminProductList += `${index + 1}. ${item.product_name} (×${item.quantity}) - ৳${item.price}\n`;
        });
      }

      const paymentInfo = isCOD 
        ? `💵 Payment: COD (Confirmation: ৳100 received, Remaining: ৳${(order.total - 100).toFixed(2)})`
        : `✅ Payment: Completed`;

      const adminMessage = `🔔 NEW ORDER RECEIVED!\n\n` +
        `📋 Order #${order.order_number}\n` +
        `💰 Total: ৳${order.total.toFixed(2)}\n` +
        `${paymentInfo}\n\n` +
        `👤 CUSTOMER:\n` +
        `Name: ${customerName}\n` +
        `Phone: ${phoneNumber}\n\n` +
        `📍 DELIVERY ADDRESS:\n` +
        `${order.billing_address.fullAddress || 'N/A'}\n` +
        `Country: ${order.billing_address.country || 'N/A'}\n` +
        adminProductList;

      // Send admin notification
      await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phoneNumber: adminPhone,
          message: adminMessage
        }
      });

      // Send product images to admin
      if (order.order_items && order.order_items.length > 0) {
        console.log(`Sending ${order.order_items.length} product images to admin`);
        for (const item of order.order_items) {
          if (item.product_image) {
            console.log(`Sending admin product image: ${item.product_name} - ${item.product_image}`);
            const { error: adminImageError } = await supabase.functions.invoke('send-whatsapp-message', {
              body: {
                phoneNumber: adminPhone,
                message: `🖼️ Product: ${item.product_name}`,
                mediaUrl: item.product_image
              }
            });
            if (adminImageError) {
              console.error(`Failed to send admin image for ${item.product_name}:`, adminImageError);
            }
          }
        }
      }

      console.log(`Admin notification sent to ${adminPhone} for order ${order.order_number}`);
    } else {
      console.log('No admin WhatsApp or contact phone configured');
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