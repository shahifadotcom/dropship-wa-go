import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    // Create Supabase client with service role key for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create regular client for user authentication
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get authenticated user (optional for guest checkout)
    const authHeader = req.headers.get('Authorization');
    let user = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    // Parse request body
    const orderData = await req.json();
    
    // Validate required fields
    if (!orderData.customerEmail || !orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('Invalid order data: missing email or items');
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;
    
    console.log('Creating order:', { orderNumber, customerEmail: orderData.customerEmail });

    // Create order in database
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: user?.id || null,
        customer_email: orderData.customerEmail,
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
        total: orderData.total,
        billing_address: orderData.billingAddress,
        shipping_address: orderData.shippingAddress,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw orderError;
    }

    console.log('Order created:', order.id);

    // Create order items
    const orderItems = orderData.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.product.name,
      product_image: item.product.images[0] || '',
      quantity: item.quantity,
      price: item.price,
      variant_data: item.variant || null
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      console.error('Order items creation error:', itemsError);
      // Try to delete the order if items creation failed
      await supabaseAdmin
        .from('orders')
        .delete()
        .eq('id', order.id);
      throw itemsError;
    }

    console.log('Order items created for order:', order.id);

    // TODO: Here you could integrate with payment processors
    // For now, we'll just return the order details
    
    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderNumber: order.order_number,
        message: 'Order created successfully'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in create-order function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to create order',
        details: error.toString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    );
  }
});