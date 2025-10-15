import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { smsData } = await req.json();

    if (!smsData || !smsData.transaction_id) {
      return new Response(
        JSON.stringify({ error: 'Transaction ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Extract wallet type from message or default to generic
    const messageContent = String(smsData.message_content || '').toLowerCase();
    let walletType = 'unknown';
    
    if (messageContent.includes('bkash')) {
      walletType = 'bkash';
    } else if (messageContent.includes('nagad')) {
      walletType = 'nagad';
    } else if (messageContent.includes('rocket')) {
      walletType = 'rocket';
    }

    // Extract amount if provided
    const amount = smsData.amount || null;
    const newBalance = smsData.new_balance || null;

    // Store SMS transaction in database
    const { data, error } = await supabase
      .from('sms_transactions')
      .insert({
        transaction_id: smsData.transaction_id,
        sender_number: smsData.sender_number || 'unknown',
        message_content: smsData.message_content || '',
        wallet_type: walletType,
        amount: amount,
        new_balance: newBalance,
        timestamp: smsData.timestamp ? new Date(smsData.timestamp).toISOString() : new Date().toISOString(),
        is_processed: false
      })
      .select()
      .single();

    if (error) {
      // If duplicate, that's fine - transaction already recorded
      if (error.code === '23505') {
        console.log('Transaction already exists:', smsData.transaction_id);
        return new Response(
          JSON.stringify({ success: true, message: 'Transaction already recorded', duplicate: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    console.log('SMS transaction stored:', data);

    // Try to match with existing pending order
    const { data: matchResult } = await supabase
      .rpc('match_sms_transaction_with_order', {
        p_transaction_id: smsData.transaction_id,
        p_wallet_type: walletType
      });

    if (matchResult) {
      console.log('Matched with order:', matchResult);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction_id: smsData.transaction_id,
        matched: !!matchResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error handling SMS transaction:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});