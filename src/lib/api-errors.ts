import { NextResponse } from 'next/server';

export function handleAiRouteError(error: unknown) {
  const errMsg = error instanceof Error ? error.message : String(error);
  
  if (errMsg === 'GEMINI_KEY_MISSING') {
    return NextResponse.json(
      { error: 'AI features require a Gemini API key. Set GEMINI_API_KEY in your environment.' },
      { status: 503 }
    );
  }
  
  if (errMsg === 'AI_LIMIT_REACHED') {
    return NextResponse.json(
      { error: 'AI limit reached. Please upgrade to continue.' },
      { status: 403 }
    );
  }
  
  if (errMsg === 'AI_RATE_LIMIT_EXHAUSTED') {
    return NextResponse.json(
      { error: 'AI service is currently rate-limited or your API key has exceeded its quota. Please try again in a few moments or update your GEMINI_API_KEY.' },
      { status: 429 }
    );
  }

  if (errMsg === 'AI_TIMEOUT') {
    return NextResponse.json(
      { error: 'AI service timeout. Please try again.' },
      { status: 504 }
    );
  }
  
  if (errMsg === 'GEMINI_INVALID_KEY') {
    return NextResponse.json(
      { error: 'Invalid Gemini API key. Please check the GEMINI_API_KEY in your environment configuration.' },
      { status: 401 }
    );
  }

  if (errMsg === 'GROQ_KEY_MISSING') {
    return NextResponse.json(
      { error: 'Groq API key is missing. Set GROQ_API_KEY in your environment.' },
      { status: 503 }
    );
  }

  if (errMsg === 'GROQ_INVALID_KEY') {
    return NextResponse.json(
      { error: 'Invalid Groq API key. Please check the GROQ_API_KEY in your environment configuration.' },
      { status: 401 }
    );
  }

  if (errMsg === 'GROQ_RATE_LIMIT_EXHAUSTED') {
    return NextResponse.json(
      { error: 'Groq AI service is currently rate-limited or your API key has exceeded its quota.' },
      { status: 429 }
    );
  }

  if (errMsg === 'GROQ_TIMEOUT') {
    return NextResponse.json(
      { error: 'Groq AI service timeout. Please try again.' },
      { status: 504 }
    );
  }

  if (errMsg.startsWith('ALL_PROVIDERS_FAILED') || errMsg === 'All AI providers failed') {
    return NextResponse.json(
      { error: 'All AI providers are currently unavailable. Please try again later or check your API configuration.' },
      { status: 503 }
    );
  }
  
  console.error('AI Error:', error);
  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  );
}
