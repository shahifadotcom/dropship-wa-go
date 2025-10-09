import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { store_id, store_password, is_sandbox } = await req.json();

    const baseUrl = is_sandbox 
      ? 'https://sandbox.sslcommerz.com'
      : 'https://securepay.sslcommerz.com';

    // Test with a minimal payment initialization
    const testData = {
      store_id,
      store_passwd: store_password,
      total_amount: '10',
      currency: 'BDT',
      tran_id: `test-${Date.now()}`,
      success_url: 'https://example.com/success',
      fail_url: 'https://example.com/fail',
      cancel_url: 'https://example.com/cancel',
      cus_name: 'Test Customer',
      cus_email: 'test@example.com',
      cus_phone: '01700000000',
      cus_add1: 'Test Address',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      shipping_method: 'NO',
      product_name: 'Test Product',
      product_category: 'Test',
      product_profile: 'general',
    };

    const response = await fetch(`${baseUrl}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(testData).toString(),
    });

    const result = await response.json();

    if (result.status === 'SUCCESS' || result.status === 'FAILED') {
      return new Response(
        JSON.stringify({
          success: result.status === 'SUCCESS',
          message: result.status === 'SUCCESS' 
            ? 'Connection successful! Your SSLCommerz credentials are valid.' 
            : `Connection failed: ${result.failedreason || 'Invalid credentials'}`,
          details: result,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      throw new Error('Unexpected response from SSLCommerz');
    }
  } catch (error) {
    console.error('SSLCommerz test error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `Test failed: ${error.message}` 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
