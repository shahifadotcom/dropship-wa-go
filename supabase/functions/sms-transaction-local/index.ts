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

    const messageContent = String(smsData.message_content || '');
    const lowerMessage = messageContent.toLowerCase();
    
    // Determine wallet type from message
    let walletType = 'unknown';
    if (lowerMessage.includes('bkash')) {
      walletType = 'bkash';
    } else if (lowerMessage.includes('nagad')) {
      walletType = 'nagad';
    } else if (lowerMessage.includes('rocket')) {
      walletType = 'rocket';
    }

    // Extract additional data from SMS using regex patterns
    // Example SMS: "You have received Tk 500.00 from 01954723595. Ref 95352. Fee Tk 0.00. Balance Tk 510.00. TrxID CI131K7A2D at 01/09/2025 11:32"
    
    // Extract amount (e.g., "Tk 500.00")
    const amountMatch = messageContent.match(/(?:received|sent)\s+Tk\s+([\d,]+\.?\d*)/i);
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : null;

    // Extract balance (e.g., "Balance Tk 510.00")
    const balanceMatch = messageContent.match(/Balance\s+Tk\s+([\d,]+\.?\d*)/i);
    const newBalance = balanceMatch ? parseFloat(balanceMatch[1].replace(/,/g, '')) : null;

    // Extract fee (e.g., "Fee Tk 0.00")
    const feeMatch = messageContent.match(/Fee\s+Tk\s+([\d,]+\.?\d*)/i);
    const fee = feeMatch ? parseFloat(feeMatch[1].replace(/,/g, '')) : null;

    // Extract sender phone (e.g., "from 01954723595")
    const phoneMatch = messageContent.match(/(?:from|to)\s+(01\d{9})/i);
    const senderPhone = phoneMatch ? phoneMatch[1] : null;

    // Extract date/time if present (e.g., "at 01/09/2025 11:32")
    const dateMatch = messageContent.match(/at\s+(\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2})/i);
    let transactionDate = null;
    if (dateMatch) {
      try {
        // Parse DD/MM/YYYY HH:MM format
        const [datePart, timePart] = dateMatch[1].split(' ');
        const [day, month, year] = datePart.split('/');
        const [hour, minute] = timePart.split(':');
        transactionDate = new Date(`${year}-${month}-${day}T${hour.padStart(2, '0')}:${minute}:00`).toISOString();
      } catch (e) {
        console.error('Error parsing transaction date:', e);
      }
    }

    // If no date in message, use provided timestamp or current time
    if (!transactionDate) {
      transactionDate = smsData.timestamp ? new Date(smsData.timestamp).toISOString() : new Date().toISOString();
    }

    console.log('Extracted SMS data:', {
      transaction_id: smsData.transaction_id,
      wallet_type: walletType,
      amount,
      fee,
      new_balance: newBalance,
      sender_phone: senderPhone,
      transaction_date: transactionDate
    });

    // Store SMS transaction in database
    const { data, error } = await supabase
      .from('sms_transactions')
      .insert({
        transaction_id: smsData.transaction_id,
        sender_number: smsData.sender_number || 'unknown',
        sender_phone: senderPhone,
        message_content: messageContent,
        wallet_type: walletType,
        amount: amount,
        fee: fee,
        new_balance: newBalance,
        transaction_date: transactionDate,
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
        extracted_data: {
          amount,
          fee,
          balance: newBalance,
          sender_phone: senderPhone,
          wallet_type: walletType
        },
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
