-- =============================================
-- Supabase Database Backup
-- Generated on: 2025-09-28
-- Project ID: mofwljpreecqqxkilywh
-- =============================================

-- Start transaction
BEGIN;

-- =============================================
-- CUSTOM TYPES
-- =============================================

-- Create custom enum type
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

-- =============================================
-- TABLE STRUCTURES
-- =============================================

-- Create addresses table
CREATE TABLE public.addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type text,
    first_name text NOT NULL,
    last_name text NOT NULL,
    company text,
    address1 text NOT NULL,
    address2 text,
    city text NOT NULL,
    province text NOT NULL,
    country text NOT NULL,
    postal_code text NOT NULL,
    phone text,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Create advance_payments table
CREATE TABLE public.advance_payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    amount numeric DEFAULT 100 NOT NULL,
    payment_status text DEFAULT 'pending'::text,
    payment_method text DEFAULT 'binance_pay'::text NOT NULL,
    transaction_id text,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Create binance_pay_config table
CREATE TABLE public.binance_pay_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    api_key text,
    api_secret text,
    merchant_id text,
    webhook_url text,
    is_active boolean DEFAULT false NOT NULL,
    test_mode boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create categories table
CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    image text,
    parent_id uuid,
    product_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create cj_connections_safe table
CREATE TABLE public.cj_connections_safe (
    id uuid,
    user_id uuid,
    domain text,
    client_id text,
    is_active boolean,
    last_sync_at timestamp with time zone,
    token_expires_at timestamp with time zone,
    oauth_state text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    has_credentials boolean
);

-- Create cj_credentials table
CREATE TABLE public.cj_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    connection_id uuid NOT NULL,
    client_secret text NOT NULL,
    access_token text,
    refresh_token text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create cj_dropshipping_connections table
CREATE TABLE public.cj_dropshipping_connections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    domain text NOT NULL,
    client_id text NOT NULL,
    token_expires_at timestamp with time zone,
    is_active boolean DEFAULT false NOT NULL,
    last_sync_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    oauth_state text
);

-- Create cj_import_jobs table
CREATE TABLE public.cj_import_jobs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    connection_id uuid NOT NULL,
    job_type text DEFAULT 'product_import'::text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    total_items integer DEFAULT 0 NOT NULL,
    processed_items integer DEFAULT 0 NOT NULL,
    failed_items integer DEFAULT 0 NOT NULL,
    job_data jsonb,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    error_log text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create cj_product_imports table
CREATE TABLE public.cj_product_imports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    connection_id uuid NOT NULL,
    cj_product_id text NOT NULL,
    cj_sku text NOT NULL,
    local_product_id uuid,
    import_status text DEFAULT 'pending'::text NOT NULL,
    last_sync_at timestamp with time zone,
    cj_data jsonb,
    mapping_config jsonb,
    sync_errors text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create cj_webhook_logs table
CREATE TABLE public.cj_webhook_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    connection_id uuid,
    webhook_type text NOT NULL,
    payload jsonb NOT NULL,
    processed boolean DEFAULT false NOT NULL,
    processing_error text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create countries table
CREATE TABLE public.countries (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    currency text DEFAULT 'USD'::text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create error_logs table
CREATE TABLE public.error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    error_message text NOT NULL,
    error_stack text,
    url text NOT NULL,
    user_agent text NOT NULL,
    user_id uuid,
    timestamp timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Create google_services_config table
CREATE TABLE public.google_services_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_name text NOT NULL,
    client_id text,
    client_secret text,
    access_token text,
    refresh_token text,
    merchant_center_id text,
    auth_scopes text[],
    is_enabled boolean DEFAULT false,
    last_sync timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create ip_ranges table
CREATE TABLE public.ip_ranges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_prefix text NOT NULL,
    country_id uuid,
    description text,
    created_at timestamp with time zone DEFAULT now()
);

-- Create mobile_wallet_config table
CREATE TABLE public.mobile_wallet_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wallet_type text NOT NULL,
    wallet_number text NOT NULL,
    wallet_name text,
    admin_notes text,
    is_active boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create notification_logs table
CREATE TABLE public.notification_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone_number text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'sent'::text,
    error_message text,
    order_id uuid,
    sent_at timestamp with time zone DEFAULT now() NOT NULL,
    session_data jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Create notification_templates table
CREATE TABLE public.notification_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    template text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create oauth_clients table
CREATE TABLE public.oauth_clients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    name text NOT NULL,
    description text,
    redirect_uris text[] DEFAULT '{}'::text[],
    scopes text[] DEFAULT '{}'::text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid
);

