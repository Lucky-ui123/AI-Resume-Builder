import OpenAI from 'openai';
import { Resume } from '@/types';
import { GeminiOpenAiWrapper } from './gemini-compat';

// Initialize OpenAI/Gemini conditionally
const getAiClientAndModel = () => {
  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    return {
      client: new OpenAI({ apiKey: openAiKey }),
      model: 'gpt-4o-mini'
    };
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    return {
      client: new GeminiOpenAiWrapper(geminiKey) as any,
      model: 'gemini-3.5-flash'
    };
  }

  return { client: null, model: '' };
};

const { client: openai, model: aiModel } = getAiClientAndModel();

/**
 * Helper to determine if we should use mock data
 */
const shouldUseMock = () => {
  return !openai;
};

// --- AI Prompts and Rules ---
const BASE_SYSTEM_PROMPT = `You are an expert executive resume writer and ATS optimization specialist.
CRITICAL RULES:
1. NEVER invent fake numbers, metrics, or achievements (e.g., "Increased sales by 50%").
2. If metrics are missing, use professional qualitative phrasing (e.g., "Significantly improved operational efficiency").
3. Be concise, impactful, and truthful.
4. Output must be strictly resume-safe and professional.`;

import { checkAndIncrementAiUsage } from '@/lib/db-service';

// --- Service Methods ---

