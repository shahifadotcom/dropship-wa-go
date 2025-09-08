import { supabase } from '@/integrations/supabase/client';

export interface PaymentGateway {
  id: string;
  name: string;
  display_name: string;
  wallet_number: string;
  country_id: string;
  instructions: string;
  is_active: boolean;
}

export interface AdvancePayment {
  id: string;
  order_id: string;
  amount: number;
  payment_status: 'pending' | 'paid' | 'failed';
  payment_method: string;
  transaction_id?: string;
  verified_at?: string;
  created_at: string;
}

export interface TransactionVerification {
  id: string;
  order_id: string;
  payment_gateway: string;
  transaction_id: string;
  amount: number;
  status: 'pending' | 'verified' | 'failed';
  verified_at?: string;
  created_at: string;
}

export class PaymentService {
  
  // Get payment gateways for a country
  static async getPaymentGateways(countryId: string): Promise<PaymentGateway[]> {
    try {
      const { data, error } = await supabase
        .from('payment_gateways')
        .select('*')
        .eq('country_id', countryId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
      return [];
    }
  }

  // Get payment gateways for a specific product
  static async getProductPaymentGateways(productId: string, countryId: string): Promise<PaymentGateway[]> {
    try {
      // First get the product's allowed payment gateways
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('allowed_payment_gateways, cash_on_delivery_enabled')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      // Get all available gateways for the country
      const allGateways = await this.getPaymentGateways(countryId);

      // Filter based on product settings
      let filteredGateways = allGateways;

      if (product.allowed_payment_gateways && product.allowed_payment_gateways.length > 0) {
        filteredGateways = allGateways.filter(gateway => 
          product.allowed_payment_gateways.includes(gateway.name)
        );
      }

      // Add or remove COD based on product setting
      if (!product.cash_on_delivery_enabled) {
        filteredGateways = filteredGateways.filter(gateway => gateway.name !== 'cod');
      }

      return filteredGateways;
    } catch (error) {
      console.error('Error fetching product payment gateways:', error);
      return [];
    }
  }

  // Create advance payment for COD orders
  static async createAdvancePayment(
    orderId: string,
    amount: number = 100,
    paymentMethod: string = 'binance_pay'
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('advance_payments')
        .insert({
          order_id: orderId,
          amount: amount,
          payment_method: paymentMethod,
          payment_status: 'pending'
        })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating advance payment:', error);
      return null;
    }
  }

  // Verify Binance payment
  static async verifyBinancePayment(
    transactionId: string,
    orderId: string,
    amount: number
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('binance-payment-verify', {
        body: { transactionId, orderId, amount }
      });

      if (error) throw error;
      return data.success;
    } catch (error) {
      console.error('Error verifying Binance payment:', error);
      return false;
    }
  }

  // Submit transaction for verification
  static async submitTransaction(
    orderId: string,
    paymentGateway: string,
    transactionId: string,
    amount: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transaction_verifications')
        .insert({
          order_id: orderId,
          payment_gateway: paymentGateway,
          transaction_id: transactionId.trim(),
          amount: amount,
          status: 'pending'
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error submitting transaction:', error);
      return false;
    }
  }

  // Check transaction status
  static async checkTransactionStatus(orderId: string): Promise<TransactionVerification | null> {
    try {
      const { data, error } = await supabase
        .from('transaction_verifications')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as TransactionVerification;
    } catch (error) {
      console.error('Error checking transaction status:', error);
      return null;
    }
  }

  // Get all transactions for admin
  static async getAllTransactions(): Promise<TransactionVerification[]> {
    try {
      const { data, error } = await supabase
        .from('transaction_verifications')
        .select(`
          *,
          orders(order_number, customer_email, total)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TransactionVerification[];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }

  // Verify transaction (admin function)
  static async verifyTransaction(transactionId: string, isVerified: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('transaction_verifications')
        .update({
          status: isVerified ? 'verified' : 'failed',
          verified_at: isVerified ? new Date().toISOString() : null
        })
        .eq('id', transactionId);

      if (error) throw error;

      // If verified, update order payment status
      if (isVerified) {
        const { data: transaction } = await supabase
          .from('transaction_verifications')
          .select('order_id')
          .eq('id', transactionId)
          .single();

        if (transaction) {
          await supabase
            .from('orders')
            .update({ payment_status: 'paid' })
            .eq('id', transaction.order_id);
        }
      }

      return true;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  }

  // Get Bangladesh payment gateways (default)
  static async getBangladeshPaymentGateways(): Promise<PaymentGateway[]> {
    try {
      const { data: country } = await supabase
        .from('countries')
        .select('id')
        .eq('code', 'BD')
        .single();

      if (!country) return [];

      return await this.getPaymentGateways(country.id);
    } catch (error) {
      console.error('Error fetching Bangladesh payment gateways:', error);
      return [];
    }
  }
}