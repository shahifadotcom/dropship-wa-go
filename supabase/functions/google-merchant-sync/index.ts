import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, productId } = await req.json()

    // Get Google Merchant Center config
    const { data: config } = await supabase
      .from('google_services_config')
      .select('*')
      .eq('service_name', 'merchant_center')
      .eq('is_enabled', true)
      .single()

    if (!config?.access_token) {
      return new Response(
        JSON.stringify({ error: 'Google Merchant Center not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (action === 'sync_product') {
      // Get product data
      const { data: product } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          countries(name, currency)
        `)
        .eq('id', productId)
        .single()

      if (!product) {
        return new Response(
          JSON.stringify({ error: 'Product not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      // Format product for Google Merchant Center
      const merchantProduct = {
        offerId: product.sku,
        title: product.name,
        description: product.description,
        link: `${Deno.env.get('SITE_URL')}/products/${product.slug}`,
        imageLink: product.images?.[0] || '',
        availability: product.in_stock ? 'in stock' : 'out of stock',
        price: {
          value: product.price.toString(),
          currency: product.countries?.currency || 'USD'
        },
        brand: product.brand || 'Unknown',
        gtin: product.sku,
        condition: 'new',
        productType: product.categories?.name || 'General',
        googleProductCategory: product.categories?.name || 'General > Products',
        shippingWeight: {
          value: product.weight ? product.weight.toString() : '1',
          unit: 'kg'
        }
      }

      // Send to Google Merchant Center API
      const merchantResponse = await fetch(
        `https://shoppingcontent.googleapis.com/content/v2.1/${config.merchant_center_id}/products`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(merchantProduct)
        }
      )

      if (!merchantResponse.ok) {
        const error = await merchantResponse.text()
        console.error('Google Merchant Center API error:', error)
        
        // Try to refresh token if unauthorized
        if (merchantResponse.status === 401) {
          const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: config.client_id,
              client_secret: config.client_secret,
              refresh_token: config.refresh_token,
              grant_type: 'refresh_token'
            })
          })

          if (refreshResponse.ok) {
            const tokens = await refreshResponse.json()
            
            // Update stored tokens
            await supabase
              .from('google_services_config')
              .update({ 
                access_token: tokens.access_token,
                updated_at: new Date().toISOString()
              })
              .eq('service_name', 'merchant_center')

            return new Response(
              JSON.stringify({ message: 'Token refreshed, please retry' }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }
        }

        return new Response(
          JSON.stringify({ error: 'Failed to sync with Google Merchant Center', details: error }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      const result = await merchantResponse.json()
      console.log('Product synced to Google Merchant Center:', result)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Product synced to Google Merchant Center',
          merchantProductId: result.id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'sync_all_products') {
      // Get all products
      const { data: products } = await supabase
        .from('products')
        .select(`
          *,
          categories(name),
          countries(name, currency)
        `)
        .eq('in_stock', true)

      let syncedCount = 0
      let errors = []

      for (const product of products || []) {
        try {
          const merchantProduct = {
            offerId: product.sku,
            title: product.name,
            description: product.description,
            link: `${Deno.env.get('SITE_URL')}/products/${product.slug}`,
            imageLink: product.images?.[0] || '',
            availability: product.in_stock ? 'in stock' : 'out of stock',
            price: {
              value: product.price.toString(),
              currency: product.countries?.currency || 'USD'
            },
            brand: product.brand || 'Unknown',
            gtin: product.sku,
            condition: 'new',
            productType: product.categories?.name || 'General',
            googleProductCategory: product.categories?.name || 'General > Products'
          }

          const response = await fetch(
            `https://shoppingcontent.googleapis.com/content/v2.1/${config.merchant_center_id}/products`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${config.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(merchantProduct)
            }
          )

          if (response.ok) {
            syncedCount++
          } else {
            const error = await response.text()
            errors.push(`${product.name}: ${error}`)
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error)
          errors.push(`${product.name}: ${msg}`)
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          syncedCount,
          totalProducts: products?.length || 0,
          errors: errors.slice(0, 10) // Limit error reports
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})