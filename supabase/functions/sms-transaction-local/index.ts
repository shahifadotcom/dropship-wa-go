import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Regex patterns to extract data from SMS
const PATTERNS = {
  // Amount patterns: "Tk 500.00" or "BDT 500"
  amount: /(?:Tk|BDT)\s*([\d,]+\.?\d*)/i,
  // Balance patterns: "Balance Tk 510.00" or "Balance BDT 1,234.56"
  balance: /Balance\s*(?:Tk|BDT)?\s*([\d,]+\.?\d*)/i,
  // Fee patterns: "Fee Tk 0.00"
  fee: /Fee\s*(?:Tk|BDT)?\s*([\d,]+\.?\d*)/i,
  // Phone number patterns: "from 01954723595"
  phone: /from\s*(\d{11})/i,
  // Transaction date: "at 01/09/2025 11:32"
  date: /at\s*(\d{2}\/\d{2}\/\d{4}\s+\d{1,2}:\d{2})/i,
};

function extractNumber(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  if (match && match[1]) {
    // Remove commas and parse as float
    return parseFloat(match[1].replace(/,/g, ''));
  }
  return null;
}

function extractPhone(text: string): string | null {
  const match = text.match(PATTERNS.phone);
  return match ? match[1] : null;
}

function extractDate(text: string): string | null {
  const match = text.match(PATTERNS.date);
  if (match && match[1]) {
    try {
      // Parse "01/09/2025 11:32" format
      const [datePart, timePart] = match[1].split(' ');
      const [day, month, year] = datePart.split('/');
      const [hours, minutes] = timePart.split(':');
      
      // Create ISO date string
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );
      
      return date.toISOString();
    } catch (e) {
      console.error('Error parsing date:', e);
      return null;
    }
  }
  return null;
}

function determineWalletType(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('bkash') || lowerMessage.includes('b-kash')) {
    return 'bkash';
  } else if (lowerMessage.includes('nagad')) {
    return 'nagad';
  } else if (lowerMessage.includes('rocket')) {
    return 'rocket';
  }
  
  return 'unknown';
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { smsData } = await req.json();

    if (!smsData || !smsData.transaction_id) {
      console.error('Missing transaction_id in request');
      return new Response(
        JSON.stringify({ error: 'Transaction ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const messageContent = String(smsData.message_content || '');
    
    // Extract all data from SMS
    const walletType = determineWalletType(messageContent);
    const amount = extractNumber(messageContent, PATTERNS.amount);
    const balance = extractNumber(messageContent, PATTERNS.balance);
    const fee = extractNumber(messageContent, PATTERNS.fee);
    const senderPhone = extractPhone(messageContent);
    const transactionDate = extractDate(messageContent);

    console.log('Extracted SMS data:', {
      transaction_id: smsData.transaction_id,
      wallet_type: walletType,
      amount,
      balance,
      fee,
      sender_phone: senderPhone,
      transaction_date: transactionDate
    });

    // Prepare data for insertion
    const insertData = {
      transaction_id: smsData.transaction_id,
      sender_number: smsData.sender_number || 'unknown',
      sender_phone: senderPhone,
      message_content: messageContent,
      wallet_type: walletType,
      amount: amount,
      new_balance: balance,
      fee: fee,
      transaction_date: transactionDate || (smsData.timestamp ? new Date(smsData.timestamp).toISOString() : new Date().toISOString()),
      is_processed: false
    };

    // Store SMS transaction in database
    const { data, error } = await supabase
      .from('sms_transactions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // If duplicate, that's fine - transaction already recorded
      if (error.code === '23505') {
        console.log('Transaction already exists:', smsData.transaction_id);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Transaction already recorded', 
            duplicate: true 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Database insert error:', error);
      throw error;
    }

    console.log('SMS transaction stored successfully:', data.id);

    // Try to match with existing pending order
    try {
      const { data: matchResult, error: matchError } = await supabase
        .rpc('match_sms_transaction_with_order', {
          p_transaction_id: smsData.transaction_id,
          p_wallet_type: walletType
        });

      if (matchError) {
        console.error('Error matching transaction with order:', matchError);
      } else if (matchResult) {
        console.log('✓ Matched with order:', matchResult);
      } else {
        console.log('No matching order found for transaction:', smsData.transaction_id);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          transaction_id: smsData.transaction_id,
          matched: !!matchResult,
          extracted_data: {
            amount,
            balance,
            fee,
            sender_phone: senderPhone,
            wallet_type: walletType
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (matchError) {
      console.error('Error in order matching:', matchError);
      // Return success even if matching fails
      return new Response(
        JSON.stringify({ 
          success: true, 
          transaction_id: smsData.transaction_id,
          matched: false,
          extracted_data: {
            amount,
            balance,
            fee,
            sender_phone: senderPhone,
            wallet_type: walletType
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error handling SMS transaction:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
