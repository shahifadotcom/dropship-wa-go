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
    const { orderId, transactionId, paymentGateway } = body ?? {};

    // Basic validation
    if (!transactionId || typeof transactionId !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "transactionId is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    const wallet = String(paymentGateway || "").toLowerCase();
    const localWallets = new Set(["bkash", "nagad", "rocket", "cod"]);

    if (!localWallets.has(wallet)) {
      return new Response(
        JSON.stringify({ success: false, error: "Not a local wallet payment" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 },
      );
    }

    // Ensure a pending transaction_verifications row exists for this order + tx (best-effort check)
    if (orderId) {
      const { data: tvRow, error: tvErr } = await supabase
        .from("transaction_verifications")
        .select("id")
        .eq("order_id", orderId)
        .eq("transaction_id", transactionId.trim())
        .eq("payment_gateway", wallet)
        .eq("status", "pending")
        .maybeSingle();

      if (tvErr) {
        // Log but continue to attempt matching via RPC
        console.log("transaction_verifications lookup error:", tvErr);
      }

      if (!tvRow) {
        console.log("No pending transaction_verifications row found for provided order/tx/gateway; RPC will still attempt match by tx.");
      }
    }

    // Attempt to match via secure RPC that also updates order/payment status when matched
    const { data: matchedOrderId, error: rpcError } = await supabase
      .rpc("match_sms_transaction_with_order", {
        p_transaction_id: transactionId.trim(),
        p_wallet_type: wallet,
      });

    if (rpcError) {
      console.error("RPC match_sms_transaction_with_order error:", rpcError);
      return new Response(
        JSON.stringify({ success: false, error: "RPC error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 },
      );
    }

    const success = !!matchedOrderId && (!orderId || matchedOrderId === orderId);

    return new Response(
      JSON.stringify({ success, matchedOrderId }),
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