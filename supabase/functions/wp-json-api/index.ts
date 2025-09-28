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
    const url = new URL(req.url)
    const pathname = url.pathname
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Handle different WooCommerce API endpoints
    if (pathname.includes('/wp-json/wc/v3/system_status')) {
      return new Response(
        JSON.stringify({
          environment: {
            home_url: url.origin,
            site_url: url.origin,
            version: "1.0.0",
            log_directory_writable: true,
            wp_version: "6.0.0",
            wp_multisite: false,
            wp_memory_limit: 268435456,
            wp_debug_mode: false,
            wp_cron: true,
            language: "en_US",
            external_object_cache: null,
            server_info: "nginx/1.20.1",
            php_version: "8.1.0",
            php_post_max_size: 67108864,
            php_max_execution_time: 30,
            php_max_input_vars: 1000,
            curl_version: "7.68.0",
            suhosin_installed: false,
            max_upload_size: 67108864,
            mysql_version: "8.0.0",
            mysql_version_string: "8.0.0",
            default_timezone: "UTC",
            fsockopen_or_curl_enabled: true,
            soapclient_enabled: true,
            domdocument_enabled: true,
            gzip_enabled: true,
            mbstring_enabled: true,
            remote_post_successful: true,
            remote_post_response: "200",
            remote_get_successful: true,
            remote_get_response: "200"
          },
          database: {
            wc_database_version: "7.0.0",
            database_prefix: "wp_",
            maxmind_geoip_database: null,
            database_tables: {
              woocommerce: [],
              other: []
            }
          },
          active_plugins: [
            {
              plugin: "woocommerce/woocommerce.php",
              name: "WooCommerce",
              version: "7.0.0",
              version_latest: "7.0.0",
              url: "https://woocommerce.com/",
              author_name: "Automattic",
              author_url: "https://woocommerce.com",
              network_activated: false
            }
          ],
          theme: {
            name: "Custom Theme",
            version: "1.0.0",
            version_latest: "1.0.0",
            author_url: "",
            is_child_theme: false,
            has_woocommerce_support: true,
            has_woocommerce_file: false,
            has_outdated_templates: false,
            overrides: [],
            parent_name: "",
            parent_version: "",
            parent_version_latest: ""
          },
          settings: {
            api_enabled: true,
            force_ssl: false,
            currency: "USD",
            currency_symbol: "$",
            currency_position: "left",
            thousand_separator: ",",
            decimal_separator: ".",
            number_of_decimals: 2,
            geolocation_enabled: false,
            taxonomies: {
              external: "external",
              grouped: "grouped",
              simple: "simple",
              variable: "variable"
            },
            product_visibility_terms: {},
            woocommerce_com_connected: true,
            enforce_approved_product_download_directories: false,
            order_datastore: "WC_Order_Data_Store_CPT"
          },
          security: {
            secure_connection: true,
            hide_errors: true
          },
          pages: []
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Handle WooCommerce authentication check
    if (pathname.includes('/wp-json/wc/v3') || pathname.includes('/wc/v3')) {
      // Check for API key authentication
      const authHeader = req.headers.get('Authorization')
      if (!authHeader || !authHeader.startsWith('Basic ')) {
        return new Response(
          JSON.stringify({
            code: "woocommerce_rest_authentication_error",
            message: "Invalid authentication credentials.",
            data: { status: 401 }
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Decode base64 credentials
      const base64Credentials = authHeader.split(' ')[1]
      const credentials = atob(base64Credentials)
      const [consumerKey, consumerSecret] = credentials.split(':')

      // Verify API key exists in database
      const { data: apiKey, error } = await supabaseClient
        .from('woocommerce_api_keys')
        .select('*')
        .eq('api_key', consumerKey)
        .eq('api_secret', consumerSecret)
        .eq('is_active', true)
        .single()

      if (error || !apiKey) {
        return new Response(
          JSON.stringify({
            code: "woocommerce_rest_authentication_error",
            message: "Invalid API key.",
            data: { status: 401 }
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Handle products endpoint
      if (pathname.includes('/products')) {
        const { data: products, error: productsError } = await supabaseClient
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })

        if (productsError) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch products' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Transform products to WooCommerce format
        const wcProducts = products?.map(product => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          permalink: `${url.origin}/product/${product.slug}`,
          date_created: product.created_at,
          date_modified: product.updated_at,
          type: "simple",
          status: product.in_stock ? "publish" : "draft",
          featured: false,
          catalog_visibility: "visible",
          description: product.description,
          short_description: product.meta_description || "",
          sku: product.sku,
          price: product.price?.toString() || "0",
          regular_price: product.original_price?.toString() || product.price?.toString() || "0",
          sale_price: product.price !== product.original_price ? product.price?.toString() : "",
          price_html: `$${product.price}`,
          on_sale: product.price !== product.original_price,
          purchasable: true,
          total_sales: 0,
          virtual: false,
          downloadable: false,
          downloads: [],
          download_limit: -1,
          download_expiry: -1,
          external_url: "",
          button_text: "",
          tax_status: "taxable",
          tax_class: "",
          manage_stock: true,
          stock_quantity: product.stock_quantity,
          stock_status: product.in_stock ? "instock" : "outofstock",
          backorders: "no",
          backorders_allowed: false,
          backordered: false,
          sold_individually: false,
          weight: product.weight?.toString() || "",
          dimensions: {
            length: product.dimensions?.length?.toString() || "",
            width: product.dimensions?.width?.toString() || "",
            height: product.dimensions?.height?.toString() || ""
          },
          shipping_required: true,
          shipping_taxable: true,
          shipping_class: "",
          shipping_class_id: 0,
          reviews_allowed: true,
          average_rating: product.rating?.toString() || "0",
          rating_count: product.review_count || 0,
          related_ids: [],
          upsell_ids: [],
          cross_sell_ids: [],
          parent_id: 0,
          purchase_note: "",
          categories: [
            {
              id: product.category_id,
              name: "General",
              slug: "general"
            }
          ],
          tags: product.tags?.map((tag: string) => ({ name: tag, slug: tag.toLowerCase().replace(/\s+/g, '-') })) || [],
          images: product.images?.map((image: string, index: number) => ({
            id: index + 1,
            date_created: product.created_at,
            date_modified: product.updated_at,
            src: image,
            name: product.name,
            alt: product.name,
            position: index
          })) || [],
          attributes: [],
          default_attributes: [],
          variations: [],
          grouped_products: [],
          menu_order: 0,
          meta_data: []
        })) || []

        return new Response(
          JSON.stringify(wcProducts),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Handle orders endpoint
      if (pathname.includes('/orders')) {
        const { data: orders, error: ordersError } = await supabaseClient
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })

        if (ordersError) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch orders' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          )
        }

        // Transform orders to WooCommerce format
        const wcOrders = orders?.map(order => ({
          id: order.id,
          parent_id: 0,
          number: order.order_number || order.id,
          order_key: `wc_order_${order.id}`,
          created_via: "api",
          version: "7.0.0",
          status: order.status || "pending",
          currency: "USD",
          date_created: order.created_at,
          date_modified: order.updated_at,
          discount_total: "0.00",
          discount_tax: "0.00",
          shipping_total: order.shipping_cost?.toString() || "0.00",
          shipping_tax: "0.00",
          cart_tax: "0.00",
          total: order.total_amount?.toString() || "0.00",
          total_tax: "0.00",
          prices_include_tax: false,
          customer_id: order.user_id || 0,
          customer_ip_address: "",
          customer_user_agent: "",
          customer_note: order.notes || "",
          billing: {
            first_name: order.customer_name?.split(' ')[0] || "",
            last_name: order.customer_name?.split(' ').slice(1).join(' ') || "",
            company: "",
            address_1: order.shipping_address || "",
            address_2: "",
            city: "",
            state: "",
            postcode: "",
            country: "",
            email: order.customer_email || "",
            phone: order.customer_phone || ""
          },
          shipping: {
            first_name: order.customer_name?.split(' ')[0] || "",
            last_name: order.customer_name?.split(' ').slice(1).join(' ') || "",
            company: "",
            address_1: order.shipping_address || "",
            address_2: "",
            city: "",
            state: "",
            postcode: "",
            country: ""
          },
          payment_method: order.payment_method || "",
          payment_method_title: order.payment_method || "",
          transaction_id: order.transaction_id || "",
          date_paid: order.created_at,
          date_completed: null,
          cart_hash: "",
          meta_data: [],
          line_items: order.items || [],
          tax_lines: [],
          shipping_lines: [],
          fee_lines: [],
          coupon_lines: [],
          refunds: []
        })) || []

        return new Response(
          JSON.stringify(wcOrders),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Default API response
      return new Response(
        JSON.stringify({
          name: "WooCommerce Store",
          description: "Just another WooCommerce store",
          url: url.origin,
          wc_version: "7.0.0",
          routes: {
            "/wp-json/wc/v3": "WooCommerce REST API"
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Default 404 response
    return new Response(
      JSON.stringify({ error: "Not found" }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in wp-json-api:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})