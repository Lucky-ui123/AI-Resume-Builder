import { NextResponse } from 'next/server';
import { getResume } from '@/lib/db-service';
import { generateLinkedInHeadline, generateLinkedInAbout } from '@/lib/ai-service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { resume, type } = body;
    
    // Validate auth and ownership if Supabase is configured
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (isSupabaseConfigured) {
      if (!resume?.id) return NextResponse.json({ error: 'Resume ID is required' }, { status: 400 });
      const dbResume = await getResume(resume.id);
      if (!dbResume) return NextResponse.json({ error: 'Unauthorized or invalid resume' }, { status: 401 });
    }
    if (!resume || !type) return NextResponse.json({ error: 'Resume and type are required' }, { status: 400 });

    let result = '';
    if (type === 'headline') {
      result = await generateLinkedInHeadline(resume);
    } else if (type === 'about') {
      result = await generateLinkedInAbout(resume);
    } else {
      return NextResponse.json({ error: 'Invalid type. Use "headline" or "about".' }, { status: 400 });
    }

    return NextResponse.json({ result });
  } catch (error: unknown) {
    if ((error as Error)?.message === 'OPENAI_KEY_MISSING') {
      return NextResponse.json({ error: 'AI features require an OpenAI API key. Please configure your environment variables.' }, { status: 503 });
    }
    if ((error as Error)?.message === 'AI_LIMIT_REACHED') {
      return NextResponse.json({ error: 'AI limit reached. Please upgrade to continue.' }, { status: 403 });
    }
    console.error('AI Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
