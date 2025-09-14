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

    // Try x-www-form-urlencoded first, then fall back to JSON (some endpoints reject GET and require POST form data)
    let res = await fetch(callback_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain;q=0.9, */*;q=0.8',
        'User-Agent': 'supabase-edge/wc-auth-callback-proxy'
      },
      body: new URLSearchParams(payload).toString()
    })

    if (!res.ok) {
      // Fallback to JSON body
      res = await fetch(callback_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain;q=0.9, */*;q=0.8',
          'User-Agent': 'supabase-edge/wc-auth-callback-proxy'
        },
        body: JSON.stringify(payload)
      })
    }

    const resText = await res.text()
    const resIsJson = res.headers.get('content-type')?.includes('application/json')
    console.log('wc-auth-callback-proxy response', { status: res.status, contentType: res.headers.get('content-type') })

    return new Response(
      resIsJson ? resText : JSON.stringify({ raw: resText }),
      { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (e) {
    console.error('wc-auth-callback-proxy error:', e)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})