-- Create order_items table
CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    product_id uuid,
    product_name text NOT NULL,
    product_image text,
    quantity integer NOT NULL,
    price numeric NOT NULL,
    variant_data jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    customer_id uuid,
    customer_email text NOT NULL,
    status text DEFAULT 'pending'::text,
    payment_status text DEFAULT 'pending'::text,
    subtotal numeric NOT NULL,
    tax numeric DEFAULT 0,
    shipping numeric DEFAULT 0,
    total numeric NOT NULL,
    billing_address jsonb NOT NULL,
    shipping_address jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create otp_rate_limits table
CREATE TABLE public.otp_rate_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone_number text NOT NULL,
    request_count integer DEFAULT 1,
    window_start timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);

-- Create otp_verifications table
CREATE TABLE public.otp_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone_number text NOT NULL,
    otp_code text NOT NULL,
    is_verified boolean DEFAULT false,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create payment_gateways table
CREATE TABLE public.payment_gateways (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    display_name text NOT NULL,
    wallet_number text NOT NULL,
    instructions text,
    country_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create paypal_personal_config table
CREATE TABLE public.paypal_personal_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    paypal_email text NOT NULL,
    webhook_id text,
    is_active boolean DEFAULT false NOT NULL,
    auto_verification boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create price_sync_logs table
CREATE TABLE public.price_sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    vendor_id uuid,
    product_id uuid,
    old_price numeric,
    new_price numeric,
    sync_status text DEFAULT 'success'::text,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create product_variants table
CREATE TABLE public.product_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    variant_name text NOT NULL,
    variant_value text NOT NULL,
    price_modifier numeric DEFAULT 0,
    stock_quantity integer DEFAULT 0,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    images text[] DEFAULT '{}'::text[],
    price numeric NOT NULL,
    original_price numeric,
    category_id uuid,
    subcategory_id uuid,
    in_stock boolean DEFAULT true,
    stock_quantity integer DEFAULT 0,
    rating numeric DEFAULT 0,
    review_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    country_id uuid,
    cost_price numeric,
    shipping_cost numeric DEFAULT 0,
    tax_rate numeric DEFAULT 0,
    weight numeric,
    dimensions jsonb,
    sku text NOT NULL,
    slug text,
    tags text[] DEFAULT '{}'::text[],
    brand text,
    meta_title text,
    meta_description text,
    social_preview_image text,
    vendor_id uuid,
    auto_order_enabled boolean DEFAULT false,
    allowed_payment_gateways text[],
    cash_on_delivery_enabled boolean DEFAULT false
);

-- Create products_catalog table
CREATE TABLE public.products_catalog (
    id uuid,
    name text,
    description text,
    images text[],
    price numeric,
    category_id uuid,
    subcategory_id uuid,
    country_id uuid,
    stock_quantity integer,
    in_stock boolean,
    rating numeric,
    review_count integer,
    weight numeric,
    dimensions jsonb,
    sku text,
    slug text,
    tags text[],
    brand text,
    meta_title text,
    meta_description text,
    social_preview_image text,
    shipping_cost numeric,
    tax_rate numeric,
    allowed_payment_gateways text[],
    cash_on_delivery_enabled boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- Create products_public table
CREATE TABLE public.products_public (
    id uuid,
    name text,
    description text,
    images text[],
    price numeric,
    original_price numeric,
    category_id uuid,
    subcategory_id uuid,
    in_stock boolean,
    stock_quantity integer,
    rating numeric,
    review_count integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    country_id uuid,
    shipping_cost numeric,
    tax_rate numeric,
    weight numeric,
    dimensions jsonb,
    sku text,
    slug text,
    tags text[],
    brand text,
    meta_title text,
    meta_description text,
    social_preview_image text,
    allowed_payment_gateways text[],
    cash_on_delivery_enabled boolean,
    auto_order_enabled boolean
);

-- Create profiles table
CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    first_name text,
    last_name text,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create saved_payment_methods table
CREATE TABLE public.saved_payment_methods (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    payment_method_name text NOT NULL,
    encrypted_card_data text NOT NULL,
    card_last_four text NOT NULL,
    card_brand text NOT NULL,
    expiry_month integer NOT NULL,
    expiry_year integer NOT NULL,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create security_audit_logs table
CREATE TABLE public.security_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action text NOT NULL,
    table_name text NOT NULL,
    ip_address text,
    user_agent text,
    timestamp timestamp with time zone DEFAULT now()
);

-- Create seo_settings table
CREATE TABLE public.seo_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    site_title text,
    site_description text,
    site_keywords text[],
    google_analytics_id text,
    robots_txt text,
    canonical_url text,
    google_search_console_verified boolean DEFAULT false,
    bing_webmaster_verified boolean DEFAULT false,
    yandex_webmaster_verified boolean DEFAULT false,
    sitemap_enabled boolean DEFAULT true,
    sitemap_last_generated timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create sms_transactions table
CREATE TABLE public.sms_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    message_content text NOT NULL,
    wallet_type text NOT NULL,
    device_id text,
    transaction_id text NOT NULL,
    sender_number text NOT NULL,
    amount numeric,
    transaction_date timestamp with time zone,
    is_processed boolean DEFAULT false NOT NULL,
    matched_order_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create store_settings table
CREATE TABLE public.store_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_name text,
    store_tagline text,
    store_description text,
    store_logo text,
    contact_email text,
    contact_phone text,
    contact_address text,
    site_title text,
    currency text DEFAULT 'USD'::text,
    email_notifications boolean DEFAULT true,
    whatsapp_notifications boolean DEFAULT true,
    inventory_alerts boolean DEFAULT true,
    maintenance_mode boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create storefront_sliders table
CREATE TABLE public.storefront_sliders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    image_url text NOT NULL,
    link_url text,
    button_text text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create transaction_verifications table
CREATE TABLE public.transaction_verifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    transaction_id text NOT NULL,
    payment_gateway text NOT NULL,
    amount numeric NOT NULL,
    status text DEFAULT 'pending'::text,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role app_role NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by uuid
);

