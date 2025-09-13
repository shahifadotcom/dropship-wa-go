import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// WooCommerce-compatible orders API endpoint
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const authHeader = req.headers.get('Authorization')
    
    // Extract Basic Auth credentials
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return new Response(
        JSON.stringify({ code: 'woocommerce_rest_cannot_view', message: 'Sorry, you cannot list resources.', data: { status: 401 } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const credentials = atob(authHeader.replace('Basic ', ''))
    const [consumerKey, consumerSecret] = credentials.split(':')

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify API key
    const { data: apiKey, error: keyError } = await supabaseClient
      .from('woocommerce_api_keys')
      .select('*')
      .eq('api_key', consumerKey)
      .eq('api_secret', consumerSecret)
      .eq('is_active', true)
      .single()

    if (keyError || !apiKey) {
      return new Response(
        JSON.stringify({ code: 'woocommerce_rest_authentication_error', message: 'Invalid signature.', data: { status: 401 } }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1')
    const perPage = parseInt(url.searchParams.get('per_page') || '10')
    const status = url.searchParams.get('status') || ''
    const orderby = url.searchParams.get('orderby') || 'date'
    const order = url.searchParams.get('order') || 'desc'

    const offset = (page - 1) * perPage

    // Build query for orders with items
    let query = supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (*)
      `, { count: 'exact' })

    if (status) {
      query = query.eq('status', status)
    }

    const orderField = orderby === 'date' ? 'created_at' : 'created_at'
    query = query.order(orderField, { ascending: order === 'asc' })
    query = query.range(offset, offset + perPage - 1)

    const { data: orders, error: ordersError, count } = await query

    if (ordersError) {
      console.error('Orders fetch error:', ordersError)
      return new Response(
        JSON.stringify({ code: 'woocommerce_rest_cannot_view', message: 'Sorry, you cannot list resources.', data: { status: 500 } }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Transform orders to WooCommerce format
    const wcOrders = orders?.map(order => ({
      id: order.id,
      parent_id: 0,
      number: order.order_number,
      order_key: `wc_order_${order.id}`,
      created_via: 'checkout',
      version: '8.0.0',
      status: order.status,
      currency: 'USD',
      date_created: order.created_at,
      date_created_gmt: order.created_at,
      date_modified: order.updated_at,
      date_modified_gmt: order.updated_at,
      discount_total: '0.00',
      discount_tax: '0.00',
      shipping_total: order.shipping?.toString() || '0.00',
      shipping_tax: '0.00',
      cart_tax: order.tax?.toString() || '0.00',
      total: order.total?.toString() || '0.00',
      total_tax: order.tax?.toString() || '0.00',
      prices_include_tax: false,
      customer_id: order.customer_id || 0,
      customer_ip_address: '',
      customer_user_agent: '',
      customer_note: '',
      billing: order.billing_address || {},
      shipping: order.shipping_address || {},
      payment_method: 'manual',
      payment_method_title: 'Manual Payment',
      transaction_id: '',
      date_paid: null,
      date_paid_gmt: null,
      date_completed: null,
      date_completed_gmt: null,
      cart_hash: '',
      meta_data: [],
      line_items: order.order_items?.map((item: any, index: number) => ({
        id: item.id,
        name: item.product_name,
        product_id: item.product_id,
        variation_id: 0,
        quantity: item.quantity,
        tax_class: '',
        subtotal: (parseFloat(item.price) * item.quantity).toString(),
        subtotal_tax: '0.00',
        total: (parseFloat(item.price) * item.quantity).toString(),
        total_tax: '0.00',
        taxes: [],
        meta_data: [],
        sku: '',
        price: parseFloat(item.price)
      })) || [],
      tax_lines: [],
      shipping_lines: [],
      fee_lines: [],
      coupon_lines: [],
      refunds: []
    })) || []

    const totalPages = Math.ceil((count || 0) / perPage)
    const responseHeaders = {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'X-WP-Total': (count || 0).toString(),
      'X-WP-TotalPages': totalPages.toString()
    }

    console.log(`WC Orders API: Returned ${wcOrders.length} orders for ${apiKey.app_name}`)

    return new Response(
      JSON.stringify(wcOrders),
      { status: 200, headers: responseHeaders }
    )

  } catch (error) {
    console.error('Error in wc-orders:', error)
    return new Response(
      JSON.stringify({ code: 'woocommerce_rest_cannot_view', message: 'Internal server error.', data: { status: 500 } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})