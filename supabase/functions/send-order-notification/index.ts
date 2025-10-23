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

    // Get order details with items and country
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

    // Get country currency from products table (first product's country)
    let currencySymbol = '$';
    let currencyCode = 'USD';
    
    if (order.order_items && order.order_items.length > 0) {
      // Get the first product to find country_id
      const { data: productData } = await supabase
        .from('products')
        .select('country_id, countries(currency, code)')
        .eq('name', order.order_items[0].product_name)
        .maybeSingle();
      
      if (productData?.countries) {
        currencyCode = productData.countries.currency || 'USD';
        // Map currency codes to symbols
        const currencySymbols: { [key: string]: string } = {
          'BDT': '৳',
          'USD': '$',
          'AUD': 'A$',
          'GBP': '£',
          'EUR': '€',
          'CAD': 'C$',
          'INR': '₹',
          'PKR': 'Rs',
          'AED': 'AED ',
          'SAR': 'SAR ',
          'MYR': 'RM',
          'SGD': 'S$'
        };
        currencySymbol = currencySymbols[currencyCode] || currencyCode + ' ';
      }
    }

    // Defer template fetch until needed based on status
    let template: { template: string } | null = null;
    const getTemplate = async (name: string) => {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('template')
        .eq('name', name)
        .single();
      if (error || !data) {
        console.warn('Template not found, using default message:', name, error);
        return null;
      }
      return data as { template: string };
    };

    // Prepare template variables
    const customerName = order.profiles 
      ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim()
      : order.billing_address.fullName || 'Customer';

    // Check order status to determine notification type
    const orderStatus = order.status?.toLowerCase();
    
    // Status messages mapping
    const statusMessages: { [key: string]: string } = {
      'processing': `Great news ${customerName}! Your order #${order.order_number} is being processed. Thank you!`,
      'shipped': `Great news ${customerName}! Your order #${order.order_number} has been shipped. Thank you!`,
      'delivered': `Your order #${order.order_number} has been delivered. Thank you for shopping with us!`,
      'cancelled': `Your order #${order.order_number} has been cancelled.`
    };
    
    // For processing, shipped, delivered, cancelled status, send simple message to CUSTOMER ONLY
    if (orderStatus && ['processing', 'shipped', 'delivered', 'cancelled'].includes(orderStatus)) {
      const statusMessage = statusMessages[orderStatus] || `Your order #${order.order_number} status has been updated to ${order.status}.`;
      
      const { error: sendError } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phoneNumber: order.billing_address.whatsappNumber,
          message: statusMessage
        }
      });

      if (sendError) {
        console.error('Error sending status notification:', sendError);
        throw new Error('Failed to send status notification');
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Status notification sent to customer only' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // For confirmed status only, send full details to BOTH customer and admin
    if (orderStatus === 'confirmed') {
      const tpl = await getTemplate(templateName || 'order_confirmed');
      const templateVars = {
        name: customerName,
        order_number: order.order_number,
        total: order.total.toFixed(2),
        id: order.id
      };

      let message = `Hi ${customerName}, your order #${order.order_number} is confirmed. Total ${currencySymbol}${order.total.toFixed(2)}.`;
      if (tpl?.template) {
        message = tpl.template;
        Object.entries(templateVars).forEach(([key, value]) => {
          message = message.replace(new RegExp(`{{${key}}}`, 'g'), value.toString());
        });
      }

      const isCOD = order.payment_method?.toLowerCase().includes('cod') || 
                    order.payment_method?.toLowerCase().includes('cash');
      
      let productDetails = '';
      if (order.order_items && order.order_items.length > 0) {
        productDetails = '\n\n📦 Products:\n';
        order.order_items.forEach((item: any, index: number) => {
          productDetails += `\n${index + 1}. ${item.product_name}\n`;
          productDetails += `   Qty: ${item.quantity} × ${currencySymbol}${item.price}\n`;
        });
      }

      let paymentMessage = '';
      if (isCOD) {
        const remainingAmount = order.total - 100;
        paymentMessage = `\n\n💰 Payment: Cash on Delivery\n✅ Confirmation fee received: ${currencySymbol}100\n📦 Delivery: FREE\n⚠️ Remaining amount (${currencySymbol}${remainingAmount.toFixed(2)}) to be paid to delivery person\n\n⚠️ Note: The ${currencySymbol}100 is a confirmation fee only. If you do not receive the products, this fee is non-refundable.`;
      } else {
        paymentMessage = '\n\n✅ Payment: Completed';
      }

      const phoneNumber = order.billing_address.whatsappNumber;

      if (!phoneNumber) {
        console.error('No WhatsApp number found for order:', orderId);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'No WhatsApp number found'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send to CUSTOMER
      const customerMessage = message + productDetails + paymentMessage;
      
      const { error: customerMessageError } = await supabase.functions.invoke('send-whatsapp-message', {
        body: {
          phoneNumber,
          message: customerMessage
        }
      });

      if (customerMessageError) {
        console.error('Error sending customer notification:', customerMessageError);
      }

      // Send product images to customer
      if (order.order_items && order.order_items.length > 0) {
        for (const item of order.order_items) {
          if (item.product_image) {
            const imageCaption = `🖼️ ${item.product_name}\nQty: ${item.quantity} × ${currencySymbol}${item.price}`;
            await supabase.functions.invoke('send-whatsapp-message', {
              body: {
                phoneNumber,
                message: imageCaption,
                mediaUrl: item.product_image
              }
            });
          }
        }
      }

      // Send to ADMIN ONLY FOR CONFIRMED STATUS
      const { data: storeSettings } = await supabase
        .from('store_settings')
        .select('admin_whatsapp, contact_phone')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const rawAdminPhone = storeSettings?.admin_whatsapp || storeSettings?.contact_phone;
      const adminPhone = rawAdminPhone ? rawAdminPhone.replace(/\s+/g, '') : undefined;

      if (adminPhone) {
        let adminProductList = '';
        if (order.order_items && order.order_items.length > 0) {
          adminProductList = '\n📦 Items:\n';
          order.order_items.forEach((item: any, index: number) => {
            adminProductList += `${index + 1}. ${item.product_name} (×${item.quantity}) - ${currencySymbol}${item.price}\n`;
          });
        }

        const paymentInfo = isCOD 
          ? `💵 Payment: COD (Confirmation: ${currencySymbol}100 received, Remaining: ${currencySymbol}${(order.total - 100).toFixed(2)})`
          : `✅ Payment: Completed`;

        const adminMessage = `🔔 NEW ORDER RECEIVED!\n\n` +
          `📋 Order #${order.order_number}\n` +
          `💰 Total: ${currencySymbol}${order.total.toFixed(2)}\n` +
          `${paymentInfo}\n\n` +
          `👤 CUSTOMER:\n` +
          `Name: ${customerName}\n` +
          `Phone: ${phoneNumber}\n\n` +
          `📍 DELIVERY ADDRESS:\n` +
          `${order.billing_address.fullAddress || 'N/A'}\n` +
          `Country: ${order.billing_address.country || 'N/A'}\n` +
          adminProductList;

        await supabase.functions.invoke('send-whatsapp-message', {
          body: {
            phoneNumber: adminPhone,
            message: adminMessage
          }
        });

        // Send product images to admin
        if (order.order_items && order.order_items.length > 0) {
          for (const item of order.order_items) {
            if (item.product_image) {
              await supabase.functions.invoke('send-whatsapp-message', {
                body: {
                  phoneNumber: adminPhone,
                  message: `🖼️ Product: ${item.product_name}`,
                  mediaUrl: item.product_image
                }
              });
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Confirmed order notification sent to customer and admin'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For all other statuses (not confirmed, not processing), send simple update to CUSTOMER ONLY
    const tpl = await getTemplate(templateName || 'order_status_update');
    const templateVars = {
      name: customerName,
      order_number: order.order_number,
      total: order.total.toFixed(2),
      id: order.id
    };

    let message = `Update: Your order #${order.order_number} status is now "${order.status}".`;
    if (tpl?.template) {
      message = tpl.template;
      Object.entries(templateVars).forEach(([key, value]) => {
        message = message.replace(new RegExp(`{{${key}}}`, 'g'), value.toString());
      });
    }

    const { error: sendError } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        phoneNumber: order.billing_address.whatsappNumber,
        message: message
      }
    });

    if (sendError) {
      console.error('Error sending status update:', sendError);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Status update sent to customer only' }),
      { 
        status: 200, 
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