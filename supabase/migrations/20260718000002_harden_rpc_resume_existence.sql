-- Supabase Migration: Harden RPC Resume Existence Check
-- Migration ID: 20260718000002_harden_rpc_resume_existence

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
    -- Get the owner user_id of the resume
    SELECT user_id INTO user_id_val FROM public.resumes WHERE id = p_resume_id;
    
    -- Check existence
    IF user_id_val IS NULL THEN
        RETURN jsonb_build_object('error', 'Resume not found');
    END IF;
    
    -- Check ownership: standard users must match auth.uid(), service_role (admin client) is allowed to bypass
    IF (auth.role() != 'service_role') AND (user_id_val != auth.uid()) THEN
        RETURN jsonb_build_object('error', 'Unauthorized or resume not found');
    END IF;

    -- Get their version limit from user_subscriptions
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

    -- Count existing versions
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

    -- Insert the new version
    INSERT INTO public.resume_versions (resume_id, name, content)
    VALUES (p_resume_id, p_name, p_content);

    RETURN jsonb_build_object('success', true);
END;
$$;