export async function improveSummary(currentSummary: string): Promise<string> {
  await checkAndIncrementAiUsage();
  if (shouldUseMock()) {
    // Return mock improvement
    await new Promise(res => setTimeout(res, 1500));
    return `Results-driven professional with a proven track record. ${currentSummary} Known for delivering high-quality solutions and optimizing processes.`;
  }

  const response = await openai!.chat.completions.create({
    model: aiModel,
    messages: [
      { role: 'system', content: BASE_SYSTEM_PROMPT },
      { role: 'user', content: `Improve the following resume professional summary to make it more impactful and ATS-friendly. Do not invent facts.\n\nCurrent Summary:\n${currentSummary}` }
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || currentSummary;
}

export async function improveExperience(role: string, company: string, description: string): Promise<string> {
  await checkAndIncrementAiUsage();
  if (shouldUseMock()) {
    await new Promise(res => setTimeout(res, 1500));
    return `• Spearheaded initiatives at ${company} as ${role}.\n• Streamlined operations and delivered key projects on time.\n• Collaborated with cross-functional teams to achieve strategic goals.\n${description.split('\n').map(d => `• ${d}`).join('\n')}`;
  }

  const response = await openai!.chat.completions.create({
    model: aiModel,
    messages: [
      { role: 'system', content: BASE_SYSTEM_PROMPT },
      { role: 'user', content: `Rewrite the following work experience bullet points to be more action-oriented (using strong verbs). Format as a clean bulleted list using the "• " symbol. Do NOT invent fake percentages or revenue numbers.\n\nRole: ${role}\nCompany: ${company}\nCurrent Description:\n${description}` }
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || description;
}

export async function generateATSScore(resume: Resume, jobDescription: string) {
  await checkAndIncrementAiUsage();
  if (shouldUseMock()) {
    await new Promise(res => setTimeout(res, 2000));
    return {
      score: 78,
      missingKeywords: ['TypeScript', 'Agile', 'GraphQL', 'CI/CD'],
      suggestions: [
        'Add more quantifiable achievements to your experience section.',
        'Include CI/CD in your skills list as it appears frequently in the job description.',
        'Tailor your summary to mention Agile methodologies explicitly.'
      ]
    };
  }

  const resumeText = JSON.stringify(resume);
  const response = await openai!.chat.completions.create({
    model: aiModel,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: `${BASE_SYSTEM_PROMPT}\nYou are evaluating a resume against a job description. Output strict JSON with this schema: { "score": number (0-100), "missingKeywords": string[], "suggestions": string[] }` },
      { role: 'user', content: `Job Description:\n${jobDescription}\n\nResume JSON:\n${resumeText}` }
    ],
    temperature: 0.2,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

export async function extractKeywords(jobDescription: string): Promise<string[]> {
  await checkAndIncrementAiUsage();
  if (shouldUseMock()) {
    await new Promise(res => setTimeout(res, 1000));
    return ['React', 'Next.js', 'TypeScript', 'Tailwind', 'Node.js', 'REST APIs', 'Git', 'Agile'];
  }

  const response = await openai!.chat.completions.create({
    model: aiModel,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'Extract the top 10 most critical hard skills and keywords from the job description. Output strictly JSON: { "keywords": string[] }' },
      { role: 'user', content: `Job Description:\n${jobDescription}` }
    ],
    temperature: 0.1,
  });

  const data = JSON.parse(response.choices[0].message.content || '{"keywords":[]}');
  return data.keywords || [];
}

export async function matchResume(resume: Resume, jobDescription: string): Promise<string> {
  await checkAndIncrementAiUsage();
  if (shouldUseMock()) {
    await new Promise(res => setTimeout(res, 2500));
    return `To better align with this role, emphasize your experience with scalable architectures. Add specific examples of cross-team collaboration, as the JD heavily stresses teamwork. Consider highlighting your frontend performance optimization skills in the summary.`;
  }

  const resumeText = JSON.stringify(resume);
  const response = await openai!.chat.completions.create({
    model: aiModel,
    messages: [
      { role: 'system', content: BASE_SYSTEM_PROMPT },
      { role: 'user', content: `Provide a short, actionable paragraph (max 4 sentences) advising the candidate on how to tweak their resume to better match the provided job description.\n\nJob Description:\n${jobDescription}\n\nResume:\n${resumeText}` }
    ],
    temperature: 0.5,
  });

  return response.choices[0].message.content || 'No matching advice generated.';
}

export async function generateCoverLetter(resume: Resume, jobDescription: string): Promise<string> {
  await checkAndIncrementAiUsage();
  if (shouldUseMock()) {
    await new Promise(res => setTimeout(res, 2000));
    return `Dear Hiring Manager,\n\nI am writing to express my strong interest in the open position. With my background in software development and proven ability to deliver high-quality solutions, I am confident in my ability to contribute effectively to your team.\n\nIn my previous roles, I have successfully designed and implemented robust web applications, consistently meeting project deadlines and exceeding expectations. I am particularly drawn to this opportunity because of your company's innovative approach and commitment to excellence.\n\nI would welcome the opportunity to discuss how my skills and experiences align with your needs. Thank you for your time and consideration.\n\nSincerely,\n${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`;
  }

  const resumeText = JSON.stringify({
    name: `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`,
    summary: resume.summary,
    experience: resume.experience,
    skills: resume.skills
  });

  const response = await openai!.chat.completions.create({
    model: aiModel,
    messages: [
      { role: 'system', content: `${BASE_SYSTEM_PROMPT}\nWrite a compelling, professional cover letter based on the provided resume and job description. Do not include placeholder brackets like [Company Name] if the company is in the JD. If unknown, write it naturally without brackets. Keep it to 3-4 paragraphs.` },
      { role: 'user', content: `Job Description:\n${jobDescription}\n\nResume:\n${resumeText}` }
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || 'Failed to generate cover letter.';
}

export async function generateLinkedInHeadline(resume: Resume): Promise<string> {
  await checkAndIncrementAiUsage();
  if (shouldUseMock()) {
    await new Promise(res => setTimeout(res, 1000));
    return `${resume.targetRole} | Expert in building scalable web applications | Passionate about UX and Performance`;
  }

  const response = await openai!.chat.completions.create({
    model: aiModel,
    messages: [
      { role: 'system', content: 'Generate a highly professional, ATS-friendly LinkedIn headline (max 120 chars) based on the user summary and target role. Do not use emojis.' },
      { role: 'user', content: `Target Role: ${resume.targetRole}\nSummary: ${resume.summary}` }
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || `${resume.targetRole} Professional`;
}

export async function generateLinkedInAbout(resume: Resume): Promise<string> {
  await checkAndIncrementAiUsage();
  if (shouldUseMock()) {
    await new Promise(res => setTimeout(res, 2000));
    return `As a dedicated ${resume.targetRole}, I specialize in delivering impactful solutions that drive business success. My technical expertise spans modern web development frameworks, and I pride myself on bridging the gap between engineering and design.\n\nI am constantly exploring new technologies to improve system performance and user experience. When I'm not coding, I enjoy mentoring junior developers and contributing to open-source initiatives. Let's connect!`;
  }

  const resumeText = JSON.stringify({ summary: resume.summary, experience: resume.experience, skills: resume.skills });
  const response = await openai!.chat.completions.create({
    model: aiModel,
    messages: [
      { role: 'system', content: `${BASE_SYSTEM_PROMPT}\nWrite an engaging, 2-3 paragraph LinkedIn "About" section. Use first-person perspective. It should be friendly but professional.` },
      { role: 'user', content: `Resume Data:\n${resumeText}` }
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || resume.summary;
}

export async function suggestSkills(targetRole: string): Promise<string[]> {
  await checkAndIncrementAiUsage();
  if (shouldUseMock()) {
    await new Promise(res => setTimeout(res, 1000));
    return ['Leadership', 'Project Management', 'Agile Methodologies', 'Data Analysis', 'Problem Solving', 'Communication', 'Strategic Planning', 'Cross-functional Collaboration'];
  }

  const response = await openai!.chat.completions.create({
    model: aiModel,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'You are an ATS expert. Suggest the top 8 most demanded skills for a given role. Return strictly JSON: { "skills": string[] }' },
      { role: 'user', content: `Target Role: ${targetRole}` }
    ],
    temperature: 0.4,
  });

  const data = JSON.parse(response.choices[0].message.content || '{"skills":[]}');
  return data.skills || [];
}
