import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { callback_url, payload } = await req.json()

    if (!callback_url || !payload) {
      return new Response(
        JSON.stringify({ error: 'Missing callback_url or payload' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST to CJ's callback (avoids browser CORS)
    const cjRes = await fetch(callback_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const text = await cjRes.text()
    const isJson = cjRes.headers.get('content-type')?.includes('application/json')

    return new Response(
      isJson ? text : JSON.stringify({ raw: text }),
      { status: cjRes.status, headers: { ...corsHeaders, 'Content-Type': isJson ? 'application/json' : 'application/json' } }
    )
  } catch (e) {
    console.error('wc-auth-callback-proxy error:', e)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})