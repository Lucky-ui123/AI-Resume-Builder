import crypto from 'crypto';
import { Resume } from '@/types';
import { MODEL_PRO, MODEL_FLASH } from './gemini-client';
import { getAIClient } from './ai/provider-manager';
import { checkAndIncrementAiUsage, getCachedResponse, saveCachedResponse } from '@/lib/db-service';
import { IMPROVE_SUMMARY_SYSTEM } from './prompts/improve-summary';
import { IMPROVE_EXPERIENCE_SYSTEM } from './prompts/improve-experience';
import { ATS_ANALYSIS_SYSTEM, ATS_SCORE_SCHEMA_PROMPT } from './prompts/ats-analysis';
import { COVER_LETTER_SYSTEM } from './prompts/cover-letter';
import { LINKEDIN_HEADLINE_SYSTEM, LINKEDIN_ABOUT_SYSTEM } from './prompts/linkedin';

// Helper to compute sha256 hash of inputs
function computeHash(input: unknown): string {
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Convert user resume data into compact structured payload to save input tokens
function getCompactResumeForAI(resume: Resume) {
  return {
    role: resume.targetRole || '',
    summary: resume.summary || '',
    skills: resume.skills?.map(s => s.name) ?? [],
    experience: resume.experience?.map(e => ({
      company: e.company || '',
      role: e.role || '',
      description: e.description || ''
    })) ?? [],
    education: resume.education?.map(edu => ({
      institution: edu.institution || '',
      degree: edu.degree || '',
      fieldOfStudy: edu.fieldOfStudy || ''
    })) ?? []
  };
}

// Pre-process and extract keywords for ATS analysis to avoid sending whole resume text
function extractAtsPayload(resume: Resume, jobDescription: string) {
  const skills = resume.skills?.map(s => s.name) ?? [];
  const experienceText = resume.experience?.map(e => `${e.role} ${e.company} ${e.description}`).join(' ') ?? '';
  
  const experienceKeywords = Array.from(new Set(
    experienceText.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4 && !['about', 'their', 'there', 'would', 'could', 'should', 'using', 'through', 'under'].includes(w))
  )).slice(0, 30);

  const jobKeywords = Array.from(new Set(
    jobDescription.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 4 && !['about', 'their', 'there', 'would', 'could', 'should', 'using', 'through', 'under'].includes(w))
  )).slice(0, 30);

  return {
    skills,
    experience_keywords: experienceKeywords,
    job_keywords: jobKeywords
  };
}

// ---------------------------------------------------------------------------
// Service Methods
// ---------------------------------------------------------------------------

export async function improveSummary(currentSummary: string, bypassCache = false): Promise<string> {
  const inputHash = computeHash(currentSummary);
  const taskType = 'improve-summary';

  if (!bypassCache) {
    const cached = await getCachedResponse(taskType, inputHash);
    if (cached) return cached;
  }

  await checkAndIncrementAiUsage();

  const ai = getAIClient();
  const response = await ai.chat.completions.create({
    model: MODEL_FLASH, // grammar/summary improvements use lower-cost standard model
    messages: [
      { role: 'system', content: IMPROVE_SUMMARY_SYSTEM },
      {
        role: 'user',
        content: `Improve this summary:\n${currentSummary}`,
      },
    ],
    temperature: 0.7,
    maxOutputTokens: 200,
    requestType: 'improve_summary',
  });

  const result = response.content || currentSummary;
  await saveCachedResponse(taskType, inputHash, result, response.provider, response.model);
  return result;
}

export async function improveExperience(
  role: string,
  company: string,
  description: string,
  bypassCache = false
): Promise<string> {
  const inputHash = computeHash({ role, company, description });
  const taskType = 'improve-experience';

  if (!bypassCache) {
    const cached = await getCachedResponse(taskType, inputHash);
    if (cached) return cached;
  }

  await checkAndIncrementAiUsage();

  const ai = getAIClient();
  const response = await ai.chat.completions.create({
    model: MODEL_FLASH, // grammar/experience improvements use lower-cost standard model
    messages: [
      { role: 'system', content: IMPROVE_EXPERIENCE_SYSTEM },
      {
        role: 'user',
        content: `Role: ${role}\nCompany: ${company}\nCurrent Description:\n${description}`,
      },
    ],
    temperature: 0.7,
    maxOutputTokens: 250,
    requestType: 'improve_experience',
  });

  const result = response.content || description;
  await saveCachedResponse(taskType, inputHash, result, response.provider, response.model);
  return result;
}

