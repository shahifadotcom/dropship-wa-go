import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// WhatsApp Web.js Client Manager
class WhatsAppManager {
  private client: any = null;
  private qrString: string = '';
  private isReady: boolean = false;
  private supabase: any;

  constructor(supabase: any) {
    this.supabase = supabase;
  }

  async initializeClient() {
    try {
      // Import WhatsApp Web.js
      const { Client, LocalAuth } = await import('npm:whatsapp-web.js@1.21.0');
      
      // Create client with local authentication
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: "whatsapp-business-client"
        }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
      });

      // QR Code generation
      this.client.on('qr', async (qr: string) => {
        console.log('QR Code received:', qr);
        this.qrString = qr;
        
        // Store QR code in database
        await this.supabase
          .from('whatsapp_config')
          .upsert({
            qr_code: qr,
            is_connected: false,
            session_data: null
          });
      });

      // Client ready
      this.client.on('ready', async () => {
        console.log('WhatsApp Web.js client is ready!');
        this.isReady = true;
        
        // Update connection status in database
        await this.supabase
          .from('whatsapp_config')
          .upsert({
            qr_code: null,
            is_connected: true,
            session_data: { ready: true, timestamp: new Date().toISOString() }
          });
      });

      // Authentication success
      this.client.on('authenticated', async (session: any) => {
        console.log('WhatsApp authenticated successfully');
        
        await this.supabase
          .from('whatsapp_config')
          .upsert({
            is_connected: true,
            session_data: session
          });
      });

      // Authentication failure
      this.client.on('auth_failure', async (msg: string) => {
        console.error('Authentication failure:', msg);
        
        await this.supabase
          .from('whatsapp_config')
          .upsert({
            is_connected: false,
            qr_code: null,
            session_data: null
          });
      });

      // Disconnected
      this.client.on('disconnected', async (reason: string) => {
        console.log('WhatsApp disconnected:', reason);
        this.isReady = false;
        
        await this.supabase
          .from('whatsapp_config')
          .update({
            is_connected: false,
            qr_code: null
          })
          .neq('id', '00000000-0000-0000-0000-000000000000');
      });

      // Initialize the client
      await this.client.initialize();
      
      return true;
    } catch (error) {
      console.error('Error initializing WhatsApp client:', error);
      return false;
    }
  }

  async sendMessage(phoneNumber: string, message: string) {
    if (!this.isReady || !this.client) {
      throw new Error('WhatsApp client is not ready');
    }

    try {
      // Format phone number for WhatsApp
      let formattedNumber = phoneNumber.replace(/\D/g, '');
      
      // Add country code if not present
      if (!formattedNumber.startsWith('880') && 
          !formattedNumber.startsWith('1') && 
          !formattedNumber.startsWith('61') &&
          !formattedNumber.startsWith('44')) {
        // Default to Bangladesh
        formattedNumber = '880' + formattedNumber;
      }
      
      const chatId = formattedNumber + '@c.us';
      
      // Check if number exists on WhatsApp
      const isRegistered = await this.client.isRegisteredUser(chatId);
      if (!isRegistered) {
        throw new Error('Phone number is not registered on WhatsApp');
      }

      // Send message
      const response = await this.client.sendMessage(chatId, message);
      console.log('Message sent successfully:', response.id._serialized);
      
      return {
        success: true,
        messageId: response.id._serialized,
        timestamp: response.timestamp
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  getQRCode() {
    return this.qrString;
  }

  isClientReady() {
    return this.isReady;
  }

  async disconnect() {
    if (this.client) {
      await this.client.destroy();
      this.client = null;
      this.isReady = false;
      this.qrString = '';
    }
  }
}

// Global WhatsApp manager instance
let whatsappManager: WhatsAppManager | null = null;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, phoneNumber, message } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize WhatsApp manager if not exists
    if (!whatsappManager) {
      whatsappManager = new WhatsAppManager(supabase);
    }

    switch (action) {
      case 'initialize': {
        const success = await whatsappManager.initializeClient();
        
        return new Response(
          JSON.stringify({ 
            success,
            message: success ? 'WhatsApp client initialized' : 'Failed to initialize WhatsApp client'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'get_qr': {
        const qrCode = whatsappManager.getQRCode();
        
        return new Response(
          JSON.stringify({ 
            success: true,
            qrCode: qrCode || null,
            isReady: whatsappManager.isClientReady()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'send_message': {
        if (!phoneNumber || !message) {
          return new Response(
            JSON.stringify({ error: 'Phone number and message are required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const result = await whatsappManager.sendMessage(phoneNumber, message);
        
        // Log the message
        await supabase
          .from('notification_logs')
          .insert({
            phone_number: phoneNumber,
            message: message,
            status: 'sent'
          });

        return new Response(
          JSON.stringify({ 
            success: true,
            ...result
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'status': {
        return new Response(
          JSON.stringify({ 
            success: true,
            isReady: whatsappManager.isClientReady(),
            qrCode: whatsappManager.getQRCode()
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      case 'disconnect': {
        await whatsappManager.disconnect();
        whatsappManager = null;
        
        // Update database
        await supabase
          .from('whatsapp_config')
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        return new Response(
          JSON.stringify({ 
            success: true,
            message: 'WhatsApp client disconnected'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('Error in whatsapp-web-integration function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});