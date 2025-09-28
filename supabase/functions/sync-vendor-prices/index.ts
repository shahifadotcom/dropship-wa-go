import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-VENDOR-PRICES] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { vendorId } = await req.json();
    logStep("Syncing prices for vendor", { vendorId });

    // Get vendor details
    const { data: vendor, error: vendorError } = await supabaseClient
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .eq('is_active', true)
      .eq('price_sync_enabled', true)
      .single();

    if (vendorError || !vendor) {
      throw new Error('Vendor not found or price sync not enabled');
    }

    // Get products linked to this vendor
    const { data: vendorProducts, error: productsError } = await supabaseClient
      .from('vendor_products')
      .select(`
        *,
        products(id, name, price)
      `)
      .eq('vendor_id', vendorId)
      .eq('is_available', true);

    if (productsError) {
      throw new Error(`Failed to fetch vendor products: ${productsError.message}`);
    }

    logStep("Found products to sync", { count: vendorProducts?.length || 0 });

    const syncResults = [];

    for (const vendorProduct of vendorProducts || []) {
      try {
        let newPrice;

        switch (vendor.api_type) {
          case 'cjdropshipping':
            newPrice = await getCJDropshippingPrice(vendor, vendorProduct);
            break;
          case 'zendrop':
            newPrice = await getZendropPrice(vendor, vendorProduct);
            break;
          case 'autods':
            newPrice = await getAutodsPrice(vendor, vendorProduct);
            break;
          case 'spocket':
            newPrice = await getSpocketPrice(vendor, vendorProduct);
            break;
          case 'printful':
            newPrice = await getPrintfulPrice(vendor, vendorProduct);
            break;
          default:
            logStep("Unsupported API type", { apiType: vendor.api_type });
            continue;
        }

        const oldPrice = vendorProduct.products.price;
        const priceChanged = Math.abs(newPrice - oldPrice) > 0.01;

        if (priceChanged) {
          // Update product price
          const { error: updateError } = await supabaseClient
            .from('products')
            .update({ 
              price: newPrice,
              updated_at: new Date().toISOString()
            })
            .eq('id', vendorProduct.product_id);

          if (updateError) {
            throw new Error(`Failed to update product price: ${updateError.message}`);
          }

          // Update vendor product record
          await supabaseClient
            .from('vendor_products')
            .update({
              vendor_price: newPrice,
              last_price_update: new Date().toISOString()
            })
            .eq('id', vendorProduct.id);

          // Log the price change
          await supabaseClient
            .from('price_sync_logs')
            .insert({
              vendor_id: vendorId,
              product_id: vendorProduct.product_id,
              old_price: oldPrice,
              new_price: newPrice,
              sync_status: 'success'
            });

          logStep("Price updated", {
            productName: vendorProduct.products.name,
            oldPrice,
            newPrice
          });
        }

        syncResults.push({
          productId: vendorProduct.product_id,
          productName: vendorProduct.products.name,
          oldPrice,
          newPrice,
          changed: priceChanged,
          success: true
        });

      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        logStep("Error syncing product price", {
          productId: vendorProduct.product_id,
          error: msg
        });

        // Log the failed sync
        await supabaseClient
          .from('price_sync_logs')
          .insert({
            vendor_id: vendorId,
            product_id: vendorProduct.product_id,
            old_price: vendorProduct.products.price,
            new_price: null,
            sync_status: 'failed',
            error_message: msg
          });

        syncResults.push({
          productId: vendorProduct.product_id,
          productName: vendorProduct.products.name,
          success: false,
          error: msg
        });
      }
    }

    // Update vendor last sync time
    await supabaseClient
      .from('vendors')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', vendorId);

    logStep("Price sync completed", { results: syncResults });

    return new Response(JSON.stringify({
      success: true,
      vendorId,
      syncResults,
      totalProducts: vendorProducts?.length || 0,
      changedProducts: syncResults.filter(r => r.changed).length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in sync-vendor-prices", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// Price fetching functions for different vendors

async function getCJDropshippingPrice(vendor: any, vendorProduct: any): Promise<number> {
  const apiKey = vendor.access_token || vendor.api_key;
  
  const response = await fetch(`${vendor.api_endpoint}/products/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': apiKey
    },
    body: JSON.stringify({
      pid: vendorProduct.vendor_product_id
    })
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`CJ Dropshipping API error: ${result.message || 'Unknown error'}`);
  }

  return parseFloat(result.data?.sellPrice || vendorProduct.vendor_price);
}

async function getZendropPrice(vendor: any, vendorProduct: any): Promise<number> {
  const apiKey = vendor.api_key;
  
  const response = await fetch(`${vendor.api_endpoint}/products/${vendorProduct.vendor_product_id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Zendrop API error: ${result.message || 'Unknown error'}`);
  }

  return parseFloat(result.price || vendorProduct.vendor_price);
}

async function getAutodsPrice(vendor: any, vendorProduct: any): Promise<number> {
  const apiKey = vendor.api_key;
  
  const response = await fetch(`${vendor.api_endpoint}/products/${vendorProduct.vendor_product_id}/price`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`AutoDS API error: ${result.message || 'Unknown error'}`);
  }

  return parseFloat(result.current_price || vendorProduct.vendor_price);
}

async function getSpocketPrice(vendor: any, vendorProduct: any): Promise<number> {
  const apiKey = vendor.api_key;
  
  const response = await fetch(`${vendor.api_endpoint}/products/${vendorProduct.vendor_product_id}`, {
    method: 'GET',
    headers: {
      'X-API-Key': apiKey
    }
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Spocket API error: ${result.message || 'Unknown error'}`);
  }

  return parseFloat(result.price || vendorProduct.vendor_price);
}

async function getPrintfulPrice(vendor: any, vendorProduct: any): Promise<number> {
  const apiKey = vendor.api_key;
  
  const response = await fetch(`${vendor.api_endpoint}/products/${vendorProduct.vendor_product_id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Printful API error: ${result.error?.message || 'Unknown error'}`);
  }

  return parseFloat(result.result?.variants?.[0]?.price || vendorProduct.vendor_price);
}