import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { improveSummary } from '@/lib/ai-service';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { summary } = await req.json();
    if (!summary) return NextResponse.json({ error: 'Summary is required' }, { status: 400 });

    const improved = await improveSummary(summary);
    return NextResponse.json({ result: improved });
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
