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
    const body = await req.json().catch(() => ({}));
    const phoneNumber = body?.phoneNumber ?? null;
    const otpCode = body?.otpCode ?? null;
    const orderData = body?.orderData ?? body ?? null;
    const skipOTPVerification = body?.skipOTPVerification ?? body?.skipOTP ?? false;
    
    if (!orderData) {
      return new Response(
        JSON.stringify({ error: 'Missing orderData' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    if (!skipOTPVerification && (!phoneNumber || !otpCode)) {
      return new Response(
        JSON.stringify({ error: 'Missing phoneNumber or otpCode' }),
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

    // Verify OTP only if not skipping (when called after payment)
    if (!skipOTPVerification) {
      console.log('Verifying OTP for phone:', phoneNumber);
      
      const { data: otpRecords, error: otpError } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('phone_number', phoneNumber)
        .eq('is_verified', false)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      console.log(`Found ${otpRecords?.length || 0} unverified OTP records for this phone number`);

      // Find matching OTP with constant-time comparison to prevent timing attacks
      let otpVerification = null;
      if (otpRecords && otpRecords.length > 0) {
        for (const record of otpRecords) {
          // Simple timing-safe comparison
          if (record.otp_code.length === otpCode.length) {
            let isMatch = true;
            for (let i = 0; i < record.otp_code.length; i++) {
              if (record.otp_code.charCodeAt(i) !== otpCode.charCodeAt(i)) {
                isMatch = false;
              }
            }
            if (isMatch) {
              otpVerification = record;
              console.log('OTP matched successfully');
              break;
            }
          }
        }
      }

      if (otpError) {
        console.error('Error verifying OTP:', otpError);
        throw otpError;
      }

      if (!otpVerification) {
        console.error('No matching OTP found');
        
        // Check if OTP was already verified
        const { data: verifiedOTP } = await supabase
          .from('otp_verifications')
          .select('*')
          .eq('phone_number', phoneNumber)
          .eq('otp_code', otpCode)
          .eq('is_verified', true)
          .maybeSingle();
        
        if (verifiedOTP) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'This OTP has already been used. Please request a new OTP.' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        // Check if OTP expired
        const { data: expiredOTP } = await supabase
          .from('otp_verifications')
          .select('*')
          .eq('phone_number', phoneNumber)
          .eq('otp_code', otpCode)
          .lte('expires_at', new Date().toISOString())
          .maybeSingle();
        
        if (expiredOTP) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'This OTP has expired. Please request a new OTP.' 
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Invalid OTP code. Please check and try again.' 
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
    } else {
      console.log('Skipping OTP verification - creating order after payment verification');
    }

    // Check if user exists or create new user (optional when skipping OTP)
    let userId: string | null = null;
    if (phoneNumber) {
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
            first_name: (orderData.fullName || '').split(' ')[0] || '',
            last_name: (orderData.fullName || '').split(' ').slice(1).join(' ') || '',
            phone: phoneNumber
          });
      }
    }

    // Generate order number starting from 1001
    const { data: lastOrder } = await supabase
      .from('orders')
      .select('order_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    let orderSequence = 1001;
    if (lastOrder?.order_number) {
      const lastNumber = parseInt(lastOrder.order_number);
      if (!isNaN(lastNumber) && lastNumber >= 1001) {
        orderSequence = lastNumber + 1;
      }
    }
    
    const orderNumber = orderSequence.toString();

    // Determine payment status based on method
    const isCOD = orderData.paymentMethod?.toLowerCase().includes('cod') || 
                  orderData.paymentMethod?.toLowerCase().includes('cash');
    const paymentStatus = isCOD ? 'pending' : 'paid';

    // Prepare billing address JSON
    const billingAddress = {
      fullName: orderData.fullName || '',
      fullAddress: orderData.fullAddress || '',
      whatsappNumber: orderData.whatsappNumber || '',
      country: orderData.country || ''
    };

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: userId,
        customer_email: orderData.email || '',
        status: 'confirmed',
        payment_status: paymentStatus,
        payment_method: orderData.paymentMethod || 'COD',
        subtotal: orderData.subtotal,
        tax: orderData.tax ?? 0,
        shipping: orderData.shipping ?? 0,
        total: orderData.total,
        billing_address: billingAddress,
        shipping_address: billingAddress
      })
      .select()
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      throw orderError;
    }

    // Create order items (optional)
    const items = Array.isArray(orderData.items) ? orderData.items : [];
    let hasDigitalProduct = false;
    let hasSubscriptionProduct = false;
    
    if (items.length > 0) {
      const orderItemsData = items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.product?.name,
        product_image: item.product?.images?.[0] ?? null,
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

      // Check if order contains digital products
      const productIds = items.map((item: any) => item.productId);
      const { data: products } = await supabase
        .from('products')
        .select('id, is_digital, sku')
        .in('id', productIds);

      if (products && products.length > 0) {
        hasDigitalProduct = products.some((p: any) => p.is_digital);
        hasSubscriptionProduct = products.some((p: any) => p.sku === 'CALLING-12M');
      }
    }

    // Auto-complete digital product orders after payment verification
    if (hasDigitalProduct && paymentStatus === 'paid') {
      console.log('Digital product detected - auto-completing order');
      
      await supabase
        .from('orders')
        .update({ 
          status: 'delivered' // Digital products are instantly delivered
        })
        .eq('id', order.id);

      // If it's a subscription product, activate it
      if (hasSubscriptionProduct && userId) {
        console.log('Subscription product detected - activating subscription');
        try {
          await supabase.functions.invoke('activate-calling-subscription', {
            body: {
              orderId: order.id,
              userId: userId
            }
          });
        } catch (subError) {
          console.error('Error activating subscription:', subError);
        }
      }
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
        orderNumber,
        isDigital: hasDigitalProduct,
        isSubscription: hasSubscriptionProduct
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in verify-otp-and-create-order function:', error);
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