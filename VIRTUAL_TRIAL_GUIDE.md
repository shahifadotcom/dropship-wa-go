# Virtual Try-On Feature Guide

## Overview
The Virtual Try-On feature uses Google Gemini AI to create realistic images showing customers wearing clothing products. This helps customers visualize products before purchase, increasing confidence and reducing returns.

## Features Implemented

### 1. Database Structure
- ✅ `virtual_trial_enabled` field added to products table
- ✅ `virtual_trial_config` table for AI provider configuration
- ✅ `virtual_trial_sessions` table to track all try-on requests
- ✅ RLS policies implemented for security

### 2. Admin Panel

#### Product Management
- Navigate to `/admin/products`
- When adding/editing products, check **"Enable Virtual Try-On"** checkbox
- This option appears in the "Basic" tab of the product form
- Best suited for clothing, fashion accessories, eyewear, etc.

#### Virtual Trial Configuration (`/admin/virtual-trial`)
- **AI Provider**: Currently supports Google Gemini
- **Model Selection**: Choose from:
  - `gemini-2.0-flash-exp` (Recommended - Fast & High Quality)
  - `gemini-2.5-flash-image-preview` (Image generation focused)
  - `gemini-2.5-pro` (Most capable, slower)
- **Enable/Disable**: Toggle to activate/deactivate feature globally
- **API Key Status**: Shows if GEMINI_API_KEY is configured

### 3. Customer Experience
When viewing products with virtual try-on enabled:
1. Click **"Try It On Virtually"** button on product detail page
2. Upload a clear photo following the guidelines
3. Click **"Generate Virtual Try-On"**
4. AI processes the request (typically 5-15 seconds)
5. View the result showing them wearing the product

### 4. Edge Functions

#### `virtual-tryon`
- Processes virtual try-on requests
- Calls Google Gemini API with user and product images
- Stores results in Supabase Storage
- Updates session records in database

#### `check-gemini-key`
- Validates if GEMINI_API_KEY is configured
- Used by admin panel to show key status

## Setup Instructions

### 1. Configure Google Gemini API Key

1. Get your API key from [Google AI Studio](https://aistudio.google.com/apikey)
2. The key has been added to Supabase secrets as `GEMINI_API_KEY`
3. Verify in admin panel: `/admin/virtual-trial`

### 2. Enable Feature for Products

1. Go to `/admin/products`
2. Click "Add Product" or edit existing product
3. In the "Basic" tab, check **"Enable Virtual Try-On"**
4. Make sure the product has clear product images
5. Save the product

### 3. Configure AI Settings

1. Navigate to `/admin/virtual-trial`
2. Select your preferred AI model (default: gemini-2.0-flash-exp)
3. Toggle "Enable Virtual Try-On" to activate
4. Click "Save Configuration"

## Technical Details

### Storage Structure
```
product-images/
├── virtual-trial/           # User uploaded photos
│   └── [timestamp].jpg
└── virtual-trial-results/   # Generated results
    └── [session-id].jpg
```

### Database Tables

#### virtual_trial_config
```sql
- id: uuid (primary key)
- ai_provider: text (default: 'gemini')
- model_name: text (default: 'gemini-2.0-flash-exp')
- is_active: boolean (default: true)
- created_at: timestamptz
- updated_at: timestamptz
```

#### virtual_trial_sessions
```sql
- id: uuid (primary key)
- product_id: uuid (references products)
- user_image_url: text (user's uploaded photo)
- result_image_url: text (AI-generated result)
- status: text (processing/completed/failed)
- error_message: text
- created_at: timestamptz
- completed_at: timestamptz
```

### API Flow

1. **User uploads photo**
   - Uploaded to Supabase Storage (`product-images/virtual-trial/`)
   - Returns public URL

2. **Generate try-on**
   - Edge function `virtual-tryon` called with:
     - `productId`: Product UUID
     - `productImage`: Product image URL
     - `userImage`: User photo URL
   - Creates session record with status='processing'

3. **AI Processing**
   - Fetches both images
   - Converts to base64
   - Sends to Google Gemini API with prompt
   - Receives generated image

4. **Store Result**
   - Uploads result to Storage
   - Updates session with result URL and status='completed'
   - Returns result to frontend

## Best Practices

### For Administrators
1. **Test with sample products** before enabling for all products
2. **Monitor API usage** to manage costs
3. **Review generated results** periodically for quality
4. **Use appropriate model**: 
   - Flash for speed
   - Pro for highest quality
5. **Enable only for suitable products**: clothing, accessories, eyewear

### For Product Images
- Use clear, well-lit product photos
- Show products from front view
- Avoid busy backgrounds
- Ensure products are clearly visible

### For Customer Guidelines
The UI automatically shows these tips:
- Use clear, well-lit photos
- Face the camera directly
- Wear fitted clothing to show body shape
- Stand in neutral pose
- Avoid busy backgrounds

## Troubleshooting

### "GEMINI_API_KEY is not configured"
- Verify the key was added to Supabase secrets
- Check admin panel at `/admin/virtual-trial`
- Redeploy edge functions after adding key

### "Virtual try-on is not configured or disabled"
- Check if feature is enabled in `/admin/virtual-trial`
- Verify AI provider configuration exists

### "Failed to process virtual try-on"
- Check edge function logs
- Verify images are accessible (public URLs)
- Confirm Gemini API quota/limits
- Ensure image formats are supported (JPEG, PNG, WEBP)

### Poor Quality Results
- Try different AI model (Pro for better quality)
- Use higher quality input images
- Ensure good lighting in user photos
- Verify product images are clear

## Cost Considerations

Google Gemini API pricing varies by model:
- **Flash models**: Most cost-effective
- **Pro models**: Higher cost but better quality

Monitor usage through:
- `virtual_trial_sessions` table
- Google Cloud Console
- Supabase edge function logs

## Future Enhancements

Potential improvements:
1. Multiple pose generation
2. Background removal/replacement
3. Size/fit recommendations
4. Batch processing
5. Result caching
6. Social sharing of results
7. Save favorite try-ons

## Security

- ✅ RLS policies prevent unauthorized access
- ✅ API key stored securely in Supabase secrets
- ✅ File uploads validated (type, size)
- ✅ Session tracking for audit trails
- ✅ Public storage for results (no sensitive data)

## Support

For issues or questions:
1. Check edge function logs: `/admin/virtual-trial`
2. Review `virtual_trial_sessions` table for failed requests
3. Verify API key configuration
4. Test with different images

---

**Last Updated**: January 2025
**Version**: 1.0.0