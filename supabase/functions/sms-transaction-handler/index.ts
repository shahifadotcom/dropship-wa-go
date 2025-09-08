import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

    const { smsData } = await req.json()
    
    console.log('Received SMS data:', smsData)

    // SMS patterns for Bangladesh payment gateways
    const patterns = {
      bkash: /bKash.*?(?:TrxID|Transaction ID):?\s*([A-Z0-9]+).*?(?:Amount|Tk):?\s*([0-9,.]+)/i,
      nagad: /Nagad.*?(?:TxnId|Transaction):?\s*([A-Z0-9]+).*?(?:Amount|Tk):?\s*([0-9,.]+)/i,
      rocket: /Rocket.*?(?:TxID|Reference):?\s*([A-Z0-9]+).*?(?:Amount|Tk):?\s*([0-9,.]+)/i,
      upay: /Upay.*?(?:TxnId|Transaction):?\s*([A-Z0-9]+).*?(?:Amount|Tk):?\s*([0-9,.]+)/i,
      mcash: /mCash.*?(?:TxID|Reference):?\s*([A-Z0-9]+).*?(?:Amount|Tk):?\s*([0-9,.]+)/i,
    }

    const { message, sender, timestamp } = smsData
    let transactionFound = false
    let transactionData = null

    // Check each pattern
    for (const [gateway, pattern] of Object.entries(patterns)) {
      const match = message.match(pattern)
      if (match) {
        const transactionId = match[1]
        const amount = match[2]
        
        transactionData = {
          transactionId,
          gateway,
          amount: parseFloat(amount.replace(/[,]/g, '')),
          sender,
          message,
          timestamp
        }

        // Store in transaction_verifications table
        const { data, error } = await supabase
          .from('transaction_verifications')
          .insert({
            transaction_id: transactionId,
            payment_gateway: gateway,
            amount: transactionData.amount,
            status: 'pending'
          })

        if (error) {
          console.error('Database error:', error)
          throw error
        }

        console.log('Transaction stored:', transactionData)
        transactionFound = true
        break
      }
    }

    if (transactionFound) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Transaction detected and stored',
          data: transactionData 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
          status: 200 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No transaction pattern matched' 
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          },
          status: 200 
        }
      )
    }

  } catch (error) {
    console.error('Error processing SMS:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 500 
      }
    )
  }
})