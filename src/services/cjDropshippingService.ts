import { supabase } from '@/integrations/supabase/client';

export interface CJDropshippingConnection {
  id: string;
  user_id: string;
  domain: string;
  client_id: string;
  client_secret?: string; // Optional since it's stored separately for security
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: string;
  is_active: boolean;
  last_sync_at?: string;
  oauth_state?: string;
  created_at: string;
  updated_at: string;
  has_credentials?: boolean; // Indicates if credentials exist in secure storage
}

export interface CJProduct {
  id: string;
  productName: string;
  productSku: string;
  sellPrice: number;
  originalPrice: number;
  productWeight: number;
  productUrl: string;
  productMainPicture: string;
  productPictures: string[];
  productDescription: string;
  categoryName: string;
  brandName: string;
  variants: CJProductVariant[];
}

export interface CJProductVariant {
  vid: string;
  variantName: string;
  variantKey: string;
  variantValue: string;
  variantPrice: number;
  variantInventory: number;
  variantSku: string;
}

export interface CJImportJob {
  id: string;
  connection_id: string;
  job_type: string;
  status: string;
  total_items: number;
  processed_items: number;
  failed_items: number;
  job_data?: any;
  error_log?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

class CJDropshippingService {
  // Connection Management
  async createConnection(connectionData: {
    email: string;
    apiKey: string;
  }): Promise<CJDropshippingConnection | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Get access token from CJ Dropshipping
      const { data: authData, error: authError } = await supabase.functions.invoke('cj-get-access-token', {
        body: {
          email: connectionData.email,
          apiKey: connectionData.apiKey,
        }
      });

      if (authError || !authData?.accessToken) {
        console.error('Failed to get CJ access token:', authError);
        return null;
      }

      // Insert connection with tokens
      const { data: connection, error: connectionError } = await supabase
        .from('cj_dropshipping_connections')
        .insert({
          user_id: user.id,
          domain: connectionData.email, // Store email in domain field
          client_id: connectionData.apiKey, // Store API key in client_id field
          is_active: true,
          token_expires_at: authData.accessTokenExpiryDate,
        })
        .select()
        .single();

      if (connectionError) {
        console.error('Connection creation error:', connectionError);
        return null;
      }

      // Store API key securely
      await supabase.rpc('store_cj_credentials', {
        connection_id: connection.id,
        client_secret: connectionData.apiKey,
      });

      // Update with tokens
      await supabase.rpc('update_cj_credentials', {
        connection_id: connection.id,
        new_access_token: authData.accessToken,
        new_refresh_token: authData.refreshToken,
      });

      return connection;
    } catch (error) {
      console.error('Error creating CJ connection:', error);
      return null;
    }
  }

  async getConnections(): Promise<CJDropshippingConnection[]> {
    try {
      // Use the safe view that excludes sensitive credentials
      const { data, error } = await supabase
        .from('cj_connections_safe')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching connections:', error);
      return [];
    }
  }

  async updateConnection(
    id: string, 
    updates: Partial<CJDropshippingConnection>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cj_dropshipping_connections')
        .update(updates)
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error updating connection:', error);
      return false;
    }
  }

  async deleteConnection(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('cj_dropshipping_connections')
        .delete()
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error deleting connection:', error);
      return false;
    }
  }

  // Token refresh (CJ uses email + API Key, not OAuth)
  async refreshAccessToken(connectionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('cj-refresh-token', {
        body: { connectionId }
      });

      if (error) throw error;
      return data?.success || false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }

  // Product Search and Browse
  async searchProducts(
    connectionId: string,
    filters: {
      keyword?: string;
      categoryId?: string;
      minPrice?: number;
      maxPrice?: number;
      page?: number;
      pageSize?: number;
    }
  ): Promise<{ products: CJProduct[]; total: number } | null> {
    try {
      const { data, error } = await supabase.functions.invoke('cj-search-products', {
        body: { connectionId, filters }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching products:', error);
      return null;
    }
  }

  async getProductDetails(
    connectionId: string, 
    productId: string
  ): Promise<CJProduct | null> {
    try {
      const { data, error } = await supabase.functions.invoke('cj-get-product', {
        body: { connectionId, productId }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting product details:', error);
      return null;
    }
  }

  // Product Import
  async importProducts(
    connectionId: string,
    productIds: string[],
    importConfig?: {
      priceMultiplier?: number;
      categoryMapping?: Record<string, string>;
      autoPublish?: boolean;
    }
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('cj-import-products', {
        body: { connectionId, productIds, importConfig }
      });

      if (error) throw error;
      return data.jobId;
    } catch (error) {
      console.error('Error importing products:', error);
      return null;
    }
  }

  async getImportJobs(connectionId?: string): Promise<CJImportJob[]> {
    try {
      let query = supabase
        .from('cj_import_jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (connectionId) {
        query = query.eq('connection_id', connectionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching import jobs:', error);
      return [];
    }
  }

  async getImportJobStatus(jobId: string): Promise<CJImportJob | null> {
    try {
      const { data, error } = await supabase
        .from('cj_import_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting job status:', error);
      return null;
    }
  }

  // Product Sync
  async syncProductInventory(connectionId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('cj-sync-inventory', {
        body: { connectionId }
      });

      if (error) throw error;
      return data.jobId;
    } catch (error) {
      console.error('Error syncing inventory:', error);
      return null;
    }
  }

  async syncProductPrices(connectionId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke('cj-sync-prices', {
        body: { connectionId }
      });

      if (error) throw error;
      return data.jobId;
    } catch (error) {
      console.error('Error syncing prices:', error);
      return null;
    }
  }

  // Real-time notifications
  subscribeToJobUpdates(
    jobId: string,
    callback: (job: CJImportJob) => void
  ): () => void {
    const channel = supabase
      .channel(`job-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cj_import_jobs',
          filter: `id=eq.${jobId}`,
        },
        (payload) => callback(payload.new as CJImportJob)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export const cjDropshippingService = new CJDropshippingService();