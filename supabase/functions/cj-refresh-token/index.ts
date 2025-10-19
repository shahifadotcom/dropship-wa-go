import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    // Get refresh token from credentials
    const { data: credentials } = await supabaseClient.rpc('get_cj_credentials', {
      connection_id: connectionId
    })

    if (!credentials || credentials.length === 0 || !credentials[0].refresh_token) {
      console.error('No refresh token found for connection')
      return new Response(
        JSON.stringify({ error: 'Refresh token not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const refreshToken = credentials[0].refresh_token

    console.log(`Refreshing CJ access token for connection: ${connectionId}`)

    // Call CJ Dropshipping API to refresh access token
    const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/refreshAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: refreshToken,
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.result) {
      console.error('CJ API refresh error:', result)
      return new Response(
        JSON.stringify({ 
          error: result.message || 'Failed to refresh CJ token',
          code: result.code 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update tokens in database
    const { error: updateError } = await supabaseClient.rpc('update_cj_credentials', {
      connection_id: connectionId,
      new_access_token: result.data.accessToken,
      new_refresh_token: result.data.refreshToken,
    })

    if (updateError) {
      console.error('Failed to update credentials:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to save new tokens' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update connection expiry
    await supabaseClient
      .from('cj_dropshipping_connections')
      .update({
        token_expires_at: result.data.accessTokenExpiryDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId)

    console.log('Successfully refreshed CJ access token')

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in cj-refresh-token:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
