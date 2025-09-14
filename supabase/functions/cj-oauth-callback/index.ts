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

    const { connectionId, authCode, state } = await req.json()

    if (!authCode || (!connectionId && !state)) {
      return new Response(
        JSON.stringify({ error: 'Authorization code and state or connection ID are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get connection details
    let connection: any = null
    let connectionError: any = null

    if (connectionId) {
      const result = await supabaseClient
        .from('cj_dropshipping_connections')
        .select('*')
        .eq('id', connectionId)
        .single()
      connection = result.data
      connectionError = result.error
    } else {
      const result = await supabaseClient
        .from('cj_dropshipping_connections')
        .select('*')
        .eq('oauth_state', state)
        .single()
      connection = result.data
      connectionError = result.error
    }

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
      connection_id: connection.id
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



    // Verify state parameter for security
    if (state && connection.oauth_state !== state) {
      console.error('State mismatch:', { expected: connection.oauth_state, received: state })
      return new Response(
        JSON.stringify({ error: 'Invalid state parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Exchange authorization code for access token
    const domain = connection.domain.replace(/^https?:\/\//, '').replace(/\/+$/,'')
    const tokenRequestBody = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: connection.client_id,
      client_secret: clientSecret,
      code: authCode,
      redirect_uri: `https://${domain}/cj-oauth-callback`
    })

    const tokenResponse = await fetch('https://developers.cjdropshipping.cn/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: tokenRequestBody.toString()
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to exchange authorization code for token' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const tokenData = await tokenResponse.json()
    
    // Calculate token expiration time
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokenData.expires_in || 3600))

    // Update connection status and clear oauth state
    const { error: updateError } = await supabaseClient
      .from('cj_dropshipping_connections')
      .update({
        token_expires_at: expiresAt.toISOString(),
        is_active: true,
        oauth_state: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', connection.id)

    if (updateError) {
      console.error('Connection update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update connection' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update credentials securely
    const { data: credentialsUpdateResult } = await supabaseClient.rpc('update_cj_credentials', {
      connection_id: connection.id,
      new_access_token: tokenData.access_token,
      new_refresh_token: tokenData.refresh_token
    })

    if (!credentialsUpdateResult) {
      console.error('Failed to update credentials')
      return new Response(
        JSON.stringify({ error: 'Failed to update credentials' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }


    console.log(`OAuth flow completed for connection ${connection.id}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Authorization completed successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in cj-oauth-callback:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})