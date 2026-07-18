import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Telemetry } from '@/lib/telemetry';
import { SUBSCRIPTION_PLANS, PlanType } from '@/lib/subscription-config';

export async function GET(request: Request) {
  const traceId = crypto.randomUUID();
  const startTime = Date.now();
  console.log(`[Cron Cleanup] [Trace: ${traceId}] Cleanup job triggered.`);

  // Check authorization (e.g. cron secret if you configure one in Vercel)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    console.warn(`[Cron Cleanup] [Trace: ${traceId}] Blocked unauthorized request to cleanup endpoint.`);
    Telemetry.recordCounter('cron.cleanup.auth_failure', 1, 'failure', { traceId });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log(`[Cron Cleanup] [Trace: ${traceId}] Supabase URL or Anon key is missing. Skipping database execution.`);
    return NextResponse.json({ message: 'Supabase not configured' }, { status: 200 });
  }

  // Use the admin client to bypass RLS for system-wide cleanup tasks
  const adminSupabase = await createAdminClient();
  const now = new Date().toISOString();

  const results = {
    expiredResumes: 0,
    softDeletedResumes: 0,
    orphanedVersions: 0,
    prunedVersions: 0
  };

  try {
    // 1. Cleanup expired temp/mock resumes
    console.log(`[Cron Cleanup] [Trace: ${traceId}] Checking for expired mock resumes...`);
    const { data: expiredData, error: expiredError } = await adminSupabase
      .from('resumes')
      .delete()
      .lt('expiresAt', now)
      .select('id');

    if (expiredError) {
      console.error(`[Cron Cleanup] [Trace: ${traceId}] Failed to cleanup expired resumes:`, expiredError);
    } else {
      results.expiredResumes = Array.isArray(expiredData) ? expiredData.length : 0;
      console.log(`[Cron Cleanup] [Trace: ${traceId}] Successfully pruned ${results.expiredResumes} expired resumes.`);
    }

    // 2. Permanently delete soft-deleted resumes after 30 days (forward-compatible)
    try {
      console.log(`[Cron Cleanup] [Trace: ${traceId}] Checking for soft-deleted resumes older than 30 days...`);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: softData, error: softError } = await adminSupabase
        .from('resumes')
        .delete()
        .lt('deleted_at', thirtyDaysAgo)
        .select('id');
        
      if (softError && !softError.message.includes('column "deleted_at" does not exist')) {
        console.error(`[Cron Cleanup] [Trace: ${traceId}] Failed to cleanup soft-deleted resumes:`, softError);
      } else if (softData) {
        results.softDeletedResumes = Array.isArray(softData) ? softData.length : 0;
        console.log(`[Cron Cleanup] [Trace: ${traceId}] Successfully deleted ${results.softDeletedResumes} soft-deleted resumes.`);
      }
    } catch (e) {
      // Ignore column does not exist errors
    }

    // 3. Plan-based versions cleanup & Orphaned versions cleanup
    // First, try calling the database-level RPC pruning procedure
    try {
      console.log(`[Cron Cleanup] [Trace: ${traceId}] Attempting database-level RPC pruning via prune_excess_resume_versions...`);
      const { data: rpcData, error: rpcError } = await adminSupabase.rpc('prune_excess_resume_versions');

      if (!rpcError) {
        const res = rpcData as { success?: boolean; orphaned_deleted?: number; excess_deleted?: number } | null;
        if (res && res.success) {
          results.orphanedVersions = res.orphaned_deleted || 0;
          results.prunedVersions = res.excess_deleted || 0;
          const duration = Date.now() - startTime;
          console.log(`[Cron Cleanup] [Trace: ${traceId}] Database RPC successful: ${results.orphanedVersions} orphans deleted, ${results.prunedVersions} excess versions pruned. Total Duration: ${duration}ms`);
          Telemetry.recordLatency('cron.cleanup', duration, 'success', { method: 'rpc', ...results, traceId });
          Telemetry.recordCounter('cron.cleanup.orphans_pruned', results.orphanedVersions, 'success', { traceId });
          Telemetry.recordCounter('cron.cleanup.versions_pruned', results.prunedVersions, 'success', { traceId });
          return NextResponse.json({ 
            success: true, 
            message: 'Cleanup successful (database-level RPC)', 
            results,
            durationMs: duration
          }, { status: 200 });
        }
      }

      // If error is NOT "function does not exist", log it
      if (rpcError && rpcError.code === '42883') {
        console.warn(`[Cron Cleanup] [Trace: ${traceId}] Stored procedure "prune_excess_resume_versions" not found in Supabase. Activating batched client fallback.`);
      } else if (rpcError) {
        console.error(`[Cron Cleanup] [Trace: ${traceId}] Database RPC execution failed: ${rpcError.message}`);
      }
    } catch (err) {
      console.error(`[Cron Cleanup] [Trace: ${traceId}] Exception during database RPC execution:`, err);
    }

    // Fallback: Batched JS-level execution to prevent loading entire tables into memory
    console.log(`[Cron Cleanup] [Trace: ${traceId}] Starting batched JS-level cleanup fallback...`);
    const BATCH_SIZE = 100;
    let offset = 0;
    let hasMoreResumes = true;

    // Fetch user subscriptions for plan mapping
    const { data: subs } = await adminSupabase.from('user_subscriptions').select('user_id, user_plan');

    // Delete orphaned versions (versions where resume no longer exists) in batches
    console.log(`[Cron Cleanup] [Trace: ${traceId}] Checking for orphaned version records in batches...`);
    let hasMoreOrphans = true;
    while (hasMoreOrphans) {
      const { data: batchVersions } = await adminSupabase
        .from('resume_versions')
        .select('id, resume_id')
        .range(offset, offset + BATCH_SIZE - 1);

      if (!batchVersions || batchVersions.length === 0) {
        hasMoreOrphans = false;
        break;
      }

      const uniqueResumeIds = Array.from(new Set(batchVersions.map(v => v.resume_id)));
      
      const { data: existingResumes } = await adminSupabase
        .from('resumes')
        .select('id')
        .in('id', uniqueResumeIds);

      const existingResumeIds = new Set(existingResumes?.map(r => r.id) || []);
      const orphanedIds = batchVersions
        .filter(v => !existingResumeIds.has(v.resume_id))
        .map(v => v.id);

      if (orphanedIds.length > 0) {
        console.log(`[Cron Cleanup] [Trace: ${traceId}] Fallback deleting ${orphanedIds.length} orphaned versions in current batch.`);
        const { error: delErr } = await adminSupabase
          .from('resume_versions')
          .delete()
          .in('id', orphanedIds);
        if (!delErr) {
          results.orphanedVersions += orphanedIds.length;
        } else {
          console.error(`[Cron Cleanup] [Trace: ${traceId}] Failed to delete orphaned batch: ${delErr.message}`);
        }
      }

      if (batchVersions.length < BATCH_SIZE) {
        hasMoreOrphans = false;
      } else {
        offset += BATCH_SIZE;
      }
    }

    // Reset offset for resumes processing
    offset = 0;
    console.log(`[Cron Cleanup] [Trace: ${traceId}] Processing resumes and enforcing plan limits in batches...`);
    while (hasMoreResumes) {
      const { data: batchResumes } = await adminSupabase
        .from('resumes')
        .select('id, user_id')
        .range(offset, offset + BATCH_SIZE - 1);

      if (!batchResumes || batchResumes.length === 0) {
        hasMoreResumes = false;
        break;
      }

      const batchResumeIds = batchResumes.map(r => r.id);

      // Fetch versions only for these specific resumes, sorted descending (newest first)
      const { data: batchVersions } = await adminSupabase
        .from('resume_versions')
        .select('id, resume_id, created_at')
        .in('resume_id', batchResumeIds)
        .order('created_at', { ascending: false });

      if (batchVersions && batchVersions.length > 0) {
        const versionsByResume: Record<string, typeof batchVersions> = {};
        for (const v of batchVersions) {
          if (!versionsByResume[v.resume_id]) {
            versionsByResume[v.resume_id] = [];
          }
          versionsByResume[v.resume_id].push(v);
        }

        const versionIdsToDelete: string[] = [];

        for (const resumeId in versionsByResume) {
          const resumeVersions = versionsByResume[resumeId];
          const resume = batchResumes.find(r => r.id === resumeId);
          if (!resume) continue;

          const userSub = subs?.find(s => s.user_id === resume.user_id);
          const plan = userSub?.user_plan || 'free';
          const limit = SUBSCRIPTION_PLANS[plan as PlanType]?.versionLimit ?? 0;

          if (resumeVersions.length > limit) {
            const excess = resumeVersions.slice(limit);
            versionIdsToDelete.push(...excess.map(v => v.id));
            results.prunedVersions += excess.length;
          }
        }

        if (versionIdsToDelete.length > 0) {
          console.log(`[Cron Cleanup] [Trace: ${traceId}] Fallback deleting ${versionIdsToDelete.length} excess versions across current batch.`);
          const { error: delErr } = await adminSupabase
            .from('resume_versions')
            .delete()
            .in('id', versionIdsToDelete);
          if (delErr) {
            console.error(`[Cron Cleanup] [Trace: ${traceId}] Fallback delete of excess versions failed: ${delErr.message}`);
          }
        }
      }

      if (batchResumes.length < BATCH_SIZE) {
        hasMoreResumes = false;
      } else {
        offset += BATCH_SIZE;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[Cron Cleanup] [Trace: ${traceId}] Batched fallback completed successfully. Duration: ${duration}ms`);
    Telemetry.recordLatency('cron.cleanup', duration, 'success', { method: 'fallback', ...results, traceId });
    Telemetry.recordCounter('cron.cleanup.orphans_pruned', results.orphanedVersions, 'success', { traceId });
    Telemetry.recordCounter('cron.cleanup.versions_pruned', results.prunedVersions, 'success', { traceId });
    return NextResponse.json({ 
      success: true, 
      message: 'Cleanup successful (batched fallback)', 
      results,
      durationMs: duration
    }, { status: 200 });
  } catch (err: unknown) {
    const duration = Date.now() - startTime;
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Cron Cleanup] [Trace: ${traceId}] Unexpected error during cleanup. Duration: ${duration}ms, Error:`, err);
    Telemetry.recordLatency('cron.cleanup', duration, 'failure', { error: errMsg, traceId });
    Telemetry.recordCounter('cron.cleanup.failure', 1, 'failure', { error: errMsg, traceId });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