export async function generateATSScore(resume: Resume, jobDescription: string, bypassCache = false) {
  const atsPayload = extractAtsPayload(resume, jobDescription);
  const inputHash = computeHash({ atsPayload, jobDescription });
  const taskType = 'ats-score';

  if (!bypassCache) {
    const cached = await getCachedResponse(taskType, inputHash);
    if (cached) return JSON.parse(cached);
  }

  await checkAndIncrementAiUsage();

  const ai = getAIClient();
  const response = await ai.chat.completions.create({
    model: MODEL_FLASH, // ATS scoring uses lower-cost standard model
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `${ATS_ANALYSIS_SYSTEM}\n${ATS_SCORE_SCHEMA_PROMPT}`,
      },
      {
        role: 'user',
        content: `ATS Extracted Keywords:\n${JSON.stringify(atsPayload)}\n\nJob Description:\n${jobDescription}`,
      },
    ],
    temperature: 0.2,
    maxOutputTokens: 500,
    requestType: 'ats_score',
  });

  const resultText = response.content || '{}';
  await saveCachedResponse(taskType, inputHash, resultText, response.provider, response.model);
  return JSON.parse(resultText);
}

export async function extractKeywords(jobDescription: string, bypassCache = false): Promise<string[]> {
  const inputHash = computeHash(jobDescription);
  const taskType = 'extract-keywords';

  if (!bypassCache) {
    const cached = await getCachedResponse(taskType, inputHash);
    if (cached) return JSON.parse(cached);
  }

  await checkAndIncrementAiUsage();

  const ai = getAIClient();
  const response = await ai.chat.completions.create({
    model: MODEL_FLASH, // keyword extraction uses lower-cost standard model
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Extract the top 10 most critical hard skills and keywords from the job description. Output strictly JSON: { "keywords": string[] }',
      },
      { role: 'user', content: `Job Description:\n${jobDescription}` },
    ],
    temperature: 0.1,
    maxOutputTokens: 200,
    requestType: 'keyword_extraction',
  });

  const resultText = response.content || '{"keywords":[]}';
  await saveCachedResponse(taskType, inputHash, resultText, response.provider, response.model);
  const data = JSON.parse(resultText);
  return data.keywords ?? [];
}

export async function matchResume(resume: Resume, jobDescription: string, bypassCache = false): Promise<string> {
  const compactResume = getCompactResumeForAI(resume);
  const inputHash = computeHash({ compactResume, jobDescription });
  const taskType = 'match-resume';

  if (!bypassCache) {
    const cached = await getCachedResponse(taskType, inputHash);
    if (cached) return cached;
  }

  await checkAndIncrementAiUsage();

  const ai = getAIClient();
  const response = await ai.chat.completions.create({
    model: MODEL_FLASH, // matching suggestions use lower-cost standard model
    messages: [
      {
        role: 'system',
        content: 'Provide a short, actionable paragraph (max 4 sentences) advising the candidate on how to tweak their resume to match the job description. Be direct, professional, and omit all extra explanations.',
      },
      {
        role: 'user',
        content: `Job Description:\n${jobDescription}\n\nResume Summary:\n${JSON.stringify(compactResume)}`,
      },
    ],
    temperature: 0.5,
    maxOutputTokens: 250,
    requestType: 'match_resume',
  });

  const result = response.content || 'No matching advice generated.';
  await saveCachedResponse(taskType, inputHash, result, response.provider, response.model);
  return result;
}

export async function generateCoverLetter(resume: Resume, jobDescription: string, bypassCache = false): Promise<string> {
  const compactResume = {
    name: `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`,
    summary: resume.summary,
    skills: resume.skills?.map(s => s.name) ?? [],
    experience: resume.experience?.map(e => ({ role: e.role, company: e.company, description: e.description })) ?? []
  };

  const inputHash = computeHash({ compactResume, jobDescription });
  const taskType = 'cover-letter';

  if (!bypassCache) {
    const cached = await getCachedResponse(taskType, inputHash);
    if (cached) return cached;
  }

  await checkAndIncrementAiUsage();

  const ai = getAIClient();
  const response = await ai.chat.completions.create({
    model: MODEL_PRO, // Cover letter requires high-quality premium model
    messages: [
      { role: 'system', content: COVER_LETTER_SYSTEM },
      { role: 'user', content: `Job Description:\n${jobDescription}\n\nResume Details:\n${JSON.stringify(compactResume)}` },
    ],
    temperature: 0.7,
    maxOutputTokens: 600,
    requestType: 'cover_letter',
  });

  const result = response.content || 'Failed to generate cover letter.';
  await saveCachedResponse(taskType, inputHash, result, response.provider, response.model);
  return result;
}

export async function generateLinkedInHeadline(resume: Resume, bypassCache = false): Promise<string> {
  const inputHash = computeHash({ targetRole: resume.targetRole, summary: resume.summary });
  const taskType = 'linkedin-headline';

  if (!bypassCache) {
    const cached = await getCachedResponse(taskType, inputHash);
    if (cached) return cached;
  }

  await checkAndIncrementAiUsage();

  const ai = getAIClient();
  const response = await ai.chat.completions.create({
    model: MODEL_PRO, // LinkedIn headline generation uses premium model for better branding
    messages: [
      { role: 'system', content: LINKEDIN_HEADLINE_SYSTEM },
      { role: 'user', content: `Target Role: ${resume.targetRole}\nSummary: ${resume.summary}` },
    ],
    temperature: 0.7,
    maxOutputTokens: 50,
    requestType: 'linkedin_headline',
  });

  const result = response.content || `${resume.targetRole} Professional`;
  await saveCachedResponse(taskType, inputHash, result, response.provider, response.model);
  return result;
}

export async function generateLinkedInAbout(resume: Resume, bypassCache = false): Promise<string> {
  const compactResume = {
    summary: resume.summary,
    skills: resume.skills?.map(s => s.name) ?? [],
    experience: resume.experience?.map(e => ({ role: e.role, company: e.company, description: e.description })) ?? []
  };

  const inputHash = computeHash(compactResume);
  const taskType = 'linkedin-about';

  if (!bypassCache) {
    const cached = await getCachedResponse(taskType, inputHash);
    if (cached) return cached;
  }

  await checkAndIncrementAiUsage();

  const ai = getAIClient();
  const response = await ai.chat.completions.create({
    model: MODEL_PRO, // LinkedIn About generation uses premium model for better branding
    messages: [
      { role: 'system', content: LINKEDIN_ABOUT_SYSTEM },
      { role: 'user', content: `Resume Data:\n${JSON.stringify(compactResume)}` },
    ],
    temperature: 0.7,
    maxOutputTokens: 300,
    requestType: 'linkedin_about',
  });

  const result = response.content || resume.summary;
  await saveCachedResponse(taskType, inputHash, result, response.provider, response.model);
  return result;
}

export async function suggestSkills(targetRole: string, bypassCache = false): Promise<string[]> {
  const inputHash = computeHash(targetRole);
  const taskType = 'suggest-skills';

  if (!bypassCache) {
    const cached = await getCachedResponse(taskType, inputHash);
    if (cached) return JSON.parse(cached);
  }

  await checkAndIncrementAiUsage();

  const ai = getAIClient();
  const response = await ai.chat.completions.create({
    model: MODEL_FLASH, // suggestSkills uses lower-cost standard model
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are an ATS expert. Suggest the top 8 most demanded skills for a given role. Return strictly JSON: { "skills": string[] }',
      },
      { role: 'user', content: `Target Role: ${targetRole}` },
    ],
    temperature: 0.4,
    maxOutputTokens: 200,
    requestType: 'suggest_skills',
  });

  const resultText = response.content || '{"skills":[]}';
  await saveCachedResponse(taskType, inputHash, resultText, response.provider, response.model);
  const data = JSON.parse(resultText);
  return data.skills ?? [];
}

