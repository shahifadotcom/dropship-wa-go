import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { connectionId } = await req.json()

    if (!connectionId) {
      return new Response(
        JSON.stringify({ error: 'Connection ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get connection details and credentials separately
    const { data: connection, error: connectionError } = await supabaseClient
      .from('cj_dropshipping_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (connectionError || !connection) {
      console.error('Connection fetch error:', connectionError)
      return new Response(
        JSON.stringify({ error: 'Connection not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get credentials securely
    const { data: credentials } = await supabaseClient.rpc('get_cj_credentials', {
      connection_id: connectionId
    })

    if (!credentials || credentials.length === 0) {
      console.error('No credentials found for connection')
      return new Response(
        JSON.stringify({ error: 'Connection credentials not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const clientSecret = credentials[0].client_secret


    // Generate OAuth authorization URL
    const state = crypto.randomUUID()
    const domain = connection.domain.replace(/^https?:\/\//, '').replace(/\/+$/,'')
    const redirectUri = `https://${domain}/cj-oauth-callback`
    
    const scope = encodeURIComponent('read_products manage_orders read_inventory')
    const authorizationUrl = `https://developers.cjdropshipping.cn/oauth/authorize` +
      `?client_id=${connection.client_id}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}` +
      `&scope=${scope}`

    // Store state for verification
    const { error: updateError } = await supabaseClient
      .from('cj_dropshipping_connections')
      .update({ 
        oauth_state: state,
        updated_at: new Date().toISOString()
      })
      .eq('id', connectionId)

    if (updateError) {
      console.error('State update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to initiate OAuth flow' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`OAuth flow initiated for connection ${connectionId}`)

    return new Response(
      JSON.stringify({ 
        authorizationUrl,
        state,
        redirectUri
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in cj-oauth-initiate:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})