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
    const { phoneNumber, otpCode, orderData } = await req.json();
    
    if (!phoneNumber || !otpCode || !orderData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
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

    // Verify OTP
    const { data: otpVerification, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone_number', phoneNumber)
      .eq('otp_code', otpCode)
      .eq('is_verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError) {
      console.error('Error verifying OTP:', otpError);
      throw otpError;
    }

    if (!otpVerification) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Invalid or expired OTP' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mark OTP as verified
    await supabase
      .from('otp_verifications')
      .update({ is_verified: true })
      .eq('id', otpVerification.id);

    // Check if user exists or create new user
    let userId;
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', phoneNumber)
      .maybeSingle();

    if (existingProfile) {
      userId = existingProfile.id;
    } else {
      // Create new user account
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        phone: phoneNumber,
        phone_confirm: true,
        user_metadata: {
          full_name: orderData.fullName,
          phone: phoneNumber
        }
      });

      if (authError) {
        console.error('Error creating user:', authError);
        throw authError;
      }

      userId = authData.user.id;

      // Create profile
      await supabase
        .from('profiles')
        .insert({
          id: userId,
          first_name: orderData.fullName.split(' ')[0] || '',
          last_name: orderData.fullName.split(' ').slice(1).join(' ') || '',
          phone: phoneNumber
        });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: userId,
        customer_email: orderData.email || '',
        status: 'confirmed',
        payment_status: 'pending',
        subtotal: orderData.subtotal,
        tax: orderData.tax,
        shipping: orderData.shipping,
        total: orderData.total,
        billing_address: {
          country: orderData.country,
          fullName: orderData.fullName,
          fullAddress: orderData.fullAddress,
          whatsappNumber: phoneNumber
        },
        shipping_address: {
          country: orderData.country,
          fullName: orderData.fullName,
          fullAddress: orderData.fullAddress,
          whatsappNumber: phoneNumber
        }
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw orderError;
    }

    // Create order items
    const orderItemsData = orderData.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.product.name,
      product_image: item.product.images[0],
      quantity: item.quantity,
      price: item.price,
      variant_data: item.variant || null
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      throw itemsError;
    }

    // Send order confirmation notification
    await supabase.functions.invoke('send-order-notification', {
      body: {
        orderId: order.id,
        templateName: 'order_confirmed'
      }
    });

    console.log(`Order ${orderNumber} created successfully for user ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        userId,
        orderId: order.id,
        orderNumber
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in verify-otp-and-create-order function:', error);
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