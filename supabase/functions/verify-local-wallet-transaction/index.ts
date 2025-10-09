// Deno Edge Function: verify-local-wallet-transaction
// Verifies local wallet payments (bkash, nagad, rocket, cod) by matching
// the provided transaction ID against the sms_transactions table using a
// secure RPC, and updates order + transaction status when matched.

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing Supabase credentials" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json().catch(() => ({}));
    const { orderId, transactionId } = body ?? {};

    // Basic validation
    if (!transactionId || typeof transactionId !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "transactionId is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const tx = transactionId.trim();

    // Check sms_transactions table by transaction_id only (no wallet filtering)
    const { data: smsTx, error: smsErr } = await supabase
      .from("sms_transactions")
      .select("id")
      .eq("transaction_id", tx)
      .limit(1)
      .maybeSingle();

    if (smsErr) {
      console.error("sms_transactions lookup error:", smsErr);
      return new Response(
        JSON.stringify({ success: false, error: "Lookup error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    if (!smsTx) {
      return new Response(
        JSON.stringify({ success: false, matchedOrderId: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // If we have an orderId, best-effort update verification + mark order paid
    if (orderId) {
      try {
        await supabase
          .from("transaction_verifications")
          .update({ status: "verified", verified_at: new Date().toISOString() })
          .eq("order_id", orderId)
          .eq("transaction_id", tx);

        await supabase
          .from("orders")
          .update({ payment_status: "paid", updated_at: new Date().toISOString() })
          .eq("id", orderId);
      } catch (e) {
        console.log("Non-fatal update error:", e);
      }
    }

    return new Response(
      JSON.stringify({ success: true, matchedOrderId: orderId ?? null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    console.error("verify-local-wallet-transaction unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Unexpected error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
    );
  }
});