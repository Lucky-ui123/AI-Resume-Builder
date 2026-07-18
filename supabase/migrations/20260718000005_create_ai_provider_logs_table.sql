-- Supabase Migration: Create AI Provider Logs Table with Indexes and Request Type
-- Migration ID: 20260718000005_create_ai_provider_logs_table

CREATE TABLE IF NOT EXISTS public.ai_provider_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    request_type TEXT,
    success BOOLEAN NOT NULL,
    latency_ms INTEGER NOT NULL,
    fallback_used BOOLEAN DEFAULT false NOT NULL,
    error_type TEXT,
    -- Optional cost tracking (populate when token usage is available)
    input_tokens INTEGER,
    output_tokens INTEGER,
    estimated_cost DECIMAL(10, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for monitoring and analytics queries
CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_created_at ON public.ai_provider_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_provider ON public.ai_provider_logs (provider);
CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_success ON public.ai_provider_logs (success);
CREATE INDEX IF NOT EXISTS idx_ai_provider_logs_request_type ON public.ai_provider_logs (request_type);

-- Enable Row Level Security
ALTER TABLE public.ai_provider_logs ENABLE ROW LEVEL SECURITY;

-- Enable public read and write capability for simplicity and local development fallback
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ai_provider_logs;
CREATE POLICY "Enable read access for all users" ON public.ai_provider_logs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert and update for all users" ON public.ai_provider_logs;
CREATE POLICY "Enable insert and update for all users" ON public.ai_provider_logs
    FOR ALL USING (true) WITH CHECK (true);
