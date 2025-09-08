import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VENDOR-ORDER-AUTOMATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { orderId } = await req.json();
    logStep("Processing order", { orderId });

    // Get order details with items
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items!inner(
          id,
          product_id,
          quantity,
          price,
          product_name,
          products!inner(
            id,
            name,
            vendor_id,
            auto_order_enabled,
            vendors(
              id,
              name,
              api_type,
              api_endpoint,
              api_key,
              access_token,
              client_id,
              client_secret,
              auto_order_enabled,
              settings
            )
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      logStep("Error fetching order", orderError);
      throw new Error(`Failed to fetch order: ${orderError.message}`);
    }

    logStep("Order fetched", { order: order.order_number });

    // Get user's default payment method
    const { data: paymentMethod, error: paymentError } = await supabaseClient
      .from('saved_payment_methods')
      .select('*')
      .eq('user_id', order.customer_id)
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (paymentError || !paymentMethod) {
      logStep("No default payment method found");
      return new Response(JSON.stringify({ 
        error: 'No default payment method found for automatic ordering' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const results = [];

    // Process each item that has vendor auto-order enabled
    for (const item of order.order_items) {
      const product = item.products;
      
      if (!product.vendor_id || !product.auto_order_enabled || !product.vendors?.auto_order_enabled) {
        logStep("Skipping item - no vendor or auto-order disabled", { 
          productName: product.name,
          vendorId: product.vendor_id,
          autoOrderEnabled: product.auto_order_enabled
        });
        continue;
      }

      const vendor = product.vendors;
      logStep("Processing vendor order", { vendor: vendor.name, apiType: vendor.api_type });

      try {
        let vendorOrderResult;

        switch (vendor.api_type) {
          case 'cjdropshipping':
            vendorOrderResult = await processCJDropshippingOrder(vendor, item, order, paymentMethod);
            break;
          case 'zendrop':
            vendorOrderResult = await processZendropOrder(vendor, item, order, paymentMethod);
            break;
          case 'autods':
            vendorOrderResult = await processAutodsOrder(vendor, item, order, paymentMethod);
            break;
          case 'spocket':
            vendorOrderResult = await processSpocketOrder(vendor, item, order, paymentMethod);
            break;
          case 'printful':
            vendorOrderResult = await processPrintfulOrder(vendor, item, order, paymentMethod);
            break;
          default:
            logStep("Unsupported vendor API type", { apiType: vendor.api_type });
            continue;
        }

        // Save vendor order record
        const { error: saveError } = await supabaseClient
          .from('vendor_orders')
          .insert({
            order_id: orderId,
            vendor_id: vendor.id,
            vendor_order_id: vendorOrderResult.orderId,
            vendor_order_number: vendorOrderResult.orderNumber,
            status: vendorOrderResult.status,
            tracking_number: vendorOrderResult.trackingNumber,
            total_amount: item.price * item.quantity,
            payment_status: vendorOrderResult.paymentStatus,
            payment_method_id: paymentMethod.id,
            vendor_response: vendorOrderResult.rawResponse
          });

        if (saveError) {
          logStep("Error saving vendor order", saveError);
        }

        results.push({
          productName: product.name,
          vendor: vendor.name,
          success: true,
          orderId: vendorOrderResult.orderId,
          status: vendorOrderResult.status
        });

        // Send tracking info via WhatsApp if available
        if (vendorOrderResult.trackingNumber) {
          await sendTrackingNotification(order, vendorOrderResult, supabaseClient);
        }

      } catch (error) {
        logStep("Error processing vendor order", { 
          vendor: vendor.name, 
          error: error.message 
        });

        // Save failed order record
        await supabaseClient
          .from('vendor_orders')
          .insert({
            order_id: orderId,
            vendor_id: vendor.id,
            status: 'failed',
            error_message: error.message,
            payment_method_id: paymentMethod.id,
            total_amount: item.price * item.quantity
          });

        results.push({
          productName: product.name,
          vendor: vendor.name,
          success: false,
          error: error.message
        });
      }
    }

    logStep("Order automation completed", { results });

    return new Response(JSON.stringify({
      success: true,
      orderId,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in vendor-order-automation", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// CJ Dropshipping API integration
async function processCJDropshippingOrder(vendor: any, item: any, order: any, paymentMethod: any) {
  const apiKey = vendor.access_token || vendor.api_key;
  
  const orderData = {
    products: [{
      productId: item.product_id,
      variantId: item.variant_id || null,
      quantity: item.quantity
    }],
    shippingAddress: {
      firstName: order.shipping_address.first_name,
      lastName: order.shipping_address.last_name,
      company: order.shipping_address.company || '',
      address1: order.shipping_address.address1,
      address2: order.shipping_address.address2 || '',
      city: order.shipping_address.city,
      province: order.shipping_address.province,
      country: order.shipping_address.country,
      zip: order.shipping_address.postal_code,
      phone: order.shipping_address.phone || ''
    },
    remark: `Order ${order.order_number} - Auto processed`
  };

  const response = await fetch(`${vendor.api_endpoint}/shopping/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': apiKey
    },
    body: JSON.stringify(orderData)
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`CJ Dropshipping API error: ${result.message || 'Unknown error'}`);
  }

  return {
    orderId: result.data?.orderId,
    orderNumber: result.data?.orderNum,
    status: 'pending',
    paymentStatus: 'pending',
    trackingNumber: null,
    rawResponse: result
  };
}

// Zendrop API integration
async function processZendropOrder(vendor: any, item: any, order: any, paymentMethod: any) {
  const apiKey = vendor.api_key;
  
  const orderData = {
    line_items: [{
      variant_id: item.product_id,
      quantity: item.quantity
    }],
    shipping_address: {
      first_name: order.shipping_address.first_name,
      last_name: order.shipping_address.last_name,
      company: order.shipping_address.company,
      address1: order.shipping_address.address1,
      address2: order.shipping_address.address2,
      city: order.shipping_address.city,
      province: order.shipping_address.province,
      country: order.shipping_address.country,
      zip: order.shipping_address.postal_code,
      phone: order.shipping_address.phone
    }
  };

  const response = await fetch(`${vendor.api_endpoint}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(orderData)
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Zendrop API error: ${result.message || 'Unknown error'}`);
  }

  return {
    orderId: result.id,
    orderNumber: result.order_number,
    status: 'pending',
    paymentStatus: 'pending',
    trackingNumber: null,
    rawResponse: result
  };
}

// AutoDS API integration
async function processAutodsOrder(vendor: any, item: any, order: any, paymentMethod: any) {
  const apiKey = vendor.api_key;
  
  const orderData = {
    supplier: 'aliexpress',
    product_id: item.product_id,
    quantity: item.quantity,
    customer_details: {
      name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
      address: order.shipping_address.address1,
      city: order.shipping_address.city,
      state: order.shipping_address.province,
      country: order.shipping_address.country,
      zip_code: order.shipping_address.postal_code,
      phone: order.shipping_address.phone
    }
  };

  const response = await fetch(`${vendor.api_endpoint}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(orderData)
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`AutoDS API error: ${result.message || 'Unknown error'}`);
  }

  return {
    orderId: result.order_id,
    orderNumber: result.order_number,
    status: 'pending',
    paymentStatus: 'pending',
    trackingNumber: null,
    rawResponse: result
  };
}

// Spocket API integration
async function processSpocketOrder(vendor: any, item: any, order: any, paymentMethod: any) {
  const apiKey = vendor.api_key;
  
  const orderData = {
    line_items: [{
      product_id: item.product_id,
      quantity: item.quantity
    }],
    shipping_address: {
      first_name: order.shipping_address.first_name,
      last_name: order.shipping_address.last_name,
      address1: order.shipping_address.address1,
      address2: order.shipping_address.address2,
      city: order.shipping_address.city,
      province: order.shipping_address.province,
      country: order.shipping_address.country,
      zip: order.shipping_address.postal_code,
      phone: order.shipping_address.phone
    }
  };

  const response = await fetch(`${vendor.api_endpoint}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey
    },
    body: JSON.stringify(orderData)
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Spocket API error: ${result.message || 'Unknown error'}`);
  }

  return {
    orderId: result.id,
    orderNumber: result.reference_id,
    status: 'pending',
    paymentStatus: 'pending',
    trackingNumber: null,
    rawResponse: result
  };
}

// Printful API integration
async function processPrintfulOrder(vendor: any, item: any, order: any, paymentMethod: any) {
  const apiKey = vendor.api_key;
  
  const orderData = {
    recipient: {
      name: `${order.shipping_address.first_name} ${order.shipping_address.last_name}`,
      company: order.shipping_address.company,
      address1: order.shipping_address.address1,
      address2: order.shipping_address.address2,
      city: order.shipping_address.city,
      state_code: order.shipping_address.province,
      country_code: order.shipping_address.country,
      zip: order.shipping_address.postal_code,
      phone: order.shipping_address.phone
    },
    items: [{
      sync_variant_id: item.product_id,
      quantity: item.quantity
    }]
  };

  const response = await fetch(`${vendor.api_endpoint}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(orderData)
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Printful API error: ${result.error?.message || 'Unknown error'}`);
  }

  return {
    orderId: result.result?.id,
    orderNumber: result.result?.external_id,
    status: 'pending',
    paymentStatus: 'pending',
    trackingNumber: null,
    rawResponse: result
  };
}

// Send tracking notification via WhatsApp
async function sendTrackingNotification(order: any, vendorOrder: any, supabaseClient: any) {
  try {
    const message = `🚚 Order Update!\n\nOrder #${order.order_number}\nTracking: ${vendorOrder.trackingNumber}\n\nYour order has been shipped and is on its way!`;
    
    await supabaseClient.functions.invoke('send-whatsapp-message', {
      body: {
        to: order.shipping_address.phone,
        message
      }
    });
  } catch (error) {
    console.error('Failed to send tracking notification:', error);
  }
}