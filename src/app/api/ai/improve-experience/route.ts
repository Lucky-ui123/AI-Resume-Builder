import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { improveExperience } from '@/lib/ai-service';
import { handleAiRouteError } from '@/lib/api-errors';

export async function POST(req: Request) {
  try {
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { role, company, description, bypassCache, regenerate } = await req.json();
    if (!role || !company || !description) return NextResponse.json({ error: 'Role, company, and description are required' }, { status: 400 });

    const result = await improveExperience(role, company, description, bypassCache || regenerate);
    return NextResponse.json({ result });
  } catch (error: unknown) {
    return handleAiRouteError(error);
  }
}
