import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    // Extract OAuth parameters from query string
    const appName = params.get('app_name') || 'Unknown App';
    const scope = params.get('scope') || 'read_write';
    const userId = params.get('user_id') || 'external_user';
    const returnUrl = params.get('return_url') || '';
    const callbackUrl = params.get('callback_url') || '';

    console.log('WC Auth Request:', {
      appName,
      scope,
      userId,
      returnUrl,
      callbackUrl
    });

    // Generate WooCommerce-style API credentials
    const consumerKey = 'ck_' + crypto.randomUUID().replace(/-/g, '');
    const consumerSecret = 'cs_' + crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store the API key in database
    const { error: insertError } = await supabase
      .from('woocommerce_api_keys')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // System user for external integrations
        app_name: appName,
        api_key: consumerKey,
        api_secret: consumerSecret,
        scope: scope,
        callback_url: callbackUrl,
        external_user_id: userId,
        is_active: true
      });

    if (insertError) {
      console.error('Error storing API key:', insertError);
      throw insertError;
    }

    console.log('API credentials generated and stored:', { consumerKey });

    // Build callback URL with credentials
    const redirectUrl = new URL(callbackUrl);
    redirectUrl.searchParams.append('success', '1');
    redirectUrl.searchParams.append('user_id', userId);
    redirectUrl.searchParams.append('consumer_key', consumerKey);
    redirectUrl.searchParams.append('consumer_secret', consumerSecret);
    redirectUrl.searchParams.append('key_permissions', scope);

    console.log('Redirecting to:', redirectUrl.toString());

    // Return HTML that auto-redirects to callback URL with credentials
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authorization Successful</title>
          <meta http-equiv="refresh" content="0;url=${redirectUrl.toString()}">
        </head>
        <body>
          <h1>Authorization Successful</h1>
          <p>Redirecting back to ${appName}...</p>
          <p>If you are not redirected automatically, <a href="${redirectUrl.toString()}">click here</a>.</p>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('Error in wc-auth:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: 'Failed to process WooCommerce authorization'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
