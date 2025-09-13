export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address1: string
          address2: string | null
          city: string
          company: string | null
          country: string
          created_at: string | null
          first_name: string
          id: string
          is_default: boolean | null
          last_name: string
          phone: string | null
          postal_code: string
          province: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          address1: string
          address2?: string | null
          city: string
          company?: string | null
          country: string
          created_at?: string | null
          first_name: string
          id?: string
          is_default?: boolean | null
          last_name: string
          phone?: string | null
          postal_code: string
          province: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          address1?: string
          address2?: string | null
          city?: string
          company?: string | null
          country?: string
          created_at?: string | null
          first_name?: string
          id?: string
          is_default?: boolean | null
          last_name?: string
          phone?: string | null
          postal_code?: string
          province?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      advance_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          order_id: string | null
          payment_method: string
          payment_status: string | null
          transaction_id: string | null
          verified_at: string | null
        }
        Insert: {
          amount?: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string
          payment_status?: string | null
          transaction_id?: string | null
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string
          payment_status?: string | null
          transaction_id?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advance_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image: string | null
          name: string
          parent_id: string | null
          product_count: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          name: string
          parent_id?: string | null
          product_count?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image?: string | null
          name?: string
          parent_id?: string | null
          product_count?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cj_dropshipping_connections: {
        Row: {
          access_token: string | null
          client_id: string
          client_secret: string
          created_at: string
          domain: string
          id: string
          is_active: boolean
          last_sync_at: string | null
          oauth_state: string | null
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          client_id: string
          client_secret: string
          created_at?: string
          domain: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          oauth_state?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          client_id?: string
          client_secret?: string
          created_at?: string
          domain?: string
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          oauth_state?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cj_import_jobs: {
        Row: {
          completed_at: string | null
          connection_id: string
          created_at: string
          error_log: string | null
          failed_items: number
          id: string
          job_data: Json | null
          job_type: string
          processed_items: number
          started_at: string | null
          status: string
          total_items: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          connection_id: string
          created_at?: string
          error_log?: string | null
          failed_items?: number
          id?: string
          job_data?: Json | null
          job_type?: string
          processed_items?: number
          started_at?: string | null
          status?: string
          total_items?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          connection_id?: string
          created_at?: string
          error_log?: string | null
          failed_items?: number
          id?: string
          job_data?: Json | null
          job_type?: string
          processed_items?: number
          started_at?: string | null
          status?: string
          total_items?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cj_import_jobs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "cj_dropshipping_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      cj_product_imports: {
        Row: {
          cj_data: Json | null
          cj_product_id: string
          cj_sku: string
          connection_id: string
          created_at: string
          id: string
          import_status: string
          last_sync_at: string | null
          local_product_id: string | null
          mapping_config: Json | null
          sync_errors: string | null
          updated_at: string
        }
        Insert: {
          cj_data?: Json | null
          cj_product_id: string
          cj_sku: string
          connection_id: string
          created_at?: string
          id?: string
          import_status?: string
          last_sync_at?: string | null
          local_product_id?: string | null
          mapping_config?: Json | null
          sync_errors?: string | null
          updated_at?: string
        }
        Update: {
          cj_data?: Json | null
          cj_product_id?: string
          cj_sku?: string
          connection_id?: string
          created_at?: string
          id?: string
          import_status?: string
          last_sync_at?: string | null
          local_product_id?: string | null
          mapping_config?: Json | null
          sync_errors?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cj_product_imports_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "cj_dropshipping_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cj_product_imports_local_product_id_fkey"
            columns: ["local_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cj_product_imports_local_product_id_fkey"
            columns: ["local_product_id"]
            isOneToOne: false
            referencedRelation: "products_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cj_product_imports_local_product_id_fkey"
            columns: ["local_product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      cj_webhook_logs: {
        Row: {
          connection_id: string | null
          created_at: string
          id: string
          payload: Json
          processed: boolean
          processing_error: string | null
          webhook_type: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          id?: string
          payload: Json
          processed?: boolean
          processing_error?: string | null
          webhook_type: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          id?: string
          payload?: Json
          processed?: boolean
          processing_error?: string | null
          webhook_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cj_webhook_logs_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "cj_dropshipping_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string | null
          currency: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          created_at: string | null
          error_message: string
          error_stack: string | null
          id: string
          timestamp: string
          url: string
          user_agent: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message: string
          error_stack?: string | null
          id?: string
          timestamp: string
          url: string
          user_agent: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string
          error_stack?: string | null
          id?: string
          timestamp?: string
          url?: string
          user_agent?: string
          user_id?: string | null
        }
        Relationships: []
      }
      google_services_config: {
        Row: {
          access_token: string | null
          auth_scopes: string[] | null
          client_id: string | null
          client_secret: string | null
          created_at: string | null
          id: string
          is_enabled: boolean | null
          last_sync: string | null
          merchant_center_id: string | null
          refresh_token: string | null
          service_name: string
          updated_at: string | null
        }
        Insert: {
          access_token?: string | null
          auth_scopes?: string[] | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sync?: string | null
          merchant_center_id?: string | null
          refresh_token?: string | null
          service_name: string
          updated_at?: string | null
        }
        Update: {
          access_token?: string | null
          auth_scopes?: string[] | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          last_sync?: string | null
          merchant_center_id?: string | null
          refresh_token?: string | null
          service_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ip_ranges: {
        Row: {
          country_id: string | null
          created_at: string | null
          description: string | null
          id: string
          ip_prefix: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_prefix: string
        }
        Update: {
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_prefix?: string
        }
        Relationships: [
          {
            foreignKeyName: "ip_ranges_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          message: string
          order_id: string | null
          phone_number: string
          sent_at: string
          session_data: Json | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          order_id?: string | null
          phone_number: string
          sent_at?: string
          session_data?: Json | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          order_id?: string | null
          phone_number?: string
          sent_at?: string
          session_data?: Json | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          template: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          template: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          template?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          price: number
          product_id: string | null
          product_image: string | null
          product_name: string
          quantity: number
          variant_data: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          price: number
          product_id?: string | null
          product_image?: string | null
          product_name: string
          quantity: number
          variant_data?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          price?: number
          product_id?: string | null
          product_image?: string | null
          product_name?: string
          quantity?: number
          variant_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json
          created_at: string | null
          customer_email: string
          customer_id: string | null
          id: string
          order_number: string
          payment_status: string | null
          shipping: number | null
          shipping_address: Json
          status: string | null
          subtotal: number
          tax: number | null
          total: number
          updated_at: string | null
        }
        Insert: {
          billing_address: Json
          created_at?: string | null
          customer_email: string
          customer_id?: string | null
          id?: string
          order_number: string
          payment_status?: string | null
          shipping?: number | null
          shipping_address: Json
          status?: string | null
          subtotal: number
          tax?: number | null
          total: number
          updated_at?: string | null
        }
        Update: {
          billing_address?: Json
          created_at?: string | null
          customer_email?: string
          customer_id?: string | null
          id?: string
          order_number?: string
          payment_status?: string | null
          shipping?: number | null
          shipping_address?: Json
          status?: string | null
          subtotal?: number
          tax?: number | null
          total?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_verified: boolean | null
          otp_code: string
          phone_number: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_verified?: boolean | null
          otp_code: string
          phone_number: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_verified?: boolean | null
          otp_code?: string
          phone_number?: string
        }
        Relationships: []
      }
      payment_gateways: {
        Row: {
          country_id: string | null
          created_at: string | null
          display_name: string
          id: string
          instructions: string | null
          is_active: boolean | null
          name: string
          updated_at: string | null
          wallet_number: string
        }
        Insert: {
          country_id?: string | null
          created_at?: string | null
          display_name: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          wallet_number: string
        }
        Update: {
          country_id?: string | null
          created_at?: string | null
          display_name?: string
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          wallet_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_gateways_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      price_sync_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          new_price: number | null
          old_price: number | null
          product_id: string | null
          sync_status: string | null
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          new_price?: number | null
          old_price?: number | null
          product_id?: string | null
          sync_status?: string | null
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          new_price?: number | null
          old_price?: number | null
          product_id?: string | null
          sync_status?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_sync_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_sync_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_sync_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_sync_logs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string | null
          id: string
          name: string
          price: number | null
          product_id: string | null
          sku: string
          stock_quantity: number | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          price?: number | null
          product_id?: string | null
          sku: string
          stock_quantity?: number | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          price?: number | null
          product_id?: string | null
          sku?: string
          stock_quantity?: number | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allowed_payment_gateways: string[] | null
          auto_order_enabled: boolean | null
          brand: string | null
          cash_on_delivery_enabled: boolean | null
          category_id: string | null
          cost_price: number | null
          country_id: string | null
          created_at: string | null
          description: string
          dimensions: Json | null
          id: string
          images: string[] | null
          in_stock: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string
          original_price: number | null
          price: number
          rating: number | null
          review_count: number | null
          shipping_cost: number | null
          sku: string
          slug: string | null
          social_preview_image: string | null
          stock_quantity: number | null
          subcategory_id: string | null
          tags: string[] | null
          tax_rate: number | null
          updated_at: string | null
          vendor_id: string | null
          weight: number | null
        }
        Insert: {
          allowed_payment_gateways?: string[] | null
          auto_order_enabled?: boolean | null
          brand?: string | null
          cash_on_delivery_enabled?: boolean | null
          category_id?: string | null
          cost_price?: number | null
          country_id?: string | null
          created_at?: string | null
          description: string
          dimensions?: Json | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          original_price?: number | null
          price: number
          rating?: number | null
          review_count?: number | null
          shipping_cost?: number | null
          sku: string
          slug?: string | null
          social_preview_image?: string | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          tags?: string[] | null
          tax_rate?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          weight?: number | null
        }
        Update: {
          allowed_payment_gateways?: string[] | null
          auto_order_enabled?: boolean | null
          brand?: string | null
          cash_on_delivery_enabled?: boolean | null
          category_id?: string | null
          cost_price?: number | null
          country_id?: string | null
          created_at?: string | null
          description?: string
          dimensions?: Json | null
          id?: string
          images?: string[] | null
          in_stock?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          original_price?: number | null
          price?: number
          rating?: number | null
          review_count?: number | null
          shipping_cost?: number | null
          sku?: string
          slug?: string | null
          social_preview_image?: string | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          tags?: string[] | null
          tax_rate?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_payment_methods: {
        Row: {
          card_brand: string
          card_last_four: string
          created_at: string
          encrypted_card_data: string
          expiry_month: number
          expiry_year: number
          id: string
          is_active: boolean | null
          is_default: boolean | null
          payment_method_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          card_brand: string
          card_last_four: string
          created_at?: string
          encrypted_card_data: string
          expiry_month: number
          expiry_year: number
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          payment_method_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          card_brand?: string
          card_last_four?: string
          created_at?: string
          encrypted_card_data?: string
          expiry_month?: number
          expiry_year?: number
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          payment_method_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action: string
          id: string
          ip_address: string | null
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          id?: string
          ip_address?: string | null
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          id?: string
          ip_address?: string | null
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      seo_settings: {
        Row: {
          bing_webmaster_verified: boolean | null
          canonical_url: string | null
          created_at: string | null
          google_analytics_id: string | null
          google_search_console_verified: boolean | null
          id: string
          robots_txt: string | null
          site_description: string | null
          site_keywords: string[] | null
          site_title: string | null
          sitemap_enabled: boolean | null
          sitemap_last_generated: string | null
          updated_at: string | null
          yandex_webmaster_verified: boolean | null
        }
        Insert: {
          bing_webmaster_verified?: boolean | null
          canonical_url?: string | null
          created_at?: string | null
          google_analytics_id?: string | null
          google_search_console_verified?: boolean | null
          id?: string
          robots_txt?: string | null
          site_description?: string | null
          site_keywords?: string[] | null
          site_title?: string | null
          sitemap_enabled?: boolean | null
          sitemap_last_generated?: string | null
          updated_at?: string | null
          yandex_webmaster_verified?: boolean | null
        }
        Update: {
          bing_webmaster_verified?: boolean | null
          canonical_url?: string | null
          created_at?: string | null
          google_analytics_id?: string | null
          google_search_console_verified?: boolean | null
          id?: string
          robots_txt?: string | null
          site_description?: string | null
          site_keywords?: string[] | null
          site_title?: string | null
          sitemap_enabled?: boolean | null
          sitemap_last_generated?: string | null
          updated_at?: string | null
          yandex_webmaster_verified?: boolean | null
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          currency: string | null
          email_notifications: boolean | null
          id: string
          inventory_alerts: boolean | null
          maintenance_mode: boolean | null
          site_title: string | null
          store_description: string | null
          store_logo: string | null
          store_name: string | null
          store_tagline: string | null
          updated_at: string
          whatsapp_notifications: boolean | null
        }
        Insert: {
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          email_notifications?: boolean | null
          id?: string
          inventory_alerts?: boolean | null
          maintenance_mode?: boolean | null
          site_title?: string | null
          store_description?: string | null
          store_logo?: string | null
          store_name?: string | null
          store_tagline?: string | null
          updated_at?: string
          whatsapp_notifications?: boolean | null
        }
        Update: {
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          currency?: string | null
          email_notifications?: boolean | null
          id?: string
          inventory_alerts?: boolean | null
          maintenance_mode?: boolean | null
          site_title?: string | null
          store_description?: string | null
          store_logo?: string | null
          store_name?: string | null
          store_tagline?: string | null
          updated_at?: string
          whatsapp_notifications?: boolean | null
        }
        Relationships: []
      }
      transaction_verifications: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          order_id: string | null
          payment_gateway: string
          status: string | null
          transaction_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          payment_gateway: string
          status?: string | null
          transaction_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          payment_gateway?: string
          status?: string | null
          transaction_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_verifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_orders: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          order_id: string | null
          payment_method_id: string | null
          payment_status: string | null
          shipping_method: string | null
          status: string | null
          total_amount: number | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          vendor_id: string | null
          vendor_order_id: string | null
          vendor_order_number: string | null
          vendor_response: Json | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          shipping_method?: string | null
          status?: string | null
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          vendor_id?: string | null
          vendor_order_id?: string | null
          vendor_order_number?: string | null
          vendor_response?: Json | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string | null
          payment_method_id?: string | null
          payment_status?: string | null
          shipping_method?: string | null
          status?: string | null
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          vendor_id?: string | null
          vendor_order_id?: string | null
          vendor_order_number?: string | null
          vendor_response?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_orders_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "saved_payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_products: {
        Row: {
          created_at: string
          id: string
          is_available: boolean | null
          last_price_update: string | null
          processing_days: number | null
          product_id: string | null
          shipping_cost: number | null
          updated_at: string
          vendor_id: string | null
          vendor_price: number | null
          vendor_product_id: string
          vendor_sku: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean | null
          last_price_update?: string | null
          processing_days?: number | null
          product_id?: string | null
          shipping_cost?: number | null
          updated_at?: string
          vendor_id?: string | null
          vendor_price?: number | null
          vendor_product_id: string
          vendor_sku?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean | null
          last_price_update?: string | null
          processing_days?: number | null
          product_id?: string | null
          shipping_cost?: number | null
          updated_at?: string
          vendor_id?: string | null
          vendor_price?: number | null
          vendor_product_id?: string
          vendor_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          access_token: string | null
          api_endpoint: string
          api_key: string | null
          api_type: string
          auto_order_enabled: boolean | null
          client_id: string | null
          client_secret: string | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          price_sync_enabled: boolean | null
          refresh_token: string | null
          settings: Json | null
          updated_at: string
          webhook_url: string | null
        }
        Insert: {
          access_token?: string | null
          api_endpoint: string
          api_key?: string | null
          api_type: string
          auto_order_enabled?: boolean | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          price_sync_enabled?: boolean | null
          refresh_token?: string | null
          settings?: Json | null
          updated_at?: string
          webhook_url?: string | null
        }
        Update: {
          access_token?: string | null
          api_endpoint?: string
          api_key?: string | null
          api_type?: string
          auto_order_enabled?: boolean | null
          client_id?: string | null
          client_secret?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          price_sync_enabled?: boolean | null
          refresh_token?: string | null
          settings?: Json | null
          updated_at?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          created_at: string
          id: string
          is_connected: boolean | null
          qr_code: string | null
          session_data: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_connected?: boolean | null
          qr_code?: string | null
          session_data?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_connected?: boolean | null
          qr_code?: string | null
          session_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      products_catalog: {
        Row: {
          allowed_payment_gateways: string[] | null
          brand: string | null
          cash_on_delivery_enabled: boolean | null
          category_id: string | null
          country_id: string | null
          created_at: string | null
          description: string | null
          dimensions: Json | null
          id: string | null
          images: string[] | null
          in_stock: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string | null
          price: number | null
          rating: number | null
          review_count: number | null
          shipping_cost: number | null
          sku: string | null
          slug: string | null
          social_preview_image: string | null
          stock_quantity: number | null
          subcategory_id: string | null
          tags: string[] | null
          tax_rate: number | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          allowed_payment_gateways?: string[] | null
          brand?: string | null
          cash_on_delivery_enabled?: boolean | null
          category_id?: string | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string | null
          price?: number | null
          rating?: number | null
          review_count?: number | null
          shipping_cost?: number | null
          sku?: string | null
          slug?: string | null
          social_preview_image?: string | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          tags?: string[] | null
          tax_rate?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          allowed_payment_gateways?: string[] | null
          brand?: string | null
          cash_on_delivery_enabled?: boolean | null
          category_id?: string | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string | null
          price?: number | null
          rating?: number | null
          review_count?: number | null
          shipping_cost?: number | null
          sku?: string | null
          slug?: string | null
          social_preview_image?: string | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          tags?: string[] | null
          tax_rate?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      products_public: {
        Row: {
          allowed_payment_gateways: string[] | null
          auto_order_enabled: boolean | null
          brand: string | null
          cash_on_delivery_enabled: boolean | null
          category_id: string | null
          country_id: string | null
          created_at: string | null
          description: string | null
          dimensions: Json | null
          id: string | null
          images: string[] | null
          in_stock: boolean | null
          meta_description: string | null
          meta_title: string | null
          name: string | null
          price: number | null
          rating: number | null
          review_count: number | null
          shipping_cost: number | null
          sku: string | null
          slug: string | null
          social_preview_image: string | null
          stock_quantity: number | null
          subcategory_id: string | null
          tags: string[] | null
          tax_rate: number | null
          updated_at: string | null
          vendor_id: string | null
          weight: number | null
        }
        Insert: {
          allowed_payment_gateways?: string[] | null
          auto_order_enabled?: boolean | null
          brand?: string | null
          cash_on_delivery_enabled?: boolean | null
          category_id?: string | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string | null
          price?: number | null
          rating?: number | null
          review_count?: number | null
          shipping_cost?: number | null
          sku?: string | null
          slug?: string | null
          social_preview_image?: string | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          tags?: string[] | null
          tax_rate?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          weight?: number | null
        }
        Update: {
          allowed_payment_gateways?: string[] | null
          auto_order_enabled?: boolean | null
          brand?: string | null
          cash_on_delivery_enabled?: boolean | null
          category_id?: string | null
          country_id?: string | null
          created_at?: string | null
          description?: string | null
          dimensions?: Json | null
          id?: string | null
          images?: string[] | null
          in_stock?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string | null
          price?: number | null
          rating?: number | null
          review_count?: number | null
          shipping_cost?: number | null
          sku?: string | null
          slug?: string | null
          social_preview_image?: string | null
          stock_quantity?: number | null
          subcategory_id?: string | null
          tags?: string[] | null
          tax_rate?: number | null
          updated_at?: string | null
          vendor_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_error_logs_table_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
