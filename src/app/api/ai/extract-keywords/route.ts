import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { extractKeywords } from '@/lib/ai-service';
import { handleAiRouteError } from '@/lib/api-errors';

export async function POST(req: Request) {
  try {
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobDescription, bypassCache, regenerate } = await req.json();
    if (!jobDescription) return NextResponse.json({ error: 'Job description is required' }, { status: 400 });

    const keywords = await extractKeywords(jobDescription, bypassCache || regenerate);
    return NextResponse.json({ keywords });
  } catch (error: unknown) {
    return handleAiRouteError(error);
  }
}
