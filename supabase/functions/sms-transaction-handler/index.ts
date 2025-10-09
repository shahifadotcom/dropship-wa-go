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
    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    console.log('SMS handler accessed by user:', user.id)

    const { smsData } = await req.json()
    
    console.log('Received SMS data:', smsData)

    const { 
      transaction_id, 
      sender_number, 
      message_content, 
      amount,
      new_balance,
      timestamp 
    } = smsData

    // Store SMS data with new balance for audit trail
    const { error: smsError } = await supabase
      .from('sms_transactions')
      .insert({
        transaction_id,
        sender_number,
        message_content,
        wallet_type: 'unknown', // Will be determined during matching
        amount,
        new_balance,
        transaction_date: new Date(timestamp),
        is_processed: false
      })

    if (smsError) {
      console.error('Failed to store SMS:', smsError)
      // Continue anyway
    }

    console.log('SMS transaction stored with balance:', new_balance)

    // Store in transaction_verifications for manual review with balance data
    const { error: verificationError } = await supabase
      .from('transaction_verifications')
      .insert({
        transaction_id,
        amount,
        new_balance,
        payment_gateway: 'pending_match', // Admin will assign wallet type
        status: 'pending'
      })

    if (verificationError) {
      console.error('Error storing verification:', verificationError)
    } else {
      console.log('Transaction stored for manual verification with balance:', new_balance)
    }

    let transactionData = {
      transactionId: transaction_id,
      amount,
      newBalance: new_balance,
      sender: sender_number,
      message: message_content,
      timestamp
    }

    console.log('Transaction processed:', transactionData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Transaction stored for manual matching',
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