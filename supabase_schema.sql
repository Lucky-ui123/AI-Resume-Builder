-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    user_plan TEXT DEFAULT 'free' NOT NULL CHECK (user_plan IN ('free', 'pro', 'premium')),
    subscription_status TEXT DEFAULT 'active' NOT NULL CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
    ai_usage_count INTEGER DEFAULT 0 NOT NULL,
    export_usage_count INTEGER DEFAULT 0 NOT NULL,
    billing_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    billing_period_end TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '1 month') NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_subscriptions_modtime
    BEFORE UPDATE ON public.user_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only SELECT their own subscription data
CREATE POLICY "Users can view own subscription" 
    ON public.user_subscriptions FOR SELECT 
    USING (auth.uid() = user_id);

-- Explicitly, we don't create INSERT, UPDATE, or DELETE policies for the client.
-- Only the Service Role (admin) bypasses RLS to manage this table.

-- Trigger to auto-create subscription on profile creation
CREATE OR REPLACE FUNCTION handle_new_profile_subscription()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_subscriptions (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_profile_subscription();

-- Create resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    target_role TEXT NOT NULL,
    template_id TEXT NOT NULL DEFAULT 'tpl_classic',
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TRIGGER update_resumes_modtime
    BEFORE UPDATE ON public.resumes
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resumes" 
    ON public.resumes FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resumes" 
    ON public.resumes FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resumes" 
    ON public.resumes FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resumes" 
    ON public.resumes FOR DELETE 
    USING (auth.uid() = user_id);

-- Create resume_versions table
CREATE TABLE IF NOT EXISTS public.resume_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions of their resumes" 
    ON public.resume_versions FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.resumes WHERE resumes.id = resume_versions.resume_id AND resumes.user_id = auth.uid()));

CREATE POLICY "Users can insert versions for their resumes" 
    ON public.resume_versions FOR INSERT 
    WITH CHECK (EXISTS (SELECT 1 FROM public.resumes WHERE resumes.id = resume_versions.resume_id AND resumes.user_id = auth.uid()));

CREATE POLICY "Users can delete versions of their resumes" 
    ON public.resume_versions FOR DELETE 
    USING (EXISTS (SELECT 1 FROM public.resumes WHERE resumes.id = resume_versions.resume_id AND resumes.user_id = auth.uid()));

-- Create ats_reports table
CREATE TABLE IF NOT EXISTS public.ats_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
    report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.ats_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ats reports" ON public.ats_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ats reports" ON public.ats_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ats reports" ON public.ats_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ats reports" ON public.ats_reports FOR DELETE USING (auth.uid() = user_id);

-- Create cover_letters table
CREATE TABLE IF NOT EXISTS public.cover_letters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cover letters" ON public.cover_letters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cover letters" ON public.cover_letters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cover letters" ON public.cover_letters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cover letters" ON public.cover_letters FOR DELETE USING (auth.uid() = user_id);

-- Create linkedin_profiles table
CREATE TABLE IF NOT EXISTS public.linkedin_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.linkedin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own linkedin profiles" ON public.linkedin_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own linkedin profiles" ON public.linkedin_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own linkedin profiles" ON public.linkedin_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own linkedin profiles" ON public.linkedin_profiles FOR DELETE USING (auth.uid() = user_id);

-- NOTE: The single source of truth for the database schema changes is the migrations folder under supabase/migrations/.
-- This file (supabase_schema.sql) is kept only as a legacy static reference and should not be used directly for deployments.
