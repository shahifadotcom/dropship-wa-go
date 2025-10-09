import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const {
      event_name,
      event_data,
      value,
      product_id,
      order_id,
      session_id,
    } = await req.json();

    // Get user info from auth header if available
    const authHeader = req.headers.get('Authorization');
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Extract client info
    const userAgent = req.headers.get('user-agent') || '';
    const ipAddress = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || '';
    const referrer = req.headers.get('referer') || '';

    // Store tracking event
    const { data: trackingEvent, error: trackError } = await supabase
      .from('tracking_events')
      .insert({
        event_name,
        user_id: userId,
        session_id,
        event_data,
        product_id,
        order_id,
        value,
        user_agent: userAgent,
        ip_address: ipAddress,
        referrer,
      })
      .select()
      .single();

    if (trackError) {
      console.error('Error storing tracking event:', trackError);
      throw trackError;
    }

    // Send to server-side tracking function for all platforms
    const { error: serverError } = await supabase.functions.invoke(
      'server-side-tracking',
      {
        body: {
          event: trackingEvent,
        },
      }
    );

    if (serverError) {
      console.error('Server-side tracking error:', serverError);
    }

    return new Response(
      JSON.stringify({ success: true, event_id: trackingEvent.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error in track-event:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
