import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
import { emptyResume } from '@/lib/mock-data';
import { checkAndIncrementAiUsage, getUserSubscription } from '@/lib/db-service';
import { GeminiClient } from '@/lib/gemini-client';
import { getAIClient } from '@/lib/ai/provider-manager';
import { handleAiRouteError } from '@/lib/api-errors';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  try {
    const isSupabaseConfigured =
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (isSupabaseConfigured) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 5 MB limit' }, { status: 400 });
    }

    const fileType = file.type;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let extractedText = '';

    try {
      if (fileType === 'application/pdf') {
        const parser = new PDFParse({ data: buffer });
        const parsed = await parser.getText();
        extractedText = parsed.text;
      } else if (
        fileType ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.name.endsWith('.docx')
      ) {
        const result = await mammoth.extractRawText({ buffer });
        extractedText = result.value;
      } else {
        return NextResponse.json(
          { error: 'Unsupported file type. Only PDF and DOCX are allowed.' },
          { status: 400 }
        );
      }
    } catch (parseError) {
      console.error('File extraction error:', parseError);
      return NextResponse.json(
        { error: 'Could not extract text from the file. It may be encrypted or corrupted.' },
        { status: 400 }
      );
    }

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Extracted text is empty. Ensure the file contains readable text.' },
        { status: 400 }
      );
    }

    // AI usage gate
    try {
      await checkAndIncrementAiUsage();
    } catch (e: unknown) {
      if ((e as Error).message === 'AI_LIMIT_REACHED') {
        return NextResponse.json(
          { error: 'AI limit reached. Please upgrade to continue parsing.' },
          { status: 403 }
        );
      }
    }

    // Validate Gemini key before attempting to call the API
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          resume: {
            ...emptyResume,
            title: file.name ? `Parsed ${file.name}` : 'Parsed Resume',
          },
          confidence: {
            personalInfo: 100,
            summary: 100,
            experience: 100,
            education: 100,
            skills: 100,
            projects: 100,
            certifications: 100,
          },
        }
      );
    }

    const ai = getAIClient();

    const systemPrompt = `You are an expert ATS resume parser.
Extract the following text into a structured JSON format. You MUST return exactly this schema:
{
  "resume": {
    "personalInfo": { "firstName": "", "lastName": "", "email": "", "phone": "", "location": "", "website": "", "linkedin": "", "github": "" },
    "summary": "",
    "experience": [{ "id": "uuid", "company": "", "role": "", "location": "", "startDate": "", "endDate": "", "current": false, "description": "" }],
    "education": [{ "id": "uuid", "institution": "", "degree": "", "fieldOfStudy": "", "startDate": "", "endDate": "", "current": false, "score": "" }],
    "skills": [{ "id": "uuid", "name": "", "category": "Hard" }],
    "projects": [{ "id": "uuid", "name": "", "description": "", "url": "", "startDate": "", "endDate": "" }],
    "certifications": [{ "id": "uuid", "name": "", "issuer": "", "date": "", "url": "" }]
  },
  "confidence": {
    "personalInfo": 0,
    "summary": 0,
    "experience": 0,
    "education": 0,
    "skills": 0,
    "projects": 0,
    "certifications": 0
  }
}

Rules:
1. Do not invent missing information. If a field or section is missing in the text, leave it empty (empty string "" or empty array []).
2. Generate a random uuid for all "id" fields.
3. Clean up formatting and fix minor typos.
4. Calculate a confidence score between 0 and 100 for each section based on how clearly the text matched standard resume formats and how much expected data was found. If a section is entirely missing, its confidence is 0.
5. Return ONLY valid JSON matching the schema. No markdown wrappers.`;

    const response = await ai.chat.completions.create({
      model: GeminiClient.DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Extract from this resume:\n\n${extractedText}` },
      ],
      response_format: { type: 'json_object' },
      maxOutputTokens: 2500,
      requestType: 'parse_resume',
    });

    const parsedContent = response.content;
    if (!parsedContent) throw new Error('Failed to parse resume');

    const result = JSON.parse(parsedContent);
    const structuredResume = result.resume || result;
    const confidence = result.confidence || {};

    // Attach default template and title
    const finalResume = {
      id: `res_${Date.now()}`,
      title: 'Parsed Resume',
      templateId: 'classic-ats',
      ...structuredResume,
    };

    // Override personalInfo name/email with authenticated user's details when available
    try {
      const { userName, userEmail } = await getUserSubscription();
      if (userName && userName !== 'User') {
        const nameParts = userName.trim().split(/\s+/);
        if (!finalResume.personalInfo) finalResume.personalInfo = {};
        finalResume.personalInfo.firstName = nameParts[0] ?? '';
        finalResume.personalInfo.lastName = nameParts.slice(1).join(' ') ?? '';
      }
      if (userEmail) {
        if (!finalResume.personalInfo) finalResume.personalInfo = {};
        finalResume.personalInfo.email = userEmail;
      }
    } catch {
      // ignore — unauthenticated or missing user record
    }

    return NextResponse.json({ resume: finalResume, confidence });
  } catch (error: unknown) {
    console.error('Error parsing resume:', error);
    return handleAiRouteError(error);
  }
}
