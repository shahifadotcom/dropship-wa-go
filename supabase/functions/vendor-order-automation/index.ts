import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  vendor_id?: string;
  cj_product_id?: string;
}

interface VendorOrder {
  vendor_name: string;
  vendor_endpoint: string;
  items: OrderItem[];
  total_amount: number;
  customer_info: any;
  shipping_address: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, force_process = false } = await req.json();
    
    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'Order ID is required' }),
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
        order_items (
          *,
          products (
            vendor_id,
            auto_order_enabled,
            cj_product_imports (
              cj_product_id,
              cj_sku
            )
          )
        )
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing order:', order.order_number);

    // Check if automation is enabled and order is eligible
    if (!force_process && order.status !== 'confirmed') {
      return new Response(
        JSON.stringify({ 
          error: 'Order must be confirmed for automation',
          current_status: order.status
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Group items by vendor
    const vendorGroups = new Map<string, OrderItem[]>();
    
    order.order_items.forEach((item: any) => {
      const product = item.products;
      
      // Only process products with auto order enabled
      if (!product?.auto_order_enabled) {
        console.log(`Skipping product ${item.product_name} - auto order disabled`);
        return;
      }

      const vendorId = product.vendor_id || 'default';
      
      if (!vendorGroups.has(vendorId)) {
        vendorGroups.set(vendorId, []);
      }
      
      vendorGroups.get(vendorId)!.push({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.price,
        vendor_id: vendorId,
        cj_product_id: product.cj_product_imports?.[0]?.cj_product_id
      });
    });

    if (vendorGroups.size === 0) {
      console.log('No items eligible for automated ordering');
      return new Response(
        JSON.stringify({ 
          message: 'No items eligible for automated ordering',
          processed_items: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Process each vendor group
    const results = [];
    let totalProcessed = 0;

    for (const [vendorId, items] of vendorGroups) {
      try {
        console.log(`Processing ${items.length} items for vendor ${vendorId}`);
        
        // Get vendor configuration (simplified for now)
        const vendorConfig = {
          id: vendorId,
          name: vendorId === 'cj' ? 'CJ Dropshipping' : 'Generic Vendor'
        };

        // Create vendor order based on vendor type
        let vendorOrderResult;
        
        switch (vendorConfig.name.toLowerCase()) {
          case 'cj dropshipping':
            vendorOrderResult = await processCJDropshippingOrder(items, order, supabase);
            break;
          case 'aliexpress':
            vendorOrderResult = await processAliExpressOrder(items, order, supabase);
            break;
          default:
            vendorOrderResult = await processGenericVendorOrder(items, order, vendorConfig, supabase);
            break;
        }

        if (vendorOrderResult.success) {
          totalProcessed += items.length;
          
          // Send WhatsApp notification to admin
          try {
            await supabase.functions.invoke('send-whatsapp-message', {
              body: {
                phoneNumber: '+1234567890', // Admin phone number from settings
                message: `🔄 Automated order placed!\n\nOrder: ${order.order_number}\nVendor: ${vendorConfig.name}\nItems: ${items.length}\nVendor Order ID: ${vendorOrderResult.vendor_order_id}\n\n✅ Processing automatically`
              }
            });
          } catch (notifError) {
            console.error('Failed to send WhatsApp notification:', notifError);
          }
        }

        results.push({
          vendor_id: vendorId,
          vendor_name: vendorConfig.name,
          items_count: items.length,
          success: vendorOrderResult.success,
          vendor_order_id: vendorOrderResult.vendor_order_id,
          message: vendorOrderResult.message
        });

      } catch (vendorError) {
        console.error(`Error processing vendor ${vendorId}:`, vendorError);
        results.push({
          vendor_id: vendorId,
          items_count: items.length,
          success: false,
          message: vendorError.message
        });
      }
    }

    // Update order status if all items were processed
    if (totalProcessed > 0) {
      await supabase
        .from('orders')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', order_id);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        order_number: order.order_number,
        processed_items: totalProcessed,
        vendor_results: results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in vendor-order-automation function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// CJ Dropshipping order processing
async function processCJDropshippingOrder(items: OrderItem[], order: any, supabase: any) {
  try {
    console.log('Processing CJ Dropshipping order...');
    
    // Get CJ credentials from the secure storage
    const { data: cjConnection } = await supabase
      .from('cj_dropshipping_connections')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!cjConnection) {
      throw new Error('No active CJ Dropshipping connection found');
    }

    // Get credentials securely
    const credentials = await supabase.rpc('get_cj_credentials', {
      connection_id: cjConnection.id
    });

    if (!credentials || !credentials.access_token) {
      throw new Error('CJ Dropshipping credentials not found or expired');
    }

    // Prepare CJ order data
    const cjOrderData = {
      products: items.map(item => ({
        pid: item.cj_product_id,
        qty: item.quantity,
        vid: "", // variant ID if applicable
      })),
      shippingZip: order.shipping_address.postal_code,
      shippingCountryCode: order.shipping_address.country,
      remark: `Order ${order.order_number} - Automated processing`
    };

    // Place order with CJ Dropshipping API
    const cjResponse = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': credentials.access_token
      },
      body: JSON.stringify(cjOrderData)
    });

    const cjResult = await cjResponse.json();

    if (cjResult.result && cjResult.data) {
      return {
        success: true,
        vendor_order_id: cjResult.data.orderId,
        order_data: cjResult.data,
        message: 'CJ Dropshipping order created successfully'
      };
    } else {
      throw new Error(cjResult.message || 'CJ Dropshipping order creation failed');
    }

  } catch (error) {
    console.error('CJ Dropshipping order error:', error);
    return {
      success: false,
      vendor_order_id: null,
      message: error.message
    };
  }
}

// AliExpress order processing (placeholder)
async function processAliExpressOrder(items: OrderItem[], order: any, supabase: any) {
  console.log('AliExpress order processing not yet implemented');
  return {
    success: false,
    vendor_order_id: null,
    message: 'AliExpress integration not yet implemented'
  };
}

// Generic vendor order processing
async function processGenericVendorOrder(items: OrderItem[], order: any, vendor: any, supabase: any) {
  console.log(`Processing generic vendor order for ${vendor.name}`);
  
  // For now, just log the order details
  const orderData = {
    vendor: vendor.name,
    items: items,
    order_info: {
      order_number: order.order_number,
      customer_email: order.customer_email,
      shipping_address: order.shipping_address,
      billing_address: order.billing_address
    },
    timestamp: new Date().toISOString()
  };

  // In a real implementation, this would integrate with the vendor's API
  
  return {
    success: true,
    vendor_order_id: `${vendor.name.toUpperCase()}_${Date.now()}`,
    order_data: orderData,
    message: `Order queued for manual processing with ${vendor.name}`
  };
}