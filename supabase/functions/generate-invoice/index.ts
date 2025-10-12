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
    const { orderId } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get order with items and customer details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        profiles(first_name, last_name, phone)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    const customerName = order.profiles 
      ? `${order.profiles.first_name || ''} ${order.profiles.last_name || ''}`.trim() || 'Valued Customer'
      : 'Valued Customer';

    const customerPhone = order.customer_phone || order.profiles?.phone || 'N/A';

    // Generate invoice HTML
    const invoiceHTML = generateInvoiceHTML(order, customerName, customerPhone);

    // For now, send the invoice as a formatted WhatsApp message
    // In the future, this could be enhanced to generate an actual image using a service
    const invoiceMessage = `
━━━━━━━━━━━━━━━━━━━━
🧾 *INVOICE* 
━━━━━━━━━━━━━━━━━━━━

*Shahifa.com*
📱 +8801775777308
🌐 https://shahifa.com

━━━━━━━━━━━━━━━━━━━━
*Customer Details:*
👤 ${customerName}
📱 ${customerPhone}
📍 ${order.shipping_address?.city || 'N/A'}, ${order.shipping_address?.country || 'N/A'}

━━━━━━━━━━━━━━━━━━━━
*Order Details:*
📦 Order #: ${order.id.substring(0, 8).toUpperCase()}
📅 Date: ${new Date(order.created_at).toLocaleDateString()}

━━━━━━━━━━━━━━━━━━━━
*Items:*
${order.order_items.map((item: any) => `
• ${item.product_name}
  Qty: ${item.quantity} × $${item.price}
  Total: $${(item.quantity * item.price).toFixed(2)}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━
*Payment Summary:*
Subtotal: $${order.subtotal.toFixed(2)}
Shipping: $${order.shipping.toFixed(2)}
Tax: $${order.tax.toFixed(2)}

*TOTAL: $${order.total.toFixed(2)}*
━━━━━━━━━━━━━━━━━━━━

💳 Payment: ${order.payment_method || 'N/A'}
📦 Status: ${order.status}

Thank you for shopping with us! 🙏

For support: +8801775777308
━━━━━━━━━━━━━━━━━━━━
    `.trim();

    // Send invoice to customer via WhatsApp
    const { error: whatsappError } = await supabase.functions.invoke('send-whatsapp-message', {
      body: {
        to: customerPhone,
        message: invoiceMessage,
        orderId: orderId
      }
    });

    if (whatsappError) {
      console.error('Error sending invoice:', whatsappError);
      throw whatsappError;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Invoice sent to customer',
      customerPhone: customerPhone 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateInvoiceHTML(order: any, customerName: string, customerPhone: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; }
    .logo { font-size: 32px; font-weight: bold; color: #333; }
    .invoice-details { margin: 30px 0; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th, .items-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    .items-table th { background-color: #f5f5f5; }
    .total { text-align: right; font-size: 20px; font-weight: bold; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Shahifa.com</div>
    <p>+8801775777308 | https://shahifa.com</p>
  </div>
  
  <div class="invoice-details">
    <h2>Invoice</h2>
    <p><strong>Customer:</strong> ${customerName}</p>
    <p><strong>Phone:</strong> ${customerPhone}</p>
    <p><strong>Order ID:</strong> ${order.id}</p>
    <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Item</th>
        <th>Quantity</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.order_items.map((item: any) => `
        <tr>
          <td>${item.product_name}</td>
          <td>${item.quantity}</td>
          <td>$${item.price}</td>
          <td>$${(item.quantity * item.price).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="total">
    <p>Subtotal: $${order.subtotal.toFixed(2)}</p>
    <p>Shipping: $${order.shipping.toFixed(2)}</p>
    <p>Tax: $${order.tax.toFixed(2)}</p>
    <p><strong>TOTAL: $${order.total.toFixed(2)}</strong></p>
  </div>

  <p style="text-align: center; color: #666; margin-top: 40px;">
    Thank you for your business!
  </p>
</body>
</html>
  `;
}