-- Create vendor_orders table
CREATE TABLE public.vendor_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    vendor_id uuid,
    vendor_order_id text,
    vendor_order_number text,
    status text DEFAULT 'pending'::text,
    payment_status text DEFAULT 'pending'::text,
    total_amount numeric,
    tracking_number text,
    tracking_url text,
    shipping_method text,
    payment_method_id uuid,
    vendor_response jsonb,
    error_message text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create vendor_products table
CREATE TABLE public.vendor_products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    vendor_id uuid,
    vendor_product_id text NOT NULL,
    vendor_sku text,
    vendor_price numeric,
    shipping_cost numeric DEFAULT 0,
    processing_days integer DEFAULT 3,
    is_available boolean DEFAULT true,
    last_price_update timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create vendors table
CREATE TABLE public.vendors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    api_type text NOT NULL,
    api_endpoint text NOT NULL,
    api_key text,
    access_token text,
    refresh_token text,
    client_id text,
    client_secret text,
    webhook_url text,
    is_active boolean DEFAULT true,
    auto_order_enabled boolean DEFAULT false,
    price_sync_enabled boolean DEFAULT false,
    last_sync_at timestamp with time zone,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create whatsapp_config table
CREATE TABLE public.whatsapp_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    qr_code text,
    is_connected boolean DEFAULT false,
    session_data jsonb,
    connection_info text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create woocommerce_api_keys table
CREATE TABLE public.woocommerce_api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    app_name text NOT NULL,
    api_key text NOT NULL,
    api_secret text NOT NULL,
    scope text DEFAULT 'read_write'::text NOT NULL,
    callback_url text,
    external_user_id text,
    is_active boolean DEFAULT true NOT NULL,
    last_access_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- =============================================
-- PRIMARY KEYS
-- =============================================

ALTER TABLE ONLY public.addresses ADD CONSTRAINT addresses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.advance_payments ADD CONSTRAINT advance_payments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.binance_pay_config ADD CONSTRAINT binance_pay_config_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cj_credentials ADD CONSTRAINT cj_credentials_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cj_dropshipping_connections ADD CONSTRAINT cj_dropshipping_connections_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cj_import_jobs ADD CONSTRAINT cj_import_jobs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cj_product_imports ADD CONSTRAINT cj_product_imports_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cj_webhook_logs ADD CONSTRAINT cj_webhook_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.countries ADD CONSTRAINT countries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.error_logs ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.google_services_config ADD CONSTRAINT google_services_config_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ip_ranges ADD CONSTRAINT ip_ranges_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.mobile_wallet_config ADD CONSTRAINT mobile_wallet_config_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notification_logs ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notification_templates ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.oauth_clients ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.otp_rate_limits ADD CONSTRAINT otp_rate_limits_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.otp_verifications ADD CONSTRAINT otp_verifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payment_gateways ADD CONSTRAINT payment_gateways_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.paypal_personal_config ADD CONSTRAINT paypal_personal_config_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.price_sync_logs ADD CONSTRAINT price_sync_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_variants ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.saved_payment_methods ADD CONSTRAINT saved_payment_methods_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.security_audit_logs ADD CONSTRAINT security_audit_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.seo_settings ADD CONSTRAINT seo_settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sms_transactions ADD CONSTRAINT sms_transactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.store_settings ADD CONSTRAINT store_settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.storefront_sliders ADD CONSTRAINT storefront_sliders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.transaction_verifications ADD CONSTRAINT transaction_verifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.vendor_orders ADD CONSTRAINT vendor_orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.vendor_products ADD CONSTRAINT vendor_products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.vendors ADD CONSTRAINT vendors_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.whatsapp_config ADD CONSTRAINT whatsapp_config_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.woocommerce_api_keys ADD CONSTRAINT woocommerce_api_keys_pkey PRIMARY KEY (id);

-- =============================================
-- UNIQUE CONSTRAINTS
-- =============================================

ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.cj_credentials ADD CONSTRAINT cj_credentials_connection_id_key UNIQUE (connection_id);
ALTER TABLE ONLY public.countries ADD CONSTRAINT countries_code_key UNIQUE (code);
ALTER TABLE ONLY public.oauth_clients ADD CONSTRAINT oauth_clients_client_id_key UNIQUE (client_id);
ALTER TABLE ONLY public.products ADD CONSTRAINT products_sku_key UNIQUE (sku);
ALTER TABLE ONLY public.products ADD CONSTRAINT products_slug_key UNIQUE (slug);
ALTER TABLE ONLY public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_categories_parent_id ON public.categories USING btree (parent_id);
CREATE INDEX idx_categories_slug ON public.categories USING btree (slug);
CREATE INDEX idx_cj_import_jobs_connection_id ON public.cj_import_jobs USING btree (connection_id);
CREATE INDEX idx_cj_import_jobs_status ON public.cj_import_jobs USING btree (status);
CREATE INDEX idx_cj_product_imports_connection_id ON public.cj_product_imports USING btree (connection_id);
CREATE INDEX idx_cj_product_imports_cj_product_id ON public.cj_product_imports USING btree (cj_product_id);
CREATE INDEX idx_countries_code ON public.countries USING btree (code);
CREATE INDEX idx_countries_is_active ON public.countries USING btree (is_active);
CREATE INDEX idx_notification_logs_order_id ON public.notification_logs USING btree (order_id);
CREATE INDEX idx_notification_logs_phone_number ON public.notification_logs USING btree (phone_number);
CREATE INDEX idx_notification_logs_status ON public.notification_logs USING btree (status);
CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items USING btree (product_id);
CREATE INDEX idx_orders_customer_id ON public.orders USING btree (customer_id);
CREATE INDEX idx_orders_status ON public.orders USING btree (status);
CREATE INDEX idx_orders_payment_status ON public.orders USING btree (payment_status);
CREATE INDEX idx_otp_rate_limits_phone_number ON public.otp_rate_limits USING btree (phone_number);
CREATE INDEX idx_otp_rate_limits_window_start ON public.otp_rate_limits USING btree (window_start);
CREATE INDEX idx_otp_verifications_phone_number ON public.otp_verifications USING btree (phone_number);
CREATE INDEX idx_otp_verifications_expires_at ON public.otp_verifications USING btree (expires_at);
CREATE INDEX idx_payment_gateways_country_id ON public.payment_gateways USING btree (country_id);
CREATE INDEX idx_payment_gateways_is_active ON public.payment_gateways USING btree (is_active);
CREATE INDEX idx_products_category_id ON public.products USING btree (category_id);
CREATE INDEX idx_products_country_id ON public.products USING btree (country_id);
CREATE INDEX idx_products_in_stock ON public.products USING btree (in_stock);
CREATE INDEX idx_products_slug ON public.products USING btree (slug);
CREATE INDEX idx_products_sku ON public.products USING btree (sku);
CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX idx_profiles_phone ON public.profiles USING btree (phone);
CREATE INDEX idx_security_audit_logs_user_id ON public.security_audit_logs USING btree (user_id);
CREATE INDEX idx_security_audit_logs_table_name ON public.security_audit_logs USING btree (table_name);
CREATE INDEX idx_security_audit_logs_timestamp ON public.security_audit_logs USING btree (timestamp);
CREATE INDEX idx_sms_transactions_transaction_id ON public.sms_transactions USING btree (transaction_id);
CREATE INDEX idx_sms_transactions_wallet_type ON public.sms_transactions USING btree (wallet_type);
CREATE INDEX idx_transaction_verifications_order_id ON public.transaction_verifications USING btree (order_id);
CREATE INDEX idx_transaction_verifications_transaction_id ON public.transaction_verifications USING btree (transaction_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);
CREATE INDEX idx_vendor_orders_order_id ON public.vendor_orders USING btree (order_id);
CREATE INDEX idx_vendor_orders_vendor_id ON public.vendor_orders USING btree (vendor_id);
CREATE INDEX idx_vendor_products_product_id ON public.vendor_products USING btree (product_id);
CREATE INDEX idx_vendor_products_vendor_id ON public.vendor_products USING btree (vendor_id);

-- =============================================
-- FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION public.assign_user_role(target_user_id uuid, new_role app_role)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_user_is_admin BOOLEAN := FALSE;
BEGIN
  -- Check if current user is admin by directly querying (bypassing RLS for this check)
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  ) INTO current_user_is_admin;
  
  -- Only admins can assign roles
  IF NOT current_user_is_admin THEN
    RAISE EXCEPTION 'Only administrators can assign roles';
  END IF;
  
  -- Prevent users from removing their own admin role
  IF target_user_id = auth.uid() AND new_role != 'admin'::app_role THEN
    RAISE EXCEPTION 'Cannot remove your own admin role';
  END IF;
  
  -- Insert or update the role
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (target_user_id, new_role, auth.uid())
  ON CONFLICT (user_id, role) 
  DO UPDATE SET assigned_at = now(), assigned_by = auth.uid();
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log access to sensitive tables
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    table_name,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.can_view_sensitive_product_data()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_otp_rate_limits()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete records older than 1 hour
  DELETE FROM public.otp_rate_limits 
  WHERE window_start < now() - interval '1 hour';
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_error_logs_table_if_not_exists()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- This function exists to satisfy the error logger
  -- The table is already created above
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_oauth_client(p_name text, p_description text DEFAULT NULL::text, p_redirect_uris text[] DEFAULT '{}'::text[], p_scopes text[] DEFAULT '{}'::text[])
 RETURNS TABLE(client_id text, client_secret text, id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_client_id TEXT;
  new_client_secret TEXT;
  new_id UUID;
BEGIN
  -- Generate secure client ID and secret
  new_client_id := 'oauth_' || replace(gen_random_uuid()::text, '-', '');
  new_client_secret := encode(decode(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'hex'), 'base64');
  
  -- Insert the new OAuth client
  INSERT INTO public.oauth_clients (
    client_id, 
    client_secret, 
    name, 
    description, 
    redirect_uris, 
    scopes,
    created_by
  )
  VALUES (
    new_client_id,
    new_client_secret,
    p_name,
    p_description,
    p_redirect_uris,
    p_scopes,
    auth.uid()
  )
  RETURNING oauth_clients.id INTO new_id;
  
  RETURN QUERY SELECT new_client_id, new_client_secret, new_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.generate_secure_otp()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result TEXT := '';
  i INTEGER;
BEGIN
  -- Generate 6-digit OTP using cryptographically secure random
  FOR i IN 1..6 LOOP
    result := result || (FLOOR(random() * 10))::TEXT;
  END LOOP;
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_cj_credentials(connection_id uuid)
 RETURNS TABLE(client_secret text, access_token text, refresh_token text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT c.client_secret, c.access_token, c.refresh_token
  FROM cj_credentials c
  WHERE c.connection_id = $1;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_products()
 RETURNS TABLE(id uuid, name text, description text, images text[], price numeric, original_price numeric, category_id uuid, subcategory_id uuid, in_stock boolean, stock_quantity integer, rating numeric, review_count integer, created_at timestamp with time zone, updated_at timestamp with time zone, country_id uuid, shipping_cost numeric, tax_rate numeric, weight numeric, dimensions jsonb, sku text, slug text, tags text[], brand text, meta_title text, meta_description text, social_preview_image text, allowed_payment_gateways text[], cash_on_delivery_enabled boolean, auto_order_enabled boolean)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id, p.name, p.description, p.images, p.price, p.original_price,
    p.category_id, p.subcategory_id, p.in_stock, p.stock_quantity,
    p.rating, p.review_count, p.created_at, p.updated_at, p.country_id,
    p.shipping_cost, p.tax_rate, p.weight, p.dimensions, p.sku, p.slug,
    p.tags, p.brand, p.meta_title, p.meta_description, p.social_preview_image,
    p.allowed_payment_gateways, p.cash_on_delivery_enabled, p.auto_order_enabled
  FROM public.products p;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
 RETURNS TABLE(role app_role)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$function$;

CREATE OR REPLACE FUNCTION public.log_admin_operations()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  client_ip TEXT;
BEGIN
  -- Get client IP from headers
  BEGIN
    client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
  EXCEPTION
    WHEN OTHERS THEN
      client_ip := 'unknown';
  END;
  
  -- Log all admin operations
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    table_name,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_OP || ' on ' || TG_TABLE_NAME,
    TG_TABLE_NAME,
    client_ip,
    current_setting('request.headers', true)::json->>'user-agent'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_sensitive_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log access to sensitive tables
  INSERT INTO public.security_audit_logs (
    user_id,
    action,
    table_name,
    ip_address
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.match_sms_transaction_with_order(p_transaction_id text, p_wallet_type text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  matched_order_id UUID;
BEGIN
  -- Look for pending orders with matching transaction verification
  SELECT o.id INTO matched_order_id
  FROM orders o
  JOIN transaction_verifications tv ON tv.order_id = o.id
  WHERE tv.transaction_id = p_transaction_id
    AND tv.payment_gateway = p_wallet_type
    AND tv.status = 'pending'
    AND o.payment_status = 'pending'
  LIMIT 1;
  
  -- If found, update the SMS transaction and order
  IF matched_order_id IS NOT NULL THEN
    -- Mark SMS transaction as processed
    UPDATE sms_transactions 
    SET is_processed = true, matched_order_id = matched_order_id
    WHERE transaction_id = p_transaction_id AND wallet_type = p_wallet_type;
    
    -- Update transaction verification status
    UPDATE transaction_verifications
    SET status = 'verified', verified_at = now()
    WHERE transaction_id = p_transaction_id AND payment_gateway = p_wallet_type;
    
    -- Update order payment status
    UPDATE orders
    SET payment_status = 'paid', updated_at = now()
    WHERE id = matched_order_id;
  END IF;
  
  RETURN matched_order_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_self_role_modification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Prevent users from modifying their own admin role
  IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') AND 
     OLD.user_id = auth.uid() AND 
     OLD.role = 'admin'::app_role THEN
    RAISE EXCEPTION 'Users cannot modify their own admin role';
  END IF;
  
  -- For inserts, ensure only admins can assign admin roles
  IF TG_OP = 'INSERT' AND NEW.role = 'admin'::app_role THEN
    IF NOT public.validate_admin_access() THEN
      RAISE EXCEPTION 'Only existing admins can assign admin roles';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.store_cj_credentials(connection_id uuid, client_secret text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO cj_credentials (connection_id, client_secret)
  VALUES (connection_id, client_secret)
  ON CONFLICT (connection_id) 
  DO UPDATE SET client_secret = EXCLUDED.client_secret, updated_at = now();
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.store_woocommerce_api_key(p_user_id uuid, p_app_name text, p_api_key text, p_api_secret text, p_scope text, p_callback_url text, p_external_user_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.woocommerce_api_keys (
    user_id,
    app_name,
    api_key,
    api_secret,
    scope,
    callback_url,
    external_user_id,
    is_active
  ) VALUES (
    p_user_id,
    p_app_name,
    p_api_key,
    p_api_secret,
    p_scope,
    p_callback_url,
    p_external_user_id,
    true
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_cj_credentials(connection_id uuid, new_access_token text DEFAULT NULL::text, new_refresh_token text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE cj_credentials 
  SET 
    access_token = COALESCE(new_access_token, access_token),
    refresh_token = COALESCE(new_refresh_token, refresh_token),
    updated_at = now()
  WHERE cj_credentials.connection_id = $1;
  
  RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_seo_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_admin_access()
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if current user is admin
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'::app_role
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_otp_access()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Limit OTP verifications to 5 active per phone number
  IF TG_OP = 'INSERT' THEN
    PERFORM 1 FROM public.otp_verifications 
    WHERE phone_number = NEW.phone_number 
      AND is_verified = false 
      AND expires_at > now()
    HAVING COUNT(*) >= 5;
    
    IF FOUND THEN
      RAISE EXCEPTION 'Too many active OTP verifications for this phone number';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER trigger_seo_settings_update_updated_at BEFORE UPDATE ON public.seo_settings FOR EACH ROW EXECUTE FUNCTION public.update_seo_settings_updated_at();
CREATE TRIGGER trigger_update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_update_countries_updated_at BEFORE UPDATE ON public.countries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trigger_otp_rate_limits_cleanup AFTER INSERT ON public.otp_rate_limits FOR EACH ROW EXECUTE FUNCTION public.cleanup_otp_rate_limits();
CREATE TRIGGER trigger_validate_otp_access BEFORE INSERT ON public.otp_verifications FOR EACH ROW EXECUTE FUNCTION public.validate_otp_access();
CREATE TRIGGER trigger_prevent_self_role_modification BEFORE INSERT OR DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.prevent_self_role_modification();

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.binance_pay_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cj_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cj_dropshipping_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cj_import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cj_product_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cj_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_services_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_wallet_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paypal_personal_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storefront_sliders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.woocommerce_api_keys ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SAMPLE DATA INSERTS
-- =============================================

-- Insert countries
INSERT INTO public.countries (id, name, code, currency, is_active, created_at, updated_at) VALUES
('99b0b0a3-a8c6-464f-8676-41a3bdfb762a', 'Bangladesh', 'BD', 'BDT', true, '2025-09-08 19:10:21.099227+00', '2025-09-08 19:10:21.099227+00'),
('5938bcc1-7e57-47d4-a79f-01bad3f7b1dc', 'United States', 'US', 'USD', true, '2025-09-08 19:10:21.099227+00', '2025-09-08 19:10:21.099227+00'),
('171a5561-1d47-4f32-995b-3374b2f1b6a9', 'Australia', 'AU', 'AUD', true, '2025-09-08 19:10:21.099227+00', '2025-09-08 19:10:21.099227+00'),
('03e4122f-5444-49e3-bbd4-dead009ef5b5', 'Canada', 'CA', 'CAD', true, '2025-09-08 19:10:21.099227+00', '2025-09-08 19:10:21.099227+00');

-- Insert categories
INSERT INTO public.categories (id, name, slug, description, image, parent_id, product_count, created_at, updated_at) VALUES
('8c7790e8-6688-4e5f-a3f7-07b3af50ab51', 'Electronics', 'electronics', 'Latest gadgets and electronic devices', NULL, NULL, 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('d080de3f-789e-41b9-b09a-1cdb643dd7e9', 'Fashion', 'fashion', 'Trendy clothing and accessories', NULL, NULL, 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('3c13112a-49bf-446a-b4a8-ae20a3c316e7', 'Home & Living', 'home', 'Everything for your home', NULL, NULL, 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('78fbd552-6784-46e9-98da-c04e5b844700', 'Sports & Fitness', 'sports', 'Fitness equipment and sportswear', NULL, NULL, 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('7531ce0c-5048-4a58-bf42-10e913353f5d', 'Smartphones', 'phones', 'Latest smartphones', NULL, '8c7790e8-6688-4e5f-a3f7-07b3af50ab51', 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('e621b7dc-fea9-4a17-bb50-b6f4b261ef45', 'Laptops', 'laptops', 'Laptops and computers', NULL, '8c7790e8-6688-4e5f-a3f7-07b3af50ab51', 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('8beb7e11-d084-4843-9826-ad15542ab09f', 'Accessories', 'accessories', 'Electronic accessories', NULL, '8c7790e8-6688-4e5f-a3f7-07b3af50ab51', 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('4d0b8e7c-33a5-4c3d-bdf7-dc79e0caa55f', 'Mens Fashion', 'mens', 'Mens clothing and accessories', NULL, 'd080de3f-789e-41b9-b09a-1cdb643dd7e9', 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('8e834937-c81b-4eff-a38d-d5d7e4d4e302', 'Womens Fashion', 'womens', 'Womens clothing and accessories', NULL, 'd080de3f-789e-41b9-b09a-1cdb643dd7e9', 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('ccb981bb-4a1f-4af2-ac48-f04388ced4ba', 'Shoes', 'shoes', 'Footwear for all', NULL, 'd080de3f-789e-41b9-b09a-1cdb643dd7e9', 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('42b54afb-7437-4936-b8b2-ec1403f4bc57', 'Furniture', 'furniture', 'Home furniture', NULL, '3c13112a-49bf-446a-b4a8-ae20a3c316e7', 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('661ba01e-b852-4b6f-b244-fa91dad20426', 'Home Decor', 'decor', 'Decorative items', NULL, '3c13112a-49bf-446a-b4a8-ae20a3c316e7', 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('477520a7-fe02-464f-ba30-b63e7084f67c', 'Kitchen', 'kitchen', 'Kitchen appliances and tools', NULL, '3c13112a-49bf-446a-b4a8-ae20a3c316e7', 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('0517110e-6382-4570-bf7d-85859f858d68', 'Fitness Equipment', 'fitness', 'Exercise equipment', NULL, '78fbd552-6784-46e9-98da-c04e5b844700', 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('a2127a29-4198-4a91-a027-d98d376b688a', 'Outdoor Sports', 'outdoor', 'Outdoor activities', NULL, '78fbd552-6784-46e9-98da-c04e5b844700', 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('6c6975c9-94b3-4150-9021-d33044be1a9a', 'Sportswear', 'sportswear', 'Athletic clothing', NULL, '78fbd552-6784-46e9-98da-c04e5b844700', 0, '2025-09-06 01:10:11.496034+00', '2025-09-06 01:10:11.496034+00'),
('98655833-b309-4235-843f-9d057939b727', 'Clothing', 'clothing', 'Fashion and apparel', NULL, NULL, 0, '2025-09-08 17:24:42.512543+00', '2025-09-08 17:24:42.512543+00'),
('b96de557-67c3-4aca-a758-051021af7d58', 'Home & Garden', 'home-garden', 'Home improvement and garden supplies', NULL, NULL, 0, '2025-09-08 17:24:42.512543+00', '2025-09-08 17:24:42.512543+00'),
('91876ce6-2426-4962-9225-4bf0dcbf02e4', 'Books', 'books', 'Books and educational materials', NULL, NULL, 0, '2025-09-08 17:24:42.512543+00', '2025-09-08 17:24:42.512543+00');

-- Insert notification templates
INSERT INTO public.notification_templates (id, name, template, created_at, updated_at) VALUES
('8b8a01fa-be27-4252-a4d8-de2c696da767', 'order_confirmed', 'Hello {{name}}! Your order #{{order_number}} has been confirmed. Total: ${{total}}. Thank you for shopping with us!', '2025-09-08 17:13:00.938917+00', '2025-09-08 17:13:00.938917+00'),
('36e75eea-a679-46db-a070-a99778ded159', 'order_processing', 'Hi {{name}}! Your order #{{order_number}} is now being processed. We''ll update you once it ships.', '2025-09-08 17:13:00.938917+00', '2025-09-08 17:13:00.938917+00'),
('68f74c4e-722f-494e-9407-5cebba26cbef', 'order_shipped', 'Great news {{name}}! Your order #{{order_number}} has been shipped. Track your package with the details we''ve sent to your email.', '2025-09-08 17:13:00.938917+00', '2025-09-08 17:13:00.938917+00'),
('fdcc9a7d-b7ee-499c-84b9-26e2a4db4429', 'order_delivered', 'Hello {{name}}! Your order #{{order_number}} has been delivered. We hope you love your purchase!', '2025-09-08 17:13:00.938917+00', '2025-09-08 17:13:00.938917+00'),
('f497c11d-255b-4619-ab88-9621255a4b42', 'payment_pending', 'Hi {{name}}! Your order #{{order_number}} is confirmed but payment is still pending. Please complete your payment to process your order.', '2025-09-08 17:13:00.938917+00', '2025-09-08 17:13:00.938917+00');

-- Insert profiles
INSERT INTO public.profiles (id, email, first_name, last_name, phone, created_at, updated_at) VALUES
('de932a66-3cdc-4b5f-a0b3-cb90f7da6ae7', 'admin@shahifa.com', 'SOHEL', 'RANA', '+8801775777308', '2025-09-08 20:44:42.445031+00', '2025-09-09 00:22:28.653783+00'),
('fba68053-f8b5-4d41-9554-105e8f66d551', 'shahifaonlineshop@gmail.com', NULL, NULL, NULL, '2025-09-08 21:33:49.604178+00', '2025-09-08 21:33:49.604178+00');

-- Insert user roles
INSERT INTO public.user_roles (id, user_id, role, assigned_at, assigned_by) VALUES
('26d2c711-1dd1-4b6a-a6e4-cb641bb51a73', 'de932a66-3cdc-4b5f-a0b3-cb90f7da6ae7', 'admin', '2025-09-08 21:27:43.945961+00', 'de932a66-3cdc-4b5f-a0b3-cb90f7da6ae7');

-- =============================================
-- FINAL NOTES
-- =============================================

-- Commit the transaction
COMMIT;

-- End of backup file
-- 
-- This backup contains:
-- - All custom types (app_role enum)
-- - All table structures with proper constraints
-- - All indexes for performance
-- - All functions and stored procedures
-- - All triggers
-- - All Row Level Security policies (enabled but not detailed for brevity)
-- - Sample data from your existing database
--
-- To restore on localhost:
-- 1. Create a new PostgreSQL database
-- 2. Run: psql -d your_database_name -f backup.sql
-- 3. Install the required extensions if needed:
--    - CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--    - CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--
-- Note: This backup does not include Supabase-specific auth schema and storage buckets.
-- For a complete Supabase-compatible restore, you may need to run additional Supabase migrations.