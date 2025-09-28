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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { connectionId, productIds, importConfig } = await req.json()

    if (!connectionId || !productIds || !Array.isArray(productIds)) {
      return new Response(
        JSON.stringify({ error: 'Connection ID and product IDs array are required' }),
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

    // Create import job
    const { data: job, error: jobError } = await supabaseClient
      .from('cj_import_jobs')
      .insert({
        connection_id: connectionId,
        job_type: 'product_import',
        status: 'pending',
        total_items: productIds.length,
        processed_items: 0,
        failed_items: 0,
        job_data: {
          productIds,
          importConfig: importConfig || {}
        }
      })
      .select()
      .single()

    if (jobError) {
      console.error('Job creation error:', jobError)
      return new Response(
        JSON.stringify({ error: 'Failed to create import job' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Start background import process
    importProductsInBackground(job.id, connection, productIds, importConfig || {})

    console.log(`Import job ${job.id} created for ${productIds.length} products`)

    return new Response(
      JSON.stringify({ jobId: job.id }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in cj-import-products:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function importProductsInBackground(
  jobId: string, 
  connection: any, 
  productIds: string[], 
  importConfig: any
) {
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  try {
    // Update job status to running
    await supabaseClient
      .from('cj_import_jobs')
      .update({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', jobId)

    let processedCount = 0
    let failedCount = 0

    for (const productId of productIds) {
      try {
        // Get product details from CJ API
        const productResponse = await fetch(
          `https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${productId}`,
          {
            headers: {
              'Authorization': `Bearer ${connection.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!productResponse.ok) {
          throw new Error(`Failed to fetch product ${productId}`)
        }

        const productData = await productResponse.json()
        const product = productData.data

        if (!product) {
          throw new Error(`Product ${productId} not found`)
        }

        // Generate slug from product name
        const slug = product.productName
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim()

        // Calculate price with multiplier
        const basePrice = parseFloat(product.sellPrice || '0')
        const finalPrice = basePrice * (importConfig.priceMultiplier || 1.5)

        // Create product in local database
        const { data: localProduct, error: productError } = await supabaseClient
          .from('products')
          .insert({
            name: product.productName,
            description: product.description || product.productName,
            price: finalPrice,
            original_price: parseFloat(product.originalPrice || product.sellPrice || '0'),
            sku: product.productSku,
            images: product.productImages || [product.productImage],
            brand: product.brandName || '',
            stock_quantity: 100, // Default stock
            in_stock: true,
            weight: parseFloat(product.productWeight || '0'),
            slug: slug,
            meta_title: product.productName,
            meta_description: product.description || product.productName
          })
          .select()
          .single()

        if (productError) {
          throw new Error(`Failed to create local product: ${productError.message}`)
        }

        // Create import tracking record
        await supabaseClient
          .from('cj_product_imports')
          .insert({
            connection_id: connection.id,
            cj_product_id: productId,
            local_product_id: localProduct.id,
            cj_sku: product.productSku,
            import_status: 'imported',
            cj_data: product,
            last_sync_at: new Date().toISOString()
          })

        processedCount++
        console.log(`Successfully imported product ${productId}`)

      } catch (error) {
        failedCount++
        console.error(`Failed to import product ${productId}:`, error)
      }

      // Update job progress
      await supabaseClient
        .from('cj_import_jobs')
        .update({
          processed_items: processedCount,
          failed_items: failedCount
        })
        .eq('id', jobId)
    }

    // Mark job as completed
    await supabaseClient
      .from('cj_import_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        processed_items: processedCount,
        failed_items: failedCount
      })
      .eq('id', jobId)

    console.log(`Import job ${jobId} completed: ${processedCount} imported, ${failedCount} failed`)

  } catch (error) {
    console.error(`Import job ${jobId} failed:`, error)
    
    // Mark job as failed
    await supabaseClient
      .from('cj_import_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_log: (error instanceof Error ? error.message : String(error))
      })
      .eq('id', jobId)
  }
}