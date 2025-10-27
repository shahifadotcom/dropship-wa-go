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

    const { connectionId, filters } = await req.json()

    if (!connectionId) {
      return new Response(
        JSON.stringify({ error: 'Connection ID is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get connection details
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
    const { data: credentials, error: credError } = await supabaseClient.rpc('get_cj_credentials', {
      connection_id: connectionId
    })

    console.log('Credentials query result:', { credentials, credError })

    if (credError) {
      console.error('Error fetching credentials:', credError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch credentials' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const cred = Array.isArray(credentials) ? credentials[0] : credentials

    if (!cred || !cred.access_token) {
      console.error('No credentials found for connection')
      return new Response(
        JSON.stringify({ error: 'Connection credentials not found. Please re-authorize.' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const accessToken = cred.access_token


    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'Connection not authorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build search parameters using correct parameter names
    const searchParams = new URLSearchParams({
      pageNum: (filters?.page || 1).toString(),
      pageSize: (filters?.pageSize || 20).toString()
    })

    if (filters?.keyword) {
      searchParams.append('productNameEn', filters.keyword)
    }
    if (filters?.categoryId) {
      searchParams.append('categoryId', filters.categoryId)
    }
    if (filters?.minPrice) {
      searchParams.append('minPrice', filters.minPrice.toString())
    }
    if (filters?.maxPrice) {
      searchParams.append('maxPrice', filters.maxPrice.toString())
    }

    // Call CJ Dropshipping API using correct endpoint and authentication header
    const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?${searchParams}`, {
      method: 'GET',
      headers: {
        'CJ-Access-Token': accessToken,
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('CJ API error:', errorText)
      
      // Check if token needs refresh
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: 'Access token expired, please re-authorize' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      return new Response(
        JSON.stringify({ error: 'Failed to search products' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const responseData = await response.json()

    // Check CJ API response format
    if (!responseData.result || !responseData.data) {
      console.error('Invalid CJ API response:', responseData)
      return new Response(
        JSON.stringify({ error: responseData.message || 'Invalid response from CJ API' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Transform CJ API response to our format using correct field names
    const products = responseData.data?.list?.map((product: any) => ({
      id: product.pid,
      productName: product.productNameEn || product.productName,
      productSku: product.productSku,
      sellPrice: parseFloat(product.sellPrice || '0'),
      originalPrice: parseFloat(product.sellPrice || '0') * 1.2,
      productWeight: parseFloat(product.productWeight || '0'),
      productUrl: product.productUrl || '',
      productMainPicture: product.productImage,
      productPictures: [product.productImage],
      productDescription: '',
      categoryId: product.categoryId || '',
      categoryName: product.categoryName || '',
      brandName: product.brandName || '',
      productUnit: product.productUnit || 'unit(s)',
      listedNum: product.listedNum || 0,
      isFreeShipping: product.isFreeShipping || false,
      variants: []
    })) || []

    console.log(`Found ${products.length} products for connection ${connectionId}`)

    return new Response(
      JSON.stringify({
        products,
        total: responseData.data?.total || products.length,
        page: responseData.data?.pageNum || filters?.page || 1,
        pageSize: responseData.data?.pageSize || filters?.pageSize || 20
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in cj-search-products:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})