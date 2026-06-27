import { NextResponse } from 'next/server';
import { ResumeBuilderService } from '@/lib/ai-career-services';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const result = await ResumeBuilderService.generateResume(prompt);

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI Generate Resume Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    );
  }
}
