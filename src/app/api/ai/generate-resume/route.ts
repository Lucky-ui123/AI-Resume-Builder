import { NextResponse } from 'next/server';
import { ResumeBuilderService } from '@/lib/ai-career-services';
import { getUserSubscription } from '@/lib/db-service';

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

    // Override personalInfo name and email with logged in user details if available
    try {
      const { userName, userEmail } = await getUserSubscription();
      
      const currentPersonalInfo = result.personalInfo || {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
      };

      if (userName && userName !== 'User') {
        const nameParts = userName.trim().split(/\s+/);
        currentPersonalInfo.firstName = nameParts[0] || '';
        currentPersonalInfo.lastName = nameParts.slice(1).join(' ') || '';
      }
      if (userEmail) {
        currentPersonalInfo.email = userEmail;
      }

      result.personalInfo = currentPersonalInfo;
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error('AI Generate Resume Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    );
  }
}
