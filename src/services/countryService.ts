import { supabase } from '@/integrations/supabase/client';

export interface Country {
  id: string;
  name: string;
  code: string;
  currency: string;
  is_active: boolean;
}

export interface IPRange {
  id: string;
  country_id: string;
  ip_prefix: string;
  description: string;
  country?: Country;
}

export class CountryService {
  
  // Get visitor's IP address
  static async getVisitorIP(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Failed to get visitor IP:', error);
      return null;
    }
  }

  // Detect country by IP prefix matching
  static async detectCountryByIP(ip?: string): Promise<Country | null> {
    try {
      const visitorIP = ip || await this.getVisitorIP();
      if (!visitorIP) return null;

      // Extract first 3-4 digits of IP for matching
      const ipParts = visitorIP.split('.');
      const prefixOptions = [
        `${ipParts[0]}.${ipParts[1]}`,      // Match first 2 octets
        `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`, // Match first 3 octets
        ipParts[0] // Match first octet only as fallback
      ];

      // Query IP ranges for matching prefixes
      const { data: ipRanges, error } = await supabase
        .from('ip_ranges')
        .select(`
          *,
          country:countries(*)
        `)
        .in('ip_prefix', prefixOptions);

      if (error) throw error;

      // Return the first matching country (prioritize more specific matches)
      const matchedRange = ipRanges?.find(range => 
        prefixOptions.includes(range.ip_prefix)
      );

      return matchedRange?.country || null;
    } catch (error) {
      console.error('Error detecting country by IP:', error);
      return null;
    }
  }

  // Get all active countries
  static async getAllCountries(): Promise<Country[]> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching countries:', error);
      return [];
    }
  }

  // Get country by code
  static async getCountryByCode(code: string): Promise<Country | null> {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching country by code:', error);
      return null;
    }
  }

  // Get products by country
  static async getProductsByCountry(countryId?: string) {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('in_stock', true);

      if (countryId) {
        query = query.eq('country_id', countryId);
      } else {
        // If no country specified, show products without country restriction
        query = query.is('country_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database fields to Product interface
      const mappedProducts = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        originalPrice: item.original_price ? Number(item.original_price) : undefined,
        images: item.images || [],
        category: '',
        subcategory: '',
        brand: item.brand || '',
        inStock: item.in_stock,
        stockQuantity: item.stock_quantity || 0,
        sku: item.sku,
        tags: item.tags || [],
        variants: [],
        rating: Number(item.rating) || 0,
        reviewCount: item.review_count || 0,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }));
      
      return mappedProducts;
    } catch (error) {
      console.error('Error fetching products by country:', error);
      return [];
    }
  }

  // Get IP ranges for a country
  static async getIPRangesForCountry(countryId: string): Promise<IPRange[]> {
    try {
      const { data, error } = await supabase
        .from('ip_ranges')
        .select('*')
        .eq('country_id', countryId)
        .order('ip_prefix');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching IP ranges:', error);
      return [];
    }
  }

  // Add IP range (admin function)
  static async addIPRange(countryId: string, ipPrefix: string, description?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ip_ranges')
        .insert({
          country_id: countryId,
          ip_prefix: ipPrefix.trim(),
          description: description || `IP range ${ipPrefix}`
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding IP range:', error);
      return false;
    }
  }

  // Remove IP range (admin function)
  static async removeIPRange(ipRangeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ip_ranges')
        .delete()
        .eq('id', ipRangeId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing IP range:', error);
      return false;
    }
  }

  // Get default country (Bangladesh as primary market)
  static async getDefaultCountry(): Promise<Country | null> {
    return await this.getCountryByCode('BD');
  }
}