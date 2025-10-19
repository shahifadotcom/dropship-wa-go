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
    const { email, apiKey } = await req.json()

    if (!email || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'Email and API Key are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Getting CJ access token for email: ${email}`)

    // Call CJ Dropshipping API to get access token
    const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        apiKey: apiKey,
      }),
    })

    const result = await response.json()

    if (!response.ok || !result.result) {
      console.error('CJ API error:', result)
      return new Response(
        JSON.stringify({ 
          error: result.message || 'Failed to authenticate with CJ Dropshipping',
          code: result.code 
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Successfully obtained CJ access token')

    return new Response(
      JSON.stringify({
        accessToken: result.data.accessToken,
        accessTokenExpiryDate: result.data.accessTokenExpiryDate,
        refreshToken: result.data.refreshToken,
        refreshTokenExpiryDate: result.data.refreshTokenExpiryDate,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in cj-get-access-token:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
