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
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
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

    if (!connection.access_token) {
      return new Response(
        JSON.stringify({ error: 'Connection not authorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build search parameters
    const searchParams = new URLSearchParams({
      page: (filters?.page || 1).toString(),
      pageSize: (filters?.pageSize || 20).toString()
    })

    if (filters?.keyword) {
      searchParams.append('keyword', filters.keyword)
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

    // Call CJ Dropshipping API
    const apiResponse = await fetch(
      `https://developers.cjdropshipping.com/api2.0/v1/product/list?${searchParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${connection.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('CJ API error:', errorText)
      
      // Check if token needs refresh
      if (apiResponse.status === 401) {
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

    const apiData = await apiResponse.json()

    // Transform CJ API response to our format
    const products = apiData.data?.list?.map((product: any) => ({
      id: product.pid,
      productName: product.productName,
      productSku: product.productSku,
      sellPrice: parseFloat(product.sellPrice || '0'),
      originalPrice: parseFloat(product.originalPrice || product.sellPrice || '0'),
      productWeight: parseFloat(product.productWeight || '0'),
      productUrl: product.productUrl,
      productMainPicture: product.productImage,
      productPictures: product.productImages || [product.productImage],
      productDescription: product.description || '',
      categoryName: product.categoryName || '',
      brandName: product.brandName || '',
      variants: product.variants || []
    })) || []

    console.log(`Found ${products.length} products for connection ${connectionId}`)

    return new Response(
      JSON.stringify({
        products,
        total: apiData.data?.total || products.length,
        page: filters?.page || 1,
        pageSize: filters?.pageSize || 20
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