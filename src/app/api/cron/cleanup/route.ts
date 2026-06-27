import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase';

export async function GET(request: Request) {
  // Check authorization (e.g. cron secret if you configure one in Vercel)
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ message: 'Supabase not configured' }, { status: 200 });
  }

  const supabase = supabaseServer();
  const now = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('resumes')
      .delete()
      .lt('expiresAt', now);

    if (error) {
      console.error('Failed to cleanup expired resumes:', error);
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cleanup successful', 
      deletedCount: data?.length || 0 
    }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error during cleanup:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
