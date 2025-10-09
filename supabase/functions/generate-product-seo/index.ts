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
    const { productName, description, category, type } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get Gemini API key from ai_settings
    const { data: settings } = await supabase
      .from('ai_settings')
      .select('gemini_api_key')
      .single();

    const apiKey = settings?.gemini_api_key || Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      throw new Error('Gemini API key not configured');
    }

    let prompt = '';
    
    if (type === 'title') {
      prompt = `Generate an SEO-optimized, compelling product title for: "${productName}"
      Category: ${category || 'general'}
      Make it catchy, include key features, and keep it under 60 characters.
      Return only the title text, no quotes or formatting.`;
    } else if (type === 'description') {
      prompt = `Generate a detailed, SEO-optimized product description for: "${productName}"
      Current description: ${description || 'None'}
      Category: ${category || 'general'}
      Include benefits, features, and use cases. Make it engaging and informative.
      Return only the description text.`;
    } else if (type === 'tags') {
      prompt = `Generate 5-10 relevant SEO tags for this product: "${productName}"
      Description: ${description || 'None'}
      Category: ${category || 'general'}
      Return as comma-separated values only.`;
    } else if (type === 'all') {
      prompt = `Generate complete SEO-optimized content for this product:
      Product Name: "${productName}"
      Description: ${description || 'None'}
      Category: ${category || 'general'}
      
      Provide as JSON with:
      - title: Catchy, SEO-friendly title (under 60 chars)
      - description: Detailed product description (200-300 words)
      - metaTitle: SEO meta title (under 60 chars)
      - metaDescription: SEO meta description (under 160 chars)
      - tags: Array of 5-10 relevant tags
      - socialPreview: Brief engaging text for social media (under 100 chars)`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate content');
    }

    const data = await response.json();
    let generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    let result;
    
    if (type === 'all') {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = {
          title: productName,
          description: generatedText,
          metaTitle: productName,
          metaDescription: generatedText.substring(0, 160),
          tags: [],
          socialPreview: generatedText.substring(0, 100)
        };
      }
    } else if (type === 'tags') {
      result = generatedText.split(',').map(tag => tag.trim()).filter(Boolean);
    } else {
      result = generatedText.trim();
    }

    return new Response(
      JSON.stringify({ result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});