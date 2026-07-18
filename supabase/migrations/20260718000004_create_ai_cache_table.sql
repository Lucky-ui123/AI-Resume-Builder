-- Supabase Migration: Create AI Response Cache Table
-- Migration ID: 20260718000004_create_ai_cache_table

CREATE TABLE IF NOT EXISTS public.ai_response_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_type TEXT NOT NULL,
    input_hash TEXT NOT NULL,
    response_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique index to prevent duplicate cache entries for a given task and input
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_cache_task_hash ON public.ai_response_cache(task_type, input_hash);

-- Enable Row Level Security
ALTER TABLE public.ai_response_cache ENABLE ROW LEVEL SECURITY;

-- Enable public read and write capability for simplicity and local development fallback
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ai_response_cache;
CREATE POLICY "Enable read access for all users" ON public.ai_response_cache
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert and update for all users" ON public.ai_response_cache;
CREATE POLICY "Enable insert and update for all users" ON public.ai_response_cache
    FOR ALL USING (true) WITH CHECK (true);
