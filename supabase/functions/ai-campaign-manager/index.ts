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

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const { action } = await req.json();

    if (action === 'create_campaigns') {
      // Get products and insights
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .eq('in_stock', true)
        .limit(20);

      const { data: insights } = await supabase
        .from('ai_audience_insights')
        .select('*')
        .order('last_analyzed_at', { ascending: false })
        .limit(5);

      // Get active platforms
      const { data: platforms } = await supabase
        .from('ad_platforms')
        .select('*')
        .eq('is_active', true);

      // Ask Gemini AI to create campaign strategy
      const prompt = `You are an expert digital marketing AI. Analyze these products and create optimized ad campaigns:

Products: ${JSON.stringify(products?.slice(0, 5))}
Audience Insights: ${JSON.stringify(insights)}
Available Platforms: ${platforms?.map(p => p.platform).join(', ')}

Create 3-5 highly targeted ad campaigns with:
1. Campaign name
2. Platform (choose best fit)
3. Objective (conversions, traffic, awareness)
4. Daily budget ($10-$100)
5. Target audience (demographics, interests, behaviors)
6. Ad creative recommendations
7. Why this campaign will reduce ad costs and increase ROI

Return as JSON array of campaigns.`;

      const geminiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      const geminiData = await geminiResponse.json();
      const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse AI response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      const campaigns = jsonMatch ? JSON.parse(jsonMatch[0]) : [];

      // Create campaigns in database
      const createdCampaigns = [];
      for (const campaign of campaigns) {
        const { data, error } = await supabase
          .from('ai_ad_campaigns')
          .insert({
            platform: campaign.platform,
            campaign_name: campaign.campaign_name,
            objective: campaign.objective,
            budget_daily: campaign.budget_daily,
            target_audience: campaign.target_audience,
            ad_creative: campaign.ad_creative,
            status: 'draft',
            ai_insights: {
              recommendation: campaign.reasoning,
              created_by: 'gemini-ai',
            },
          })
          .select()
          .single();

        if (!error && data) {
          createdCampaigns.push(data);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          campaigns: createdCampaigns,
          ai_analysis: aiResponse,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Error in ai-campaign-manager:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
