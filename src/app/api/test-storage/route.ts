import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config';

export async function GET() {
  const isSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!isSupabase) {
    // If Supabase is not configured, run offline schema and logic assertions
    console.log('[Test Storage] Supabase not configured. Running offline logic tests...');
    
    if (SUBSCRIPTION_PLANS.free.versionLimit !== 0) {
      return NextResponse.json({ success: false, error: 'Free plan version limit should be 0' });
    }
    if (SUBSCRIPTION_PLANS.pro.versionLimit !== 10) {
      return NextResponse.json({ success: false, error: 'Pro plan version limit should be 10' });
    }
    if (SUBSCRIPTION_PLANS.premium.versionLimit !== 50) {
      return NextResponse.json({ success: false, error: 'Premium plan version limit should be 50' });
    }

    return NextResponse.json({
      success: true,
      mode: 'mock',
      message: 'Offline schema and logic checks passed.'
    });
  }

  // Supabase is configured: execute database level integration tests
  const adminSupabase = await createAdminClient();
  const testResumeId = crypto.randomUUID();
  let testUserId = '';

  try {
    console.log('[Test Storage] Creating temporary test user in auth.users...');
    
    // Create a real test user to satisfy foreign key constraints
    const tempEmail = `test-${crypto.randomUUID()}@example.com`;
    const { data: userData, error: userErr } = await adminSupabase.auth.admin.createUser({
      email: tempEmail,
      password: 'SuperSecurePassword123!',
      email_confirm: true
    });

    if (userErr || !userData.user) {
      throw new Error(`Failed to create test user in auth.users: ${userErr?.message || 'Unknown error'}`);
    }

    testUserId = userData.user.id;
    console.log(`[Test Storage] Running database integration tests for user ${testUserId}...`);

    // Ensure profiles record exists to satisfy foreign key constraints
    const { error: profileErr } = await adminSupabase.from('profiles').upsert({
      id: testUserId,
      email: tempEmail,
      full_name: 'Integration Test User'
    });

    if (profileErr) {
      throw new Error(`Failed to ensure test profile exists: ${profileErr.message}`);
    }

    // 1. Create/Ensure a test user subscription (default to free)
    const { error: subErr } = await adminSupabase.from('user_subscriptions').upsert({
      user_id: testUserId,
      user_plan: 'free',
      billing_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }, { onConflict: 'user_id' });

    if (subErr) {
      throw new Error(`Failed to insert test subscription: ${subErr.message}`);
    }

    // 2. Create a test resume owned by testUserId
    const { error: resumeErr } = await adminSupabase.from('resumes').insert({
      id: testResumeId,
      user_id: testUserId,
      title: 'Integration Test Resume',
      target_role: 'Software Engineer',
      template_id: 'tpl_classic',
      content: { personalInfo: { firstName: 'Test' } }
    });

    if (resumeErr) {
      throw new Error(`Failed to insert test resume: ${resumeErr.message}`);
    }

    // --- TEST 1: Free User Limit (0 Versions) ---
    // Free users cannot save versions.
    const { data: freeRes, error: freeErr } = await adminSupabase.rpc('save_resume_version_atomic', {
      p_resume_id: testResumeId,
      p_name: 'V1',
      p_content: { title: 'V1' }
    });

    if (freeErr) {
      throw new Error(`Free user RPC call failed: ${freeErr.message}`);
    }
    if (freeRes?.success || !freeRes?.error?.includes('does not support version history')) {
      throw new Error(`Free user should be blocked from saving version history. Got: ${JSON.stringify(freeRes)}`);
    }

    // --- TEST 2: Pro User Limit (10 Versions) ---
    // Upgrade plan to Pro
    const { error: upgradeErr } = await adminSupabase
      .from('user_subscriptions')
      .update({ user_plan: 'pro' })
      .eq('user_id', testUserId);

    if (upgradeErr) {
      throw new Error(`Failed to upgrade plan to Pro: ${upgradeErr.message}`);
    }

    // Insert 10 versions (limit)
    for (let i = 1; i <= 10; i++) {
      const { data: res, error } = await adminSupabase.rpc('save_resume_version_atomic', {
        p_resume_id: testResumeId,
        p_name: `Version ${i}`,
        p_content: { title: `Version ${i}` }
      });
      if (error || !res.success) {
        throw new Error(`Failed to save version ${i} for Pro user: ${error?.message || res.error}`);
      }
    }

    // Verify all 10 exist
    const { data: versionsList, error: listErr } = await adminSupabase
      .from('resume_versions')
      .select('id, name')
      .eq('resume_id', testResumeId)
      .order('created_at', { ascending: true });

    if (listErr) {
      throw new Error(`Failed to list versions: ${listErr.message}`);
    }

    if (versionsList?.length !== 10) {
      throw new Error(`Expected exactly 10 versions for Pro user. Got: ${versionsList?.length}`);
    }

    const firstVersionId = versionsList[0].id;

    // Save the 11th version. Oldest should be pruned.
    const { data: res11, error: err11 } = await adminSupabase.rpc('save_resume_version_atomic', {
      p_resume_id: testResumeId,
      p_name: 'Version 11',
      p_content: { title: 'Version 11' }
    });

    if (err11 || !res11.success) {
      throw new Error(`Failed to save 11th version for Pro user: ${err11?.message || res11.error}`);
    }

    // Verify oldest version was deleted
    const { data: versionsListAfter, error: listAfterErr } = await adminSupabase
      .from('resume_versions')
      .select('id')
      .eq('resume_id', testResumeId);

    if (listAfterErr) {
      throw new Error(`Failed to list versions after 11th save: ${listAfterErr.message}`);
    }

    if (versionsListAfter?.length !== 10) {
      throw new Error(`Expected exactly 10 versions after inserting 11th. Got: ${versionsListAfter?.length}`);
    }

    const isFirstStillPresent = versionsListAfter.some(v => v.id === firstVersionId);
    if (isFirstStillPresent) {
      throw new Error('Oldest version was not pruned when the 11th was added.');
    }

    // --- TEST 3: Cron Plan Downgrade Pruning ---
    // Downgrade user subscription to Free (limit 0).
    // Running the system pruning RPC should clean up their excess versions.
    const { error: downgradeCronErr } = await adminSupabase
      .from('user_subscriptions')
      .update({ user_plan: 'free' })
      .eq('user_id', testUserId);

    if (downgradeCronErr) {
      throw new Error(`Failed to downgrade subscription for pruning test: ${downgradeCronErr.message}`);
    }

    // Call system-wide pruning RPC
    const { data: pruneRes, error: pruneErr } = await adminSupabase.rpc('prune_excess_resume_versions');
    if (pruneErr) {
      throw new Error(`Prune RPC failed: ${pruneErr.message}`);
    }

    // Since the user has 10 versions and was downgraded to 'free' (limit 0), all 10 should be deleted.
    if (pruneRes?.excess_deleted < 10) {
      throw new Error(`Expected at least 10 excess versions pruned. Got: ${JSON.stringify(pruneRes)}`);
    }

    // Because of foreign keys (ON DELETE CASCADE and NOT NULL), orphaned_deleted should be exactly 0
    if (pruneRes?.orphaned_deleted !== 0) {
      throw new Error(`Expected exactly 0 orphaned versions deleted due to referential integrity. Got: ${JSON.stringify(pruneRes)}`);
    }

    // Confirm all versions for the resume are deleted from the database
    const { data: checkVersions } = await adminSupabase
      .from('resume_versions')
      .select('id')
      .eq('resume_id', testResumeId);

    if (checkVersions && checkVersions.length > 0) {
      throw new Error('Excess versions were not cleaned up after downgrade pruning.');
    }

    return NextResponse.json({
      success: true,
      mode: 'database',
      message: 'All integration database tests passed successfully.'
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('[Test Storage] Test failure:', err);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  } finally {
    if (testUserId) {
      console.log(`[Test Storage] Cleaning up test user ${testUserId} and related records...`);
      // Delete user cascades to their profile and resumes/versions automatically
      await adminSupabase.auth.admin.deleteUser(testUserId);
    }
  }
}
