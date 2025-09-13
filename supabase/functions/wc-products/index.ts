import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// WooCommerce-compatible products API endpoint
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const authHeader = req.headers.get('Authorization')
    
    // Extract Basic Auth credentials (WooCommerce style)
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new Response(
        JSON.stringify({ code: 'woocommerce_rest_cannot_view', message: 'Sorry, you cannot list resources.', data: { status: 401 } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const credentials = atob(authHeader.replace('Basic ', ''))
    const [consumerKey, consumerSecret] = credentials.split(':')

    // Initialize Supabase with service role for API key verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify API key exists and is active
    const { data: apiKey, error: keyError } = await supabaseClient
      .from('woocommerce_api_keys')
      .select('*')
      .eq('api_key', consumerKey)
      .eq('api_secret', consumerSecret)
      .eq('is_active', true)
      .single()

    if (keyError || !apiKey) {
      return new Response(
        JSON.stringify({ code: 'woocommerce_rest_authentication_error', message: 'Invalid signature - provided signature does not match.', data: { status: 401 } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update last access time
    await supabaseClient
      .from('woocommerce_api_keys')
      .update({ last_access_at: new Date().toISOString() })
      .eq('id', apiKey.id)

    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '10')
    const search = url.searchParams.get('search') || ''
    const category = url.searchParams.get('category') || ''
    const status = url.searchParams.get('status') || 'publish'
    const orderby = url.searchParams.get('orderby') || 'date'
    const order = url.searchParams.get('order') || 'desc'

    const offset = (page - 1) * perPage

    // Build query
    let query = supabaseClient
      .from('products')
      .select('*, categories(*)', { count: 'exact' })

    if (search) {
      query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`)
    }

    if (category) {
      query = query.eq('category_id', category)
    }

    // Apply ordering
    const orderField = orderby === 'title' ? 'name' : orderby === 'date' ? 'created_at' : 'created_at'
    query = query.order(orderField, { ascending: order === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + perPage - 1)

    const { data: products, error: productsError, count } = await query

    if (productsError) {
      console.error('Products fetch error:', productsError)
      return new Response(
        JSON.stringify({ code: 'woocommerce_rest_cannot_view', message: 'Sorry, you cannot list resources.', data: { status: 500 } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transform products to WooCommerce format
    const wcProducts = products?.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      permalink: `https://${url.hostname}/product/${product.slug || product.id}`,
      date_created: product.created_at,
      date_created_gmt: product.created_at,
      date_modified: product.updated_at,
      date_modified_gmt: product.updated_at,
      type: 'simple',
      status: 'publish',
      featured: false,
      catalog_visibility: 'visible',
      description: product.description,
      short_description: product.description?.substring(0, 120) + '...',
      sku: product.sku,
      price: product.price?.toString(),
      regular_price: product.price?.toString(),
      sale_price: '',
      date_on_sale_from: null,
      date_on_sale_from_gmt: null,
      date_on_sale_to: null,
      date_on_sale_to_gmt: null,
      price_html: `<span class="amount">$${product.price}</span>`,
      on_sale: false,
      purchasable: true,
      total_sales: 0,
      virtual: false,
      downloadable: false,
      download_limit: -1,
      download_expiry: -1,
      external_url: '',
      button_text: '',
      tax_status: 'taxable',
      tax_class: '',
      manage_stock: true,
      stock_quantity: product.stock_quantity,
      stock_status: product.in_stock ? 'instock' : 'outofstock',
      backorders: 'no',
      backorders_allowed: false,
      backordered: false,
      sold_individually: false,
      weight: product.weight?.toString() || '',
      dimensions: {
        length: product.dimensions?.length?.toString() || '',
        width: product.dimensions?.width?.toString() || '',
        height: product.dimensions?.height?.toString() || ''
      },
      shipping_required: true,
      shipping_taxable: true,
      shipping_class: '',
      shipping_class_id: 0,
      reviews_allowed: true,
      average_rating: product.rating?.toString() || '0',
      rating_count: product.review_count || 0,
      related_ids: [],
      upsell_ids: [],
      cross_sell_ids: [],
      parent_id: 0,
      purchase_note: '',
      categories: product.categories ? [{
        id: product.categories.id,
        name: product.categories.name,
        slug: product.categories.slug
      }] : [],
      tags: product.tags?.map((tag: string, index: number) => ({
        id: index + 1,
        name: tag,
        slug: tag.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      })) || [],
      images: product.images?.map((image: string, index: number) => ({
        id: index + 1,
        date_created: product.created_at,
        date_created_gmt: product.created_at,
        date_modified: product.updated_at,
        date_modified_gmt: product.updated_at,
        src: image,
        name: `Product image ${index + 1}`,
        alt: product.name
      })) || [],
      attributes: [],
      default_attributes: [],
      variations: [],
      grouped_products: [],
      menu_order: 0,
      meta_data: []
    })) || []

    // Set pagination headers
    const totalPages = Math.ceil((count || 0) / perPage)
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-WP-Total': (count || 0).toString(),
      'X-WP-TotalPages': totalPages.toString()
    }

    console.log(`WC Products API: Returned ${wcProducts.length} products for ${apiKey.app_name}`)

    return new Response(
      JSON.stringify(wcProducts),
      { status: 200, headers: responseHeaders }
    )

  } catch (error) {
    console.error('Error in wc-products:', error)
    return new Response(
      JSON.stringify({ code: 'woocommerce_rest_cannot_view', message: 'Internal server error.', data: { status: 500 } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})