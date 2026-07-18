import { NextResponse } from 'next/server';
import { getResume } from '@/lib/db-service';
import { generateCoverLetter } from '@/lib/ai-service';
import { handleAiRouteError } from '@/lib/api-errors';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { resume, jobDescription, bypassCache, regenerate } = body;
    
    // Validate auth and ownership if Supabase is configured
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (isSupabaseConfigured) {
      if (!resume?.id) return NextResponse.json({ error: 'Resume ID is required' }, { status: 400 });
      const dbResume = await getResume(resume.id);
      if (!dbResume) return NextResponse.json({ error: 'Unauthorized or invalid resume' }, { status: 401 });
    }
    if (!resume || !jobDescription) return NextResponse.json({ error: 'Resume and job description are required' }, { status: 400 });

    const result = await generateCoverLetter(resume, jobDescription, bypassCache || regenerate);
    return NextResponse.json({ letter: result });
  } catch (error: unknown) {
    return handleAiRouteError(error);
  }
}
