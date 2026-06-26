import { createClient, createAdminClient } from './supabase/server';
import { mockSubscription } from './mock-data';
import { Resume } from '@/types';
import { SUBSCRIPTION_PLANS, PlanType } from './subscription-config';

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
    const limits = SUBSCRIPTION_PLANS[mockSubscription.plan];
    return {
      plan: mockSubscription.plan,
      aiUsageCount: mockSubscription.aiUsageCount,
      exportUsageCount: mockSubscription.exportUsageCount,
      limits,
      userEmail: 'demo@example.com',
      userName: 'User'
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
  if (!isSupabaseConfigured()) {
    // Mock save limit check
    const sub = await getUserSubscription();
    // In mock mode, pretend we have 1 existing resume (or whatever logic)
    // if (!resume.id) we are creating a new one
    if (!resume.id && 1 >= sub.limits.resumes) {
      return { id: '', error: 'Resume limit reached. Please upgrade to create more resumes.' };
    }
    return { id: resume.id || 'res_mock_id', error: null };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { id: '', error: 'Unauthorized' };

  // Check limits if creating new
  const isNew = !resume.id || resume.id === 'res_123';
  if (isNew) {
    const sub = await getUserSubscription();
    const { count } = await supabase.from('resumes').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
    if ((count || 0) >= sub.limits.resumes) {
      return { id: '', error: 'Resume limit reached. Please upgrade your plan to create more resumes.' };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, userId: _userId, title, targetRole, templateId, lastModified: _lastModified, ...content } = resume;

  const dbResume = {
    user_id: user.id,
    title: title || 'Untitled Resume',
    target_role: targetRole || '',
    template_id: templateId || 'tpl_classic',
    content: content,
  };

  if (!isNew) {
    const { data, error } = await supabase.from('resumes').update(dbResume).eq('id', id).select('id').single();
    if (error) return { id: '', error: error.message };
    return { id: data.id, error: null };
  } else {
    const { data, error } = await supabase.from('resumes').insert(dbResume).select('id').single();
    if (error) return { id: '', error: error.message };
    return { id: data.id, error: null };
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
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.from('resume_versions').insert({
    resume_id: resumeId,
    name,
    content: resumeContent
  });

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
  if (!isSupabaseConfigured()) return { error: null };

  const supabase = await createClient();
  const { error } = await supabase.from('resumes').delete().eq('id', id);
  return { error: error ? error.message : null };
}

export async function renameResume(id: string, newTitle: string) {
  if (!isSupabaseConfigured()) return { error: null };

  const supabase = await createClient();
  const { error } = await supabase.from('resumes').update({ title: newTitle }).eq('id', id);
  return { error: error ? error.message : null };
}

export async function duplicateResume(id: string) {
  if (!isSupabaseConfigured()) return { newId: 'mock_dup', error: null };

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
