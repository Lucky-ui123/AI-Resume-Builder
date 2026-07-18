import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { suggestSkills } from '@/lib/ai-service';
import { handleAiRouteError } from '@/lib/api-errors';

export async function POST(req: Request) {
  try {
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetRole, bypassCache, regenerate } = await req.json();
    if (!targetRole) return NextResponse.json({ error: 'Target role is required' }, { status: 400 });

    const result = await suggestSkills(targetRole, bypassCache || regenerate);
    return NextResponse.json({ result });
  } catch (error: unknown) {
    return handleAiRouteError(error);
  }
}
