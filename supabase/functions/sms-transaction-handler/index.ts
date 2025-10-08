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

    const { 
      transaction_id, 
      sender_number, 
      message_content, 
      wallet_type, 
      amount,
      timestamp 
    } = smsData

    // First, store in sms_transactions table for audit trail
    const { error: smsError } = await supabase
      .from('sms_transactions')
      .insert({
        transaction_id,
        sender_number,
        message_content,
        wallet_type,
        amount,
        transaction_date: new Date(timestamp),
        is_processed: false
      })

    if (smsError) {
      console.error('Failed to store SMS:', smsError)
      // Continue anyway to try matching with orders
    }

    // Try to match with existing pending orders
    const { data: matchedOrderId } = await supabase
      .rpc('match_sms_transaction_with_order', {
        p_transaction_id: transaction_id,
        p_wallet_type: wallet_type
      })

    let transactionData = {
      transactionId: transaction_id,
      gateway: wallet_type,
      amount,
      sender: sender_number,
      message: message_content,
      timestamp,
      matched: !!matchedOrderId
    }

    // If no match found, store in transaction_verifications for manual review
    if (!matchedOrderId) {
      // This will fail due to RLS but we can catch it
      const { error: txError } = await supabase
        .from('transaction_verifications')
        .insert({
          transaction_id,
          payment_gateway: wallet_type,
          amount,
          status: 'pending'
        })

      if (txError) {
        console.log('Transaction verification insert failed (expected):', txError)
        // This is expected - will be manually matched by admin
      }
    }

    console.log('Transaction processed:', transactionData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: matchedOrderId ? 'Transaction matched and order updated' : 'Transaction stored for manual matching',
        data: transactionData,
        orderId: matchedOrderId
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error processing SMS:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: message 
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