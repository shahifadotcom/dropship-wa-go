import { supabase } from '@/integrations/supabase/client';

export interface PaymentGateway {
  id: string;
  name: string;
  display_name: string;
  wallet_number: string;
  country_id: string;
  instructions: string;
  is_active: boolean;
  balance?: number;
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
  
  static isLocalWallet(name?: string) {
    const w = String(name || '').toLowerCase();
    return w === 'bkash' || w === 'nagad' || w === 'rocket' || w === 'cod';
  }

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

      // Check if Binance Pay is enabled
      const { data: binanceConfig } = await supabase
        .from('binance_config')
        .select('is_active')
        .single();
      
      const binanceEnabled = binanceConfig?.is_active || false;

      let filteredGateways: PaymentGateway[] = [];

      if (product.allowed_payment_gateways && product.allowed_payment_gateways.length > 0) {
        // Fetch gateways that match the allowed list for this country OR globally
        const { data: gateways, error: gatewayError } = await supabase
          .from('payment_gateways')
          .select('*')
          .in('name', product.allowed_payment_gateways)
          .or(`country_id.eq.${countryId},country_id.is.null`)
          .eq('is_active', true);

        if (!gatewayError && gateways) {
          filteredGateways = gateways;
        }
        
        // Add Binance Pay if enabled and allowed in product
        if (binanceEnabled && product.allowed_payment_gateways.includes('binance_pay')) {
          const hasBinance = filteredGateways.some(g => g.name === 'binance_pay');
          if (!hasBinance) {
            filteredGateways.push({
              id: 'binance_pay',
              name: 'binance_pay',
              display_name: 'Binance Pay',
              wallet_number: '',
              country_id: countryId,
              instructions: 'Pay securely using Binance Pay',
              is_active: true
            });
          }
        }
      } else {
        // No restrictions, show all gateways for the country
        filteredGateways = await this.getPaymentGateways(countryId);
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

  // Get payment gateways for multiple products (intersection of allowed gateways)
  static async getMultipleProductsPaymentGateways(productIds: string[], countryId: string): Promise<PaymentGateway[]> {
    try {
      if (!productIds || productIds.length === 0) {
        return this.getPaymentGateways(countryId);
      }

      // Get all products' settings
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, allowed_payment_gateways, cash_on_delivery_enabled')
        .in('id', productIds);

      if (productsError) throw productsError;

      // Check if Binance Pay is enabled
      const { data: binanceConfig } = await supabase
        .from('binance_config')
        .select('is_active')
        .single();
      
      const binanceEnabled = binanceConfig?.is_active || false;

      // Find intersection of allowed payment gateways
      let allowedGatewayNames: string[] | null = null;
      let allProductsAllowCOD = true;

      for (const product of products) {
        if (product.allowed_payment_gateways && product.allowed_payment_gateways.length > 0) {
          if (allowedGatewayNames === null) {
            allowedGatewayNames = [...product.allowed_payment_gateways];
          } else {
            // Intersection
            allowedGatewayNames = allowedGatewayNames.filter(name =>
              product.allowed_payment_gateways.includes(name)
            );
          }
        }
        
        if (!product.cash_on_delivery_enabled) {
          allProductsAllowCOD = false;
        }
      }

      let filteredGateways: PaymentGateway[] = [];

      if (allowedGatewayNames && allowedGatewayNames.length > 0) {
        // Fetch gateways that match the allowed list for this country OR globally
        const { data: gateways, error: gatewayError } = await supabase
          .from('payment_gateways')
          .select('*')
          .in('name', allowedGatewayNames)
          .or(`country_id.eq.${countryId},country_id.is.null`)
          .eq('is_active', true);

        if (!gatewayError && gateways) {
          filteredGateways = gateways;
        }
        
        // Add Binance Pay if enabled and allowed in all products
        if (binanceEnabled && allowedGatewayNames.includes('binance_pay')) {
          const hasBinance = filteredGateways.some(g => g.name === 'binance_pay');
          if (!hasBinance) {
            filteredGateways.push({
              id: 'binance_pay',
              name: 'binance_pay',
              display_name: 'Binance Pay',
              wallet_number: '',
              country_id: countryId,
              instructions: 'Pay securely using Binance Pay',
              is_active: true
            });
          }
        }
      } else {
        // No restrictions, show all gateways for the country
        filteredGateways = await this.getPaymentGateways(countryId);
      }

      // Remove COD if any product doesn't allow it
      if (!allProductsAllowCOD) {
        filteredGateways = filteredGateways.filter(gateway => gateway.name !== 'cod');
      }

      return filteredGateways;
    } catch (error) {
      console.error('Error fetching multiple products payment gateways:', error);
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

  // Verify Local Wallet (bKash/Nagad/Rocket/COD) by matching against SMS DB
  static async verifyLocalWalletPayment(
    transactionId: string,
    orderId: string,
    paymentGateway: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('verify-local-wallet-transaction', {
        body: { transactionId, orderId, paymentGateway }
      });
      if (error) throw error;
      return !!data?.success;
    } catch (error) {
      console.error('Error verifying local wallet payment:', error);
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

  // Check if transaction ID has already been used in an order
  static async checkSMSTransaction(transactionId: string): Promise<boolean> {
    try {
      // Only check transaction_verifications table - this is where used transactions are stored
      const { data, error } = await supabase
        .from('transaction_verifications')
        .select('id')
        .eq('transaction_id', transactionId.trim())
        .limit(1);

      if (error) {
        console.error('Error checking transaction verifications:', error);
        return false;
      }

      // Return true only if found in transaction_verifications (already used)
      return Array.isArray(data) && data.length > 0;
    } catch (error) {
      console.error('Error checking SMS transaction:', error);
      return false;
    }
  }

  // Get Bangladesh country ID
  static async getBangladeshCountryId(): Promise<string | null> {
    try {
      const { data: country } = await supabase
        .from('countries')
        .select('id')
        .eq('code', 'BD')
        .maybeSingle();

      return country?.id || null;
    } catch (error) {
      console.error('Error fetching Bangladesh country ID:', error);
      return null;
    }
  }

  // Get Bangladesh payment gateways (default)
  static async getBangladeshPaymentGateways(): Promise<PaymentGateway[]> {
    try {
      const countryId = await this.getBangladeshCountryId();
      if (!countryId) return [];

      return await this.getPaymentGateways(countryId);
    } catch (error) {
      console.error('Error fetching Bangladesh payment gateways:', error);
      return [];
    }
  }
}