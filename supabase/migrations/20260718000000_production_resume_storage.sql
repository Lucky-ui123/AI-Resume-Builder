-- Supabase Migration: Production Resume Storage Strategy
-- Migration ID: 20260718000000_production_resume_storage

-- 1. Create Indexes for Production Performance
CREATE INDEX IF NOT EXISTS idx_resume_versions_resume_id ON public.resume_versions(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_versions_created_at ON public.resume_versions(created_at);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_updated_at ON public.resumes(updated_at);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);

-- 2. Atomic procedure to save resume version and enforce limits
CREATE OR REPLACE FUNCTION public.save_resume_version_atomic(
    p_resume_id UUID,
    p_name TEXT,
    p_content JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    version_limit INT;
    user_id_val UUID;
    existing_count INT;
BEGIN
    -- Get the owner user_id of the resume (fully qualified table)
    SELECT user_id INTO user_id_val FROM public.resumes WHERE id = p_resume_id;
    
    -- Check if the resume exists and belongs to the authenticated user (RLS verification using auth.uid())
    IF user_id_val IS NULL OR user_id_val != auth.uid() THEN
        RETURN jsonb_build_object('error', 'Unauthorized or resume not found');
    END IF;

    -- Get their version limit from user_subscriptions (fully qualified table)
    SELECT COALESCE(
        CASE user_plan
            WHEN 'premium' THEN 50
            WHEN 'pro' THEN 10
            ELSE 0
        END,
        0
    ) INTO version_limit
    FROM public.user_subscriptions
    WHERE user_id = user_id_val;

    -- If versionLimit is 0 (Free user), prevent save
    IF version_limit <= 0 THEN
        RETURN jsonb_build_object('error', 'Your current subscription plan does not support version history. Please upgrade.');
    END IF;

    -- Count existing versions (fully qualified table)
    SELECT COUNT(*) INTO existing_count FROM public.resume_versions WHERE resume_id = p_resume_id;

    -- If we have >= version_limit versions, delete the oldest one
    IF existing_count >= version_limit THEN
        DELETE FROM public.resume_versions
        WHERE id = (
            SELECT id FROM public.resume_versions
            WHERE resume_id = p_resume_id
            ORDER BY created_at ASC
            LIMIT 1
        );
    END IF;

    -- Insert the new version (fully qualified table)
    INSERT INTO public.resume_versions (resume_id, name, content)
    VALUES (p_resume_id, p_name, p_content);

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 3. Stored procedure to prune excess versions and orphaned versions system-wide
CREATE OR REPLACE FUNCTION public.prune_excess_resume_versions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    deleted_orphans_count INT := 0;
    deleted_excess_count INT := 0;
BEGIN
    -- Delete orphaned versions (fully qualified table)
    WITH deleted_orphans AS (
        DELETE FROM public.resume_versions
        WHERE resume_id NOT IN (SELECT id FROM public.resumes)
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_orphans_count FROM deleted_orphans;

    -- Delete excess versions based on plan limits (fully qualified tables)
    WITH deleted_excess AS (
        DELETE FROM public.resume_versions
        WHERE id IN (
            SELECT rv.id
            FROM (
                SELECT rv.id,
                       row_number() OVER (PARTITION BY rv.resume_id ORDER BY rv.created_at DESC) as rn,
                       COALESCE(
                           CASE sub.user_plan
                               WHEN 'premium' THEN 50
                               WHEN 'pro' THEN 10
                               ELSE 0
                           END,
                           0
                       ) as version_limit
                FROM public.resume_versions rv
                JOIN public.resumes res ON rv.resume_id = res.id
                LEFT JOIN public.user_subscriptions sub ON res.user_id = sub.user_id
            ) rv
            WHERE rv.rn > rv.version_limit
        )
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_excess_count FROM deleted_excess;

    RETURN jsonb_build_object(
        'success', true,
        'orphaned_deleted', deleted_orphans_count,
        'excess_deleted', deleted_excess_count
    );
END;
$$;

-- 4. Secure Execute Permissions for Stored Procedures
-- Save atomic: restrict execution to authenticated users and service roles
REVOKE ALL ON FUNCTION public.save_resume_version_atomic(UUID, TEXT, JSONB) FROM public;
GRANT EXECUTE ON FUNCTION public.save_resume_version_atomic(UUID, TEXT, JSONB) TO authenticated, service_role;

-- Prune excess: restrict execution exclusively to the service role (admin/cron)
REVOKE ALL ON FUNCTION public.prune_excess_resume_versions() FROM public;
GRANT EXECUTE ON FUNCTION public.prune_excess_resume_versions() TO service_role;
