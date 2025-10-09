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
    const { topic, keywords, type } = await req.json();
    
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
    if (type === 'blog') {
      prompt = `Write a comprehensive blog post about "${topic}". 
      Include these keywords naturally: ${keywords?.join(', ') || 'none'}.
      Structure: 
      - Engaging title
      - Brief excerpt (150-200 characters)
      - Detailed content with multiple paragraphs
      - SEO-optimized meta title and description
      Format as JSON with: title, excerpt, content, metaTitle, metaDescription, tags (array)`;
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
            maxOutputTokens: 2048,
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
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Parse JSON from the response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    let result;
    
    if (jsonMatch) {
      result = JSON.parse(jsonMatch[0]);
    } else {
      // Fallback if JSON parsing fails
      result = {
        title: topic,
        content: generatedText,
        excerpt: generatedText.substring(0, 200),
        metaTitle: topic,
        metaDescription: generatedText.substring(0, 160),
        tags: keywords || []
      };
    }

    return new Response(
      JSON.stringify(result),
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