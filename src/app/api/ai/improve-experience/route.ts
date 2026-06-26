import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { improveExperience } from '@/lib/ai-service';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { role, company, description } = await req.json();
    if (!role || !company || !description) return NextResponse.json({ error: 'Role, company, and description are required' }, { status: 400 });

    const result = await improveExperience(role, company, description);
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
