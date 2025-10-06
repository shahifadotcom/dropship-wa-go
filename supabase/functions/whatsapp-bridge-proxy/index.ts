import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const bridgeUrl = 'http://161.97.169.64:3001';
    const url = new URL(req.url);
    const path = url.searchParams.get('path') || '/status';
    
    console.log(`Proxying request to WhatsApp bridge: ${bridgeUrl}${path}`);

    const targetUrl = `${bridgeUrl}${path}`;
    const method = req.method;
    
    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      body = await req.text();
    }

    const response = await fetch(targetUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body || undefined,
    });

    const responseText = await response.text();
    console.log(`Bridge response status: ${response.status}`);

    return new Response(responseText, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error proxying to WhatsApp bridge:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to connect to WhatsApp bridge',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
