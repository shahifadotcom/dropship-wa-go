import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action } = await req.json()

    switch (action) {
      case 'generate_qr':
        // Generate a mock QR code for demo purposes
        const qrCode = `whatsapp-qr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Store QR code in database
        await supabase
          .from('whatsapp_config')
          .upsert({
            id: 1,
            qr_code: qrCode,
            is_connected: false,
            session_data: null,
            created_at: new Date().toISOString()
          })

        return new Response(
          JSON.stringify({ success: true, qrCode }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'connect':
        // Simulate connection
        await supabase
          .from('whatsapp_config')
          .upsert({
            id: 1,
            qr_code: null,
            is_connected: true,
            session_data: { connected_at: new Date().toISOString() },
            created_at: new Date().toISOString()
          })

        return new Response(
          JSON.stringify({ success: true, isConnected: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'disconnect':
        // Clear all WhatsApp data
        await supabase
          .from('whatsapp_config')
          .delete()
          .eq('id', 1)

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'status':
        // Get current status
        const { data } = await supabase
          .from('whatsapp_config')
          .select('*')
          .eq('id', 1)
          .single()

        const isConnected = data?.is_connected || false
        const qrCodeData = data?.qr_code || null

        return new Response(
          JSON.stringify({
            isReady: isConnected,
            qrCode: qrCodeData,
            isConnected
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
    }

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})