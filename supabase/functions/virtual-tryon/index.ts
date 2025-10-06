import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { productId, productImage, userImage } = await req.json();

    if (!productId || !productImage || !userImage) {
      throw new Error('Missing required parameters');
    }

    // Get virtual trial configuration
    const { data: config, error: configError } = await supabaseClient
      .from('virtual_trial_config')
      .select('*')
      .eq('is_active', true)
      .single();

    if (configError || !config) {
      throw new Error('Virtual try-on is not configured or disabled');
    }

    // Build API key list from config and environment
    const apiKeysList: string[] = [];
    
    // Add API keys from database config
    if (config.api_keys && Array.isArray(config.api_keys)) {
      apiKeysList.push(...config.api_keys.filter((key: string) => key && key.trim() !== ''));
    }
    
    // Add fallback from environment variable
    const envApiKey = Deno.env.get('GEMINI_API_KEY');
    if (envApiKey) {
      apiKeysList.push(envApiKey);
    }

    if (apiKeysList.length === 0) {
      throw new Error('No Gemini API keys configured. Please add API keys in admin settings or GEMINI_API_KEY secret.');
    }

    console.log(`Found ${apiKeysList.length} API key(s) to try`);

    // Fetch images as base64
    const [productImageResponse, userImageResponse] = await Promise.all([
      fetch(productImage),
      fetch(userImage)
    ]);

    const productImageBlob = await productImageResponse.blob();
    const userImageBlob = await userImageResponse.blob();

    const productImageArrayBuffer = await productImageBlob.arrayBuffer();
    const userImageArrayBuffer = await userImageBlob.arrayBuffer();

    const productImageBase64 = btoa(
      new Uint8Array(productImageArrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );
    const userImageBase64 = btoa(
      new Uint8Array(userImageArrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ''
      )
    );

    // Create session record
    const { data: session, error: sessionError } = await supabaseClient
      .from('virtual_trial_sessions')
      .insert({
        product_id: productId,
        user_image_url: userImage,
        status: 'processing'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Session creation error:', sessionError);
      throw new Error('Failed to create virtual trial session');
    }

    // Try each API key until one succeeds
    let geminiData: any = null;
    let lastError: any = null;
    let successfulKeyIndex = -1;

    for (let i = 0; i < apiKeysList.length; i++) {
      const apiKey = apiKeysList[i];
      console.log(`Trying API key ${i + 1}/${apiKeysList.length} with model:`, config.model_name);

      try {
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${config.model_name}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: "You are a virtual try-on AI. Create a realistic image showing the person wearing the clothing item. Maintain the person's body proportions, pose, and background. Only change the clothing to show them wearing the product. Make it look natural and realistic.",
                    },
                    {
                      inline_data: {
                        mime_type: 'image/jpeg',
                        data: userImageBase64,
                      },
                    },
                    {
                      inline_data: {
                        mime_type: 'image/jpeg',
                        data: productImageBase64,
                      },
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 1,
                maxOutputTokens: 4096,
              },
            }),
          }
        );

        if (geminiResponse.ok) {
          geminiData = await geminiResponse.json();
          successfulKeyIndex = i;
          console.log(`✓ API key ${i + 1} succeeded`);
          break; // Success! Exit the loop
        } else {
          const errorText = await geminiResponse.text();
          lastError = {
            status: geminiResponse.status,
            message: errorText
          };
          console.log(`✗ API key ${i + 1} failed with status ${geminiResponse.status}`);
          
          // If it's not a rate limit error, stop trying
          if (geminiResponse.status !== 429) {
            break;
          }
        }
      } catch (error) {
        console.error(`Error with API key ${i + 1}:`, error);
        lastError = error;
      }
    }

    // If all keys failed
    if (!geminiData) {
      const errorMessage = lastError?.status === 429 
        ? `All ${apiKeysList.length} API key(s) have exceeded their rate limits. Please try again later or add more API keys in admin settings.`
        : `Failed to generate image. Error: ${lastError?.message || 'Unknown error'}`;
      
      await supabaseClient
        .from('virtual_trial_sessions')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', session.id);
      
      throw new Error(errorMessage);
    }

    console.log(`✓ Successfully generated image using API key ${successfulKeyIndex + 1}`);

    // Extract generated image from response
    const candidate = geminiData.candidates?.[0];
    const imagePart = candidate?.content?.parts?.find((part: any) => part.inline_data);

    if (!imagePart?.inline_data?.data) {
      throw new Error('No image generated by AI');
    }

    const resultImageBase64 = imagePart.inline_data.data;

    // Upload result to Supabase Storage
    const resultFileName = `virtual-trial-results/${session.id}.jpg`;
    const resultImageBuffer = Uint8Array.from(atob(resultImageBase64), c => c.charCodeAt(0));

    const { error: uploadError } = await supabaseClient.storage
      .from('product-images')
      .upload(resultFileName, resultImageBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to save result image');
    }

    const { data: { publicUrl } } = supabaseClient.storage
      .from('product-images')
      .getPublicUrl(resultFileName);

    // Update session with result
    await supabaseClient
      .from('virtual_trial_sessions')
      .update({
        result_image_url: publicUrl,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', session.id);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        resultImage: publicUrl,
        success: true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Virtual try-on error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process virtual try-on',
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});