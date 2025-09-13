-- Phase 1: CJ Dropshipping Integration Database Schema

-- Table for storing CJ Dropshipping OAuth credentials and connection details
CREATE TABLE public.cj_dropshipping_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  domain TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cj_dropshipping_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for CJ connections
CREATE POLICY "Users can view their own CJ connections" 
ON public.cj_dropshipping_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own CJ connections" 
ON public.cj_dropshipping_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CJ connections" 
ON public.cj_dropshipping_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CJ connections" 
ON public.cj_dropshipping_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Table for tracking CJ Dropshipping product imports
CREATE TABLE public.cj_product_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.cj_dropshipping_connections(id) ON DELETE CASCADE,
  cj_product_id TEXT NOT NULL,
  local_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  cj_sku TEXT NOT NULL,
  import_status TEXT NOT NULL DEFAULT 'pending' CHECK (import_status IN ('pending', 'imported', 'failed', 'updating')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_errors TEXT,
  cj_data JSONB, -- Store original CJ product data
  mapping_config JSONB, -- Store field mappings and customizations
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cj_product_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product imports
CREATE POLICY "Users can access imports through their connections" 
ON public.cj_product_imports 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cj_dropshipping_connections 
    WHERE id = cj_product_imports.connection_id 
    AND user_id = auth.uid()
  )
);

-- Table for storing import batches/jobs
CREATE TABLE public.cj_import_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES public.cj_dropshipping_connections(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL DEFAULT 'product_import' CHECK (job_type IN ('product_import', 'inventory_sync', 'price_sync')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_items INTEGER NOT NULL DEFAULT 0,
  processed_items INTEGER NOT NULL DEFAULT 0,
  failed_items INTEGER NOT NULL DEFAULT 0,
  job_data JSONB, -- Store job configuration and filters
  error_log TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cj_import_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for import jobs
CREATE POLICY "Users can access jobs through their connections" 
ON public.cj_import_jobs 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.cj_dropshipping_connections 
    WHERE id = cj_import_jobs.connection_id 
    AND user_id = auth.uid()
  )
);

-- Table for webhook logs and real-time sync events
CREATE TABLE public.cj_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID REFERENCES public.cj_dropshipping_connections(id) ON DELETE SET NULL,
  webhook_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cj_webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhook logs
CREATE POLICY "Users can access webhook logs through their connections" 
ON public.cj_webhook_logs 
FOR ALL
USING (
  connection_id IS NULL OR
  EXISTS (
    SELECT 1 FROM public.cj_dropshipping_connections 
    WHERE id = cj_webhook_logs.connection_id 
    AND user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_cj_connections_user_id ON public.cj_dropshipping_connections(user_id);
CREATE INDEX idx_cj_connections_domain ON public.cj_dropshipping_connections(domain);
CREATE INDEX idx_cj_product_imports_connection_id ON public.cj_product_imports(connection_id);
CREATE INDEX idx_cj_product_imports_cj_product_id ON public.cj_product_imports(cj_product_id);
CREATE INDEX idx_cj_product_imports_local_product_id ON public.cj_product_imports(local_product_id);
CREATE INDEX idx_cj_import_jobs_connection_id ON public.cj_import_jobs(connection_id);
CREATE INDEX idx_cj_import_jobs_status ON public.cj_import_jobs(status);
CREATE INDEX idx_cj_webhook_logs_connection_id ON public.cj_webhook_logs(connection_id);
CREATE INDEX idx_cj_webhook_logs_processed ON public.cj_webhook_logs(processed);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_cj_connections_updated_at
    BEFORE UPDATE ON public.cj_dropshipping_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cj_product_imports_updated_at
    BEFORE UPDATE ON public.cj_product_imports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cj_import_jobs_updated_at
    BEFORE UPDATE ON public.cj_import_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();