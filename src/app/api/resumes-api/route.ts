import { NextResponse } from 'next/server';
import { getAllResumes } from '@/lib/db-service';

export async function GET() {
  try {
    const resumes = await getAllResumes();
    return NextResponse.json({ resumes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ resumes: [], error: message }, { status: 500 });
  }
}
