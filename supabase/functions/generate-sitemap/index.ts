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

    console.log('Generating sitemap...')

    // Get SEO settings
    const { data: seoSettings, error: seoError } = await supabase
      .from('seo_settings')
      .select('*')
      .single()

    if (seoError) {
      console.error('SEO settings error:', seoError)
    }

    const baseUrl = seoSettings?.canonical_url || 'https://yourstore.com'
    console.log('Base URL:', baseUrl)

    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('in_stock', true)

    if (productsError) {
      console.error('Products error:', productsError)
    }
    console.log('Products found:', products?.length || 0)

    // Get all categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('slug, updated_at')

    if (categoriesError) {
      console.error('Categories error:', categoriesError)
    }
    console.log('Categories found:', categories?.length || 0)

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Shop page -->
  <url>
    <loc>${baseUrl}/shop</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  
  <!-- Categories -->
  ${categories?.map(category => `
  <url>
    <loc>${baseUrl}/shop?category=${category.slug}</loc>
    <lastmod>${category.updated_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('') || ''}
  
  <!-- Products -->
  ${products?.map(product => `
  <url>
    <loc>${baseUrl}/products/${product.slug}</loc>
    <lastmod>${product.updated_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('') || ''}
  
  <!-- Static pages -->
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
</urlset>`

    // Update SEO settings with last generated timestamp
    await supabase
      .from('seo_settings')
      .update({ sitemap_last_generated: new Date().toISOString() })
      .eq('id', seoSettings?.id)

    console.log('Sitemap generated successfully')

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
      }
    })

  } catch (error) {
    console.error('Error generating sitemap:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: 'Failed to generate sitemap', details: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})