import { createClient, createAdminClient } from './supabase/server';
import { mockSubscription } from './mock-data';
import { Resume, MatchReport, AtsReport, CoverLetter, ResumeSuggestion, AtsSuggestion } from '@/types';
import { SUBSCRIPTION_PLANS, PlanType } from './subscription-config';
import { cookies } from 'next/headers';
import { Telemetry } from './telemetry';

// Helper to check if Supabase is configured
function isSupabaseConfigured() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

// Helper to check if admin/service role key is configured
function isAdminConfigured() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export async function resetUsageIfBillingPeriodExpired(user_id: string, currentEnd: string) {
  const endDate = new Date(currentEnd);
  if (endDate < new Date()) {
    if (!isAdminConfigured()) return false;
    const adminSupabase = await createAdminClient();
    const newEnd = new Date();
    newEnd.setMonth(newEnd.getMonth() + 1);
    
    await adminSupabase.from('user_subscriptions').update({
      ai_usage_count: 0,
      export_usage_count: 0,
      billing_period_start: new Date().toISOString(),
      billing_period_end: newEnd.toISOString()
    }).eq('user_id', user_id);
    return true;
  }
  return false;
}

export async function getUserSubscription() {
  if (!isSupabaseConfigured()) {
    let userName = 'User';
    let userEmail = 'demo@example.com';
    try {
      const cookieStore = await cookies();
      userName = cookieStore.get('mock_user_name')?.value || 'User';
      userEmail = cookieStore.get('mock_user_email')?.value || 'demo@example.com';
    } catch (e) {
      // ignore
    }
    const limits = SUBSCRIPTION_PLANS[mockSubscription.plan];
    return {
      plan: mockSubscription.plan,
      aiUsageCount: mockSubscription.aiUsageCount,
      exportUsageCount: mockSubscription.exportUsageCount,
      limits,
      userEmail,
      userName
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: fetchResult, error: fetchError } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single();

  let data = fetchResult;
  const error = fetchError;

  if (error || !data) {
    // Attempt to create default subscription row if missing using admin client
    if (!isAdminConfigured()) {
      // Service role key not configured — return safe defaults
      return {
        plan: 'free' as PlanType,
        aiUsageCount: 0,
        exportUsageCount: 0,
        limits: SUBSCRIPTION_PLANS['free'],
        userEmail: user?.email || '',
        userName: user?.user_metadata?.full_name || 'User'
      };
    }

    const adminSupabase = await createAdminClient();
    const { data: newData, error: newError } = await adminSupabase
      .from('user_subscriptions')
      .insert({ user_id: user.id })
      .select('*')
      .single();
    
    if (newError || !newData) {
      return {
        plan: 'free' as PlanType,
        aiUsageCount: 0,
        exportUsageCount: 0,
        limits: SUBSCRIPTION_PLANS['free'],
        userEmail: user?.email || '',
        userName: user?.user_metadata?.full_name || 'User'
      };
    }
    data = newData;
  }

  // Check if billing period expired
  const reset = await resetUsageIfBillingPeriodExpired(user.id, data.billing_period_end);
  
  if (reset) {
    // Refresh data
    data.ai_usage_count = 0;
    data.export_usage_count = 0;
  }

  const plan = (data.user_plan as PlanType) || 'free';
  return {
    plan,
    aiUsageCount: data.ai_usage_count || 0,
    exportUsageCount: data.export_usage_count || 0,
    limits: SUBSCRIPTION_PLANS[plan],
    userEmail: user?.email || '',
    userName: user?.user_metadata?.full_name || 'User'
  };
}

export async function checkAndIncrementAiUsage() {
  const sub = await getUserSubscription();
  if (sub.aiUsageCount >= sub.limits.aiActionsPerMonth) {
    throw new Error('AI_LIMIT_REACHED');
  }

  if (!isSupabaseConfigured()) {
    mockSubscription.aiUsageCount += 1;
    return;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  if (!isAdminConfigured()) return; // Skip tracking if admin key not set

  const adminSupabase = await createAdminClient();
  const { data } = await adminSupabase.from('user_subscriptions').select('ai_usage_count').eq('user_id', user.id).single();
  const current = data?.ai_usage_count || 0;
  
  await adminSupabase.from('user_subscriptions').update({ ai_usage_count: current + 1 }).eq('user_id', user.id);
}

export async function checkAndIncrementExportUsage() {
  const sub = await getUserSubscription();
  if (sub.limits.exportsPerMonth !== Infinity && sub.exportUsageCount >= sub.limits.exportsPerMonth) {
    throw new Error('EXPORT_LIMIT_REACHED');
  }

  if (!isSupabaseConfigured()) {
    mockSubscription.exportUsageCount += 1;
    return;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  if (!isAdminConfigured()) return; // Skip tracking if admin key not set

  const adminSupabase = await createAdminClient();
  const { data } = await adminSupabase.from('user_subscriptions').select('export_usage_count').eq('user_id', user.id).single();
  const current = data?.export_usage_count || 0;
  
  await adminSupabase.from('user_subscriptions').update({ export_usage_count: current + 1 }).eq('user_id', user.id);
}

// For mock upgrades
export async function upgradePlanMock(newPlan: PlanType) {
  if (!isSupabaseConfigured()) {
    mockSubscription.plan = newPlan;
    return;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (!isAdminConfigured()) return; // Skip if admin key not set

  const adminSupabase = await createAdminClient();
  await adminSupabase.from('user_subscriptions').update({ user_plan: newPlan }).eq('user_id', user.id);
}

export async function getDashboardStats() {
  if (!isSupabaseConfigured()) {
    return {
      totalResumes: 1,
      latestAtsScore: 85,
      versions: 3,
      coverLetters: 2,
    };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const [resumesResult, versionsResult, atsResult, coverLettersResult] = await Promise.all([
    supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('resume_versions').select('id', { count: 'exact', head: true }),
    supabase.from('ats_reports').select('report_data').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
    supabase.from('cover_letters').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
  ]);

  const latestAtsScore = atsResult.data?.[0]?.report_data?.score || 0;

  return {
    totalResumes: resumesResult.count || 0,
    latestAtsScore,
    versions: versionsResult.count || 0,
    coverLetters: coverLettersResult.count || 0,
  };
}

export async function getResume(id?: string): Promise<Resume | null> {
  if (!id || id === 'new') return null;

  if (!isSupabaseConfigured()) {
    // Client handles localStorage directly, server can just return null
    return null;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from('resumes').select('*').eq('user_id', user.id).eq('id', id).single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    title: data.title,
    targetRole: data.target_role,
    templateId: data.template_id,
    lastModified: data.updated_at,
    ...data.content
  } as Resume;
}

export async function saveResume(resume: Resume): Promise<{ id: string; error: string | null }> {
  const startTime = Date.now();
  const traceId = crypto.randomUUID();

  if (!isSupabaseConfigured()) {
    return { id: resume.id || 'res_123', error: null };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    Telemetry.recordCounter('resume.save', 1, 'failure', { error: 'Unauthorized', traceId });
    return { id: '', error: 'Unauthorized' };
  }

  const isNew = !resume.id || resume.id === 'new' || resume.id.startsWith('ls_');
  if (isNew) {
    const sub = await getUserSubscription();
    const { count } = await supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    if ((count || 0) >= sub.limits.resumes) {
      Telemetry.recordCounter('resume.save', 1, 'warning', { error: 'Resume limit reached', userId: user.id, traceId });
      return { id: '', error: 'Resume limit reached. Please upgrade your plan to create more resumes.' };
    }
  }

  const { id, userId, title, targetRole, templateId, lastModified, ...content } = resume;
  void id;
  void userId;
  void lastModified;

  const dbResume = {
    user_id: user.id,
    title: title || 'Untitled Resume',
    target_role: targetRole || '',
    template_id: templateId || 'classic-ats',
    content: content,
  };

  try {
    if (!isNew) {
      const { data, error } = await supabase.from('resumes').update(dbResume).eq('id', id).select('id').single();
      const duration = Date.now() - startTime;
      if (error) {
        Telemetry.recordLatency('resume.save', duration, 'failure', { error: error.message, userId: user.id, resumeId: id, traceId });
        Telemetry.recordCounter('resume.save', 1, 'failure', { error: error.message, userId: user.id, resumeId: id, traceId });
        return { id: '', error: error.message };
      }
      Telemetry.recordLatency('resume.save', duration, 'success', { userId: user.id, resumeId: data.id, traceId });
      Telemetry.recordCounter('resume.save', 1, 'success', { userId: user.id, resumeId: data.id, traceId });
      return { id: data.id, error: null };
    } else {
      const { data, error } = await supabase.from('resumes').insert(dbResume).select('id').single();
      const duration = Date.now() - startTime;
      if (error) {
        Telemetry.recordLatency('resume.save', duration, 'failure', { error: error.message, userId: user.id, traceId });
        Telemetry.recordCounter('resume.save', 1, 'failure', { error: error.message, userId: user.id, traceId });
        return { id: '', error: error.message };
      }
      Telemetry.recordLatency('resume.save', duration, 'success', { userId: user.id, resumeId: data.id, traceId });
      Telemetry.recordCounter('resume.save', 1, 'success', { userId: user.id, resumeId: data.id, traceId });
      return { id: data.id, error: null };
    }
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const errMsg = err instanceof Error ? err.message : String(err);
    Telemetry.recordLatency('resume.save', duration, 'failure', { error: errMsg, userId: user.id, traceId });
    Telemetry.recordCounter('resume.save', 1, 'failure', { error: errMsg, userId: user.id, traceId });
    return { id: '', error: errMsg };
  }
}

export async function getResumeVersions(resumeId: string) {
  if (!isSupabaseConfigured()) {
    return [
      { id: 'v1', name: 'v1 - Initial Draft', created_at: new Date().toISOString() },
    ];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('resume_versions')
    .select('id, name, created_at')
    .eq('resume_id', resumeId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

export async function saveResumeVersion(resumeId: string, name: string, resumeContent: Resume) {
  const traceId = crypto.randomUUID();
  const startTime = Date.now();

  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const sub = await getUserSubscription();
  const limit = sub.limits.versionLimit;
  const userId = sub.userId || 'unknown';

  if (limit <= 0) {
    console.warn(`[Version History] [Trace: ${traceId}] User ${userId} blocked from saving version for resume ${resumeId}. Plan "${sub.plan}" limit is 0.`);
    Telemetry.recordCounter('resume_version.save', 1, 'warning', { reason: 'Plan limit zero', userId, resumeId, traceId });
    return { error: 'Your current subscription plan does not support version history. Please upgrade your plan.' };
  }

  const supabase = await createClient();

  // Try calling the RPC first
  try {
    console.log(`[Version History] [Trace: ${traceId}] Attempting atomic database RPC save_resume_version_atomic. User ID: ${userId}, Resume ID: ${resumeId}`);
    const { data: rpcData, error: rpcError } = await supabase.rpc('save_resume_version_atomic', {
      p_resume_id: resumeId,
      p_name: name,
      p_content: resumeContent
    });

    const duration = Date.now() - startTime;

    if (!rpcError) {
      const res = rpcData as { error?: string; success?: boolean } | null;
      if (res && res.error) {
        console.warn(`[Version History] [Trace: ${traceId}] RPC save returned application error. User ID: ${userId}, Resume ID: ${resumeId}, Duration: ${duration}ms, Error: ${res.error}`);
        Telemetry.recordLatency('resume_version.save.rpc', duration, 'failure', { error: res.error, userId, resumeId, traceId });
        Telemetry.recordCounter('resume_version.save', 1, 'failure', { error: res.error, userId, resumeId, traceId });
        return { error: res.error };
      }
      console.log(`[Version History] [Trace: ${traceId}] RPC save completed successfully. User ID: ${userId}, Resume ID: ${resumeId}, Duration: ${duration}ms`);
      Telemetry.recordLatency('resume_version.save.rpc', duration, 'success', { userId, resumeId, traceId });
      Telemetry.recordCounter('resume_version.save', 1, 'success', { method: 'rpc', userId, resumeId, traceId });
      return { error: null };
    }

    // Fall back to JS-level if RPC function doesn't exist
    if (rpcError.code === '42883' || rpcError.message.includes('function does not exist')) {
      console.warn(`[Version History] [Trace: ${traceId}] Stored procedure "save_resume_version_atomic" not found in Supabase (code: ${rpcError.code}). Activating client-side JS fallback.`);
      Telemetry.recordCounter('resume_version.save.rpc_fallback', 1, 'warning', { errorCode: rpcError.code, userId, resumeId, traceId });
    } else {
      console.error(`[Version History] [Trace: ${traceId}] RPC save failed with database error. User ID: ${userId}, Resume ID: ${resumeId}, Duration: ${duration}ms, Error: ${rpcError.message}`);
      Telemetry.recordLatency('resume_version.save.rpc', duration, 'failure', { error: rpcError.message, userId, resumeId, traceId });
      Telemetry.recordCounter('resume_version.save', 1, 'failure', { error: rpcError.message, userId, resumeId, traceId });
      return { error: rpcError.message };
    }
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Version History] [Trace: ${traceId}] Exception during database RPC save. User ID: ${userId}, Resume ID: ${resumeId}, Duration: ${duration}ms, Error:`, err);
    Telemetry.recordLatency('resume_version.save.rpc', duration, 'failure', { error: errMsg, userId, resumeId, traceId });
    Telemetry.recordCounter('resume_version.save', 1, 'failure', { error: errMsg, userId, resumeId, traceId });
  }

  // Fallback to JS-level atomic logic (oldest pruning first, then insert)
  console.log(`[Version History] [Trace: ${traceId}] Running JS fallback version save. User ID: ${userId}, Resume ID: ${resumeId}`);
  
  const { data: versions, error: fetchErr } = await supabase
    .from('resume_versions')
    .select('id')
    .eq('resume_id', resumeId)
    .order('created_at', { ascending: true });

  if (fetchErr) {
    const duration = Date.now() - startTime;
    console.error(`[Version History] [Trace: ${traceId}] Fallback fetch existing versions failed. User ID: ${userId}, Resume ID: ${resumeId}, Duration: ${duration}ms, Error: ${fetchErr.message}`);
    Telemetry.recordLatency('resume_version.save.fallback', duration, 'failure', { error: fetchErr.message, userId, resumeId, traceId });
    Telemetry.recordCounter('resume_version.save', 1, 'failure', { error: fetchErr.message, userId, resumeId, traceId });
    return { error: fetchErr.message };
  }

  let deletedCount = 0;
  if (versions && versions.length >= limit) {
    const excessCount = versions.length - limit + 1;
    const idsToDelete = versions.slice(0, excessCount).map(v => v.id);
    console.log(`[Version History] [Trace: ${traceId}] Pruning oldest ${excessCount} version(s). User ID: ${userId}, Resume ID: ${resumeId} (Limit: ${limit})`);
    
    const { data: delData, error: deleteErr } = await supabase
      .from('resume_versions')
      .delete()
      .in('id', idsToDelete)
      .select('id');
      
    if (deleteErr) {
      const duration = Date.now() - startTime;
      console.error(`[Version History] [Trace: ${traceId}] Fallback delete of oldest versions failed. User ID: ${userId}, Resume ID: ${resumeId}, Duration: ${duration}ms, Error: ${deleteErr.message}`);
      Telemetry.recordLatency('resume_version.save.fallback', duration, 'failure', { error: deleteErr.message, userId, resumeId, traceId });
      Telemetry.recordCounter('resume_version.save', 1, 'failure', { error: deleteErr.message, userId, resumeId, traceId });
      return { error: deleteErr.message };
    }
    deletedCount = delData ? delData.length : excessCount;
    Telemetry.recordCounter('resume_version.prune', deletedCount, 'success', { userId, resumeId, traceId });
  }

  const { error } = await supabase.from('resume_versions').insert({
    resume_id: resumeId,
    name,
    content: resumeContent
  });

  const duration = Date.now() - startTime;

  if (error) {
    console.error(`[Version History] [Trace: ${traceId}] Fallback version save failed on insert. User ID: ${userId}, Resume ID: ${resumeId}, Duration: ${duration}ms, Error: ${error.message}`);
    Telemetry.recordLatency('resume_version.save.fallback', duration, 'failure', { error: error.message, userId, resumeId, traceId });
    Telemetry.recordCounter('resume_version.save', 1, 'failure', { error: error.message, userId, resumeId, traceId });
  } else {
    console.log(`[Version History] [Trace: ${traceId}] Fallback version save successfully completed. User ID: ${userId}, Resume ID: ${resumeId}, Duration: ${duration}ms, Pruned: ${deletedCount} row(s)`);
    Telemetry.recordLatency('resume_version.save.fallback', duration, 'success', { userId, resumeId, traceId });
    Telemetry.recordCounter('resume_version.save', 1, 'success', { method: 'fallback', userId, resumeId, traceId });
  }

  return { error: error ? error.message : null };
}

export async function getResumeVersionData(versionId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from('resume_versions').select('content').eq('id', versionId).single();
  
  if (error) return null;
  return data.content;
}

export async function getAllResumes() {
  if (!isSupabaseConfigured()) {
    // Server cannot access localStorage — return empty array.
    // ResumesClient.tsx hydrates from localStorage on the client side.
    return [];
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('resumes')
    .select('id, user_id, title, target_role, template_id, updated_at, content')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error || !data) return [];

  return data.map(d => ({
    id: d.id,
    userId: d.user_id,
    title: d.title,
    targetRole: d.target_role,
    templateId: d.template_id,
    lastModified: d.updated_at,
    ...d.content
  })) as Resume[];
}

export async function deleteResume(id: string) {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('resumes').delete().eq('id', id);
  return { error: error ? error.message : null };
}

export async function renameResume(id: string, newTitle: string) {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('resumes').update({ title: newTitle }).eq('id', id);
  return { error: error ? error.message : null };
}

export async function duplicateResume(id: string) {
  if (!isSupabaseConfigured()) {
    return { newId: `${id}_copy`, error: null };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { newId: null, error: 'Unauthorized' };

  const { data, error } = await supabase.from('resumes').select('*').eq('id', id).single();
  if (error || !data) return { newId: null, error: error?.message || 'Not found' };

  const newResume = {
    ...data,
    id: undefined, // Let Supabase auto-generate
    title: `${data.title} (Copy)`,
  };

  const { data: insertData, error: insertError } = await supabase.from('resumes').insert(newResume).select('id').single();
  
  if (insertError) return { newId: null, error: insertError.message };
  return { newId: insertData.id, error: null };
}

export async function deleteVersion(versionId: string) {
  if (!isSupabaseConfigured()) return { error: null };

  const supabase = await createClient();
  const { error } = await supabase.from('resume_versions').delete().eq('id', versionId);
  return { error: error ? error.message : null };
}

export async function restoreVersion(resumeId: string, versionId: string) {
  if (!isSupabaseConfigured()) return { error: null };

  const supabase = await createClient();
  const { data: versionData, error: versionError } = await supabase.from('resume_versions').select('content').eq('id', versionId).single();
  
  if (versionError || !versionData) return { error: versionError?.message || 'Version not found' };

  const { error: updateError } = await supabase.from('resumes').update({ content: versionData.content }).eq('id', resumeId);
  
  return { error: updateError ? updateError.message : null };
}

// ---------------------------------------------------------------------------
// Match Reports DB Operations
// ---------------------------------------------------------------------------
export async function saveMatchReport(report: MatchReport) {
  if (!isSupabaseConfigured()) return { id: report.id || 'mr_mock_123', error: null };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { id: '', error: 'Unauthorized' };

  const dbReport = {
    resume_id: report.resumeId,
    resume_title: report.resumeTitle,
    job_title: report.jobTitle,
    company_name: report.companyName,
    job_description: report.jobDescription,
    match_score: report.matchScore,
    skills_match: report.skillsMatch,
    keywords: report.keywords,
    experience_match: report.experienceMatch,
    education_match: report.educationMatch,
    strengths: report.strengths,
    weaknesses: report.weaknesses,
    recommendations: report.recommendations,
    user_id: user.id
  };

  const { data, error } = await supabase.from('match_reports').insert(dbReport).select('id').single();
  return { id: data?.id || '', error: error ? error.message : null };
}

export async function getMatchReports(): Promise<MatchReport[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from('match_reports').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  
  return data.map((r: Record<string, unknown>) => {
    const skillsMatch = r.skills_match as { matched?: unknown; missing?: unknown } | null;
    const keywords = r.keywords as { matched?: unknown; missing?: unknown } | null;
    return {
      id: String(r.id || ''),
      resumeId: String(r.resume_id || ''),
      resumeTitle: String(r.resume_title || ''),
      jobTitle: String(r.job_title || ''),
      companyName: String(r.company_name || ''),
      jobDescription: String(r.job_description || ''),
      matchScore: Number(r.match_score || 0),
      skillsMatch: {
        matched: Array.isArray(skillsMatch?.matched) ? (skillsMatch.matched as unknown[]).map(String) : [],
        missing: Array.isArray(skillsMatch?.missing) ? (skillsMatch.missing as unknown[]).map(String) : []
      },
      keywords: {
        matched: Array.isArray(keywords?.matched) ? (keywords.matched as unknown[]).map(String) : [],
        missing: Array.isArray(keywords?.missing) ? (keywords.missing as unknown[]).map(String) : []
      },
      experienceMatch: String(r.experience_match || ''),
      educationMatch: String(r.education_match || ''),
      strengths: Array.isArray(r.strengths) ? r.strengths.map(String) : [],
      weaknesses: Array.isArray(r.weaknesses) ? r.weaknesses.map(String) : [],
      recommendations: Array.isArray(r.recommendations) ? r.recommendations.map(String) : [],
      created_at: String(r.created_at || '')
    };
  });
}

export async function deleteMatchReport(id: string) {
  if (!isSupabaseConfigured()) return { error: null };
  const supabase = await createClient();
  const { error } = await supabase.from('match_reports').delete().eq('id', id);
  return { error: error ? error.message : null };
}

// ---------------------------------------------------------------------------
// ATS Reports DB Operations
// ---------------------------------------------------------------------------
export async function saveAtsReport(report: AtsReport) {
  if (!isSupabaseConfigured()) return { id: report.id || 'ats_mock_123', error: null };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { id: '', error: 'Unauthorized' };

  const dbReport = {
    resume_id: report.resumeId,
    resume_title: report.resumeTitle,
    overall_score: report.overallScore,
    contact_info_score: report.contactInfoScore,
    structure_score: report.structureScore,
    keyword_score: report.keywordScore,
    readability_score: report.readabilityScore,
    formatting_score: report.formattingScore,
    completeness_score: report.completenessScore,
    missing_keywords: report.missingKeywords,
    suggestions: report.suggestions,
    user_id: user.id
  };

  const { data, error } = await supabase.from('ats_reports').insert(dbReport).select('id').single();
  return { id: data?.id || '', error: error ? error.message : null };
}

export async function getAtsReports(): Promise<AtsReport[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from('ats_reports').select('*').order('created_at', { ascending: false });
  if (error || !data) return [];
  
  return data.map((r: Record<string, unknown>) => ({
    id: String(r.id),
    resumeId: String(r.resume_id),
    resumeTitle: String(r.resume_title),
    overallScore: Number(r.overall_score),
    contactInfoScore: Number(r.contact_info_score),
    structureScore: Number(r.structure_score),
    keywordScore: Number(r.keyword_score),
    readabilityScore: Number(r.readability_score),
    formattingScore: Number(r.formatting_score),
    completenessScore: Number(r.completeness_score),
    missingKeywords: Array.isArray(r.missing_keywords) ? r.missing_keywords.map(String) : [],
    suggestions: Array.isArray(r.suggestions)
      ? r.suggestions.map((s: unknown): AtsSuggestion => {
          const item = s as Record<string, unknown> | null;
          return {
            id: String(item?.id || ''),
            priority: String(item?.priority || 'Medium') as 'High' | 'Medium' | 'Low',
            message: String(item?.message || ''),
            section: String(item?.section || '')
          };
        })
      : [],
    created_at: String(r.created_at)
  }));
}

export async function deleteAtsReport(id: string) {
  if (!isSupabaseConfigured()) return { error: null };
  const supabase = await createClient();
  const { error } = await supabase.from('ats_reports').delete().eq('id', id);
  return { error: error ? error.message : null };
}

// ---------------------------------------------------------------------------
// Cover Letters DB Operations
// ---------------------------------------------------------------------------
export async function saveCoverLetter(letter: CoverLetter) {
  if (!isSupabaseConfigured()) return { id: letter.id || 'cl_mock_123', error: null };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { id: '', error: 'Unauthorized' };

  const dbLetter = {
    title: letter.title,
    resume_id: letter.resumeId,
    job_title: letter.jobTitle,
    company_name: letter.companyName,
    job_description: letter.jobDescription,
    hiring_manager: letter.hiringManager,
    tone: letter.tone,
    length: letter.length,
    content: letter.content,
    user_id: user.id
  };

  const isNew = !letter.id || letter.id === 'new';
  let query;
  if (isNew) {
    query = supabase.from('cover_letters').insert(dbLetter).select('id').single();
  } else {
    query = supabase.from('cover_letters').update(dbLetter).eq('id', letter.id).select('id').single();
  }

  const { data, error } = await query;
  return { id: data?.id || '', error: error ? error.message : null };
}

export async function getCoverLetters(): Promise<CoverLetter[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from('cover_letters').select('*').order('updated_at', { ascending: false });
  if (error || !data) return [];
  
  return data.map((l: Record<string, unknown>) => ({
    id: String(l.id || ''),
    title: String(l.title || ''),
    resumeId: String(l.resume_id || ''),
    jobTitle: String(l.job_title || ''),
    companyName: String(l.company_name || ''),
    jobDescription: String(l.job_description || ''),
    hiringManager: l.hiring_manager ? String(l.hiring_manager) : undefined,
    tone: String(l.tone || 'Professional'),
    length: String(l.length || 'Medium'),
    content: String(l.content || ''),
    lastModified: String(l.updated_at || l.created_at || '')
  }));
}

export async function deleteCoverLetter(id: string) {
  if (!isSupabaseConfigured()) return { error: null };
  const supabase = await createClient();
  const { error } = await supabase.from('cover_letters').delete().eq('id', id);
  return { error: error ? error.message : null };
}

export async function renameCoverLetter(id: string, newTitle: string) {
  if (!isSupabaseConfigured()) return { error: null };
  const supabase = await createClient();
  const { error } = await supabase.from('cover_letters').update({ title: newTitle }).eq('id', id);
  return { error: error ? error.message : null };
}

export async function duplicateCoverLetter(id: string) {
  if (!isSupabaseConfigured()) return { newId: `${id}_copy`, error: null };
  const supabase = await createClient();
  const { data, error } = await supabase.from('cover_letters').select('*').eq('id', id).single();
  if (error || !data) return { newId: null, error: error?.message || 'Not found' };

  const newLetter = {
    ...data,
    id: undefined,
    title: `${data.title} (Copy)`,
    created_at: undefined,
    updated_at: undefined
  };

  const { data: insertData, error: insertError } = await supabase.from('cover_letters').insert(newLetter).select('id').single();
  if (insertError) return { newId: null, error: insertError.message };
  return { newId: insertData.id, error: null };
}

// ---------------------------------------------------------------------------
// Resume Suggestions DB Operations
// ---------------------------------------------------------------------------
export async function saveSuggestions(resumeId: string, suggestions: ResumeSuggestion[]) {
  if (!isSupabaseConfigured()) return { error: null };
  const supabase = await createClient();
  const { error } = await supabase.from('resume_suggestions').upsert({
    resume_id: resumeId,
    suggestions: suggestions,
    updated_at: new Date().toISOString()
  });
  return { error: error ? error.message : null };
}

export async function getSuggestions(resumeId: string) {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from('resume_suggestions').select('suggestions').eq('resume_id', resumeId).single();
  if (error || !data) return [];
  return data.suggestions || [];
}
