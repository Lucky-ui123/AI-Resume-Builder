import crypto from 'crypto';
import { Resume, MatchReport, AtsReport, ResumeScores, ResumeSuggestion } from '@/types';
import { MODEL_PRO, MODEL_FLASH } from './gemini-client';
import { getAIClient } from './ai/provider-manager';
import { LocalHeuristicAnalyzer } from './local-heuristic-analyzer';
import { getCachedResponse, saveCachedResponse } from './db-service';
import { ATS_ANALYSIS_SYSTEM, ATS_MATCH_SCHEMA_PROMPT, ATS_REPORT_SCHEMA_PROMPT } from './prompts/ats-analysis';
import { COVER_LETTER_SYSTEM, COVER_LETTER_REWRITE_SYSTEM } from './prompts/cover-letter';
import { RESUME_GENERATION_SYSTEM } from './prompts/resume-generation';

async function trackAiUsage() {
  if (typeof window === 'undefined') {
    const { checkAndIncrementAiUsage } = await import('./db-service');
    await checkAndIncrementAiUsage();
  }
}

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
// 1. Job Matcher Service
// ---------------------------------------------------------------------------
export class JobMatcherService {
  static async analyzeMatch(
    resume: Resume,
    jobDescription: string,
    bypassCache = false
  ): Promise<Omit<MatchReport, 'id' | 'created_at'>> {
    const atsPayload = extractAtsPayload(resume, jobDescription);
    const inputHash = computeHash({ atsPayload, jobDescription });
    const taskType = 'analyze-match';

    if (!bypassCache) {
      const cached = await getCachedResponse(taskType, inputHash);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          resumeId: resume.id,
          resumeTitle: resume.title,
          jobDescription,
          ...parsed
        };
      }
    }

    await trackAiUsage();

    const ai = getAIClient();
    const response = await ai.chat.completions.create({
      model: MODEL_FLASH, // matching logic is standard task, uses lower-cost Flash model
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${ATS_ANALYSIS_SYSTEM}\n${ATS_MATCH_SCHEMA_PROMPT}`,
        },
        {
          role: 'user',
          content: `ATS Extracted Keywords:\n${JSON.stringify(atsPayload)}\n\nJob Description:\n${jobDescription}`,
        },
      ],
      temperature: 0.3,
      maxOutputTokens: 1000,
      requestType: 'ats_match',
    });

    const contentText = response.content || '{}';
    await saveCachedResponse(taskType, inputHash, contentText, response.provider, response.model);
    const parsed = JSON.parse(contentText);

    return {
      resumeId: resume.id,
      resumeTitle: resume.title,
      jobDescription,
      jobTitle: parsed.jobTitle ?? 'Target Role',
      companyName: parsed.companyName ?? 'Target Company',
      matchScore: parsed.matchScore ?? 50,
      skillsMatch: parsed.skillsMatch ?? { matched: [], missing: [] },
      keywords: parsed.keywords ?? { matched: [], missing: [] },
      experienceMatch: parsed.experienceMatch ?? '',
      educationMatch: parsed.educationMatch ?? '',
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      recommendations: parsed.recommendations ?? [],
    };
  }
}

// ---------------------------------------------------------------------------
// 2. ATS Analyzer Service
// ---------------------------------------------------------------------------
export class ATSService {
  static async analyzeResume(resume: Resume, bypassCache = false): Promise<Omit<AtsReport, 'id' | 'created_at'>> {
    const compactResume = getCompactResumeForAI(resume);
    const inputHash = computeHash(compactResume);
    const taskType = 'analyze-ats';

    if (!bypassCache) {
      const cached = await getCachedResponse(taskType, inputHash);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          resumeId: resume.id,
          resumeTitle: resume.title,
          ...parsed
        };
      }
    }

    await trackAiUsage();

    const ai = getAIClient();
    const response = await ai.chat.completions.create({
      model: MODEL_FLASH, // ATS scoring is standard task, uses lower-cost Flash model
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `${ATS_ANALYSIS_SYSTEM}\n${ATS_REPORT_SCHEMA_PROMPT}`,
        },
        { role: 'user', content: `Resume Content:\n${JSON.stringify(compactResume)}` },
      ],
      temperature: 0.2,
      maxOutputTokens: 1000,
      requestType: 'ats_report',
    });

    const contentText = response.content || '{}';
    await saveCachedResponse(taskType, inputHash, contentText, response.provider, response.model);
    const parsed = JSON.parse(contentText);

    return {
      resumeId: resume.id,
      resumeTitle: resume.title,
      overallScore: parsed.overallScore ?? 70,
      contactInfoScore: parsed.contactInfoScore ?? 70,
      structureScore: parsed.structureScore ?? 70,
      keywordScore: parsed.keywordScore ?? 70,
      readabilityScore: parsed.readabilityScore ?? 70,
      formattingScore: parsed.formattingScore ?? 70,
      completenessScore: parsed.completenessScore ?? 70,
      missingKeywords: parsed.missingKeywords ?? [],
      suggestions: parsed.suggestions ?? [],
    };
  }
}

// ---------------------------------------------------------------------------
// 3. AI Suggestions Service
// ---------------------------------------------------------------------------
export class ResumeSuggestionService {
  static async generateSuggestions(
    resume: Resume,
    jobDescription?: string,
    bypassCache = false
  ): Promise<{ scores: ResumeScores; suggestions: ResumeSuggestion[] }> {
    const compactResume = getCompactResumeForAI(resume);
    const inputHash = computeHash({ compactResume, jobDescription });
    const taskType = 'generate-suggestions';

    if (!bypassCache) {
      const cached = await getCachedResponse(taskType, inputHash);
      if (cached) return JSON.parse(cached);
    }

    await trackAiUsage();

    const systemPrompt = `You are an expert AI Writing Assistant panel. Analyze the resume and output JSON suggestions for improvement.
    ${jobDescription ? `Compare against this job description: ${jobDescription}` : ''}
    Schema:
    {
      "scores": {
        "overall": number (0-100),
        "ats": number,
        "writing": number,
        "content": number,
        "keyword": number,
        "experience": number
      },
      "suggestions": [
        {
          "id": "string",
          "title": "string",
          "description": "string",
          "reason": "string",
          "priority": "Critical"|"High"|"Medium"|"Low",
          "category": "Content"|"ATS"|"Grammar"|"Formatting",
          "impact": "High"|"Medium"|"Low",
          "targetField": "string (e.g. summary or experience[0].description)",
          "currentText": "string",
          "suggestedText": "string"
        }
      ]
    }`;

    try {
      const ai = getAIClient();
      const response = await ai.chat.completions.create({
        model: MODEL_FLASH, // suggestions is standard task, uses lower-cost Flash model
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Resume Data:\n${JSON.stringify(compactResume)}` },
        ],
        temperature: 0.4,
        maxOutputTokens: 1200,
        requestType: 'resume_suggestions',
      });

      const contentText = response.content || '{}';
      await saveCachedResponse(taskType, inputHash, contentText, response.provider, response.model);
      const parsed = JSON.parse(contentText);
      
      return {
        scores: parsed.scores ?? LocalHeuristicAnalyzer.analyze(resume).scores,
        suggestions: parsed.suggestions ?? [],
      };
    } catch (e) {
      console.error('Gemini failed, falling back to local heuristic:', e);
      return LocalHeuristicAnalyzer.analyze(resume);
    }
  }
}

// ---------------------------------------------------------------------------
// 4. Cover Letter Service
// ---------------------------------------------------------------------------
export class CoverLetterService {
  static async generateLetter(params: {
    resume: Resume;
    jobDescription: string;
    companyName: string;
    hiringManager?: string;
    tone: string;
    length: string;
  }, bypassCache = false): Promise<string> {
    const compactResume = {
      firstName: params.resume.personalInfo.firstName,
      lastName: params.resume.personalInfo.lastName,
      summary: params.resume.summary,
      skills: params.resume.skills?.map(s => s.name) ?? [],
      experience: params.resume.experience?.map(e => ({ role: e.role, company: e.company, description: e.description })) ?? []
    };

    const inputHash = computeHash({
      compactResume,
      jobDescription: params.jobDescription,
      companyName: params.companyName,
      hiringManager: params.hiringManager,
      tone: params.tone,
      length: params.length
    });
    const taskType = 'generate-cover-letter';

    if (!bypassCache) {
      const cached = await getCachedResponse(taskType, inputHash);
      if (cached) return cached;
    }

    await trackAiUsage();

    const prompt = `Generate a personalized cover letter.
    Candidate Name: ${params.resume.personalInfo.firstName} ${params.resume.personalInfo.lastName}
    Hiring Manager: ${params.hiringManager ?? 'Hiring Manager'}
    Company: ${params.companyName}
    Tone: ${params.tone}
    Length: ${params.length}
    Job Description: ${params.jobDescription}
    Resume Details: ${JSON.stringify(compactResume)}`;

    const ai = getAIClient();
    const response = await ai.chat.completions.create({
      model: MODEL_PRO, // Cover letter requires high-quality premium model
      messages: [
        {
          role: 'system',
          content: COVER_LETTER_SYSTEM,
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      maxOutputTokens: 600,
      requestType: 'cover_letter',
    });

    const result = response.content || '';
    await saveCachedResponse(taskType, inputHash, result, response.provider, response.model);
    return result;
  }

  static async rewriteLetter(content: string, instruction: string, bypassCache = false): Promise<string> {
    const inputHash = computeHash({ content, instruction });
    const taskType = 'rewrite-cover-letter';

    if (!bypassCache) {
      const cached = await getCachedResponse(taskType, inputHash);
      if (cached) return cached;
    }

    await trackAiUsage();

    const ai = getAIClient();
    const response = await ai.chat.completions.create({
      model: MODEL_FLASH, // rewriting cover letters uses standard model
      messages: [
        {
          role: 'system',
          content: COVER_LETTER_REWRITE_SYSTEM,
        },
        { role: 'user', content: `Cover Letter:\n${content}\n\nInstruction: ${instruction}` },
      ],
      temperature: 0.7,
      maxOutputTokens: 600,
      requestType: 'rewrite_cover_letter',
    });

    const result = response.content || content;
    await saveCachedResponse(taskType, inputHash, result, response.provider, response.model);
    return result;
  }
}

// ---------------------------------------------------------------------------
// 5. Resume Builder Service
// ---------------------------------------------------------------------------
export class ResumeBuilderService {
  static async generateResume(prompt: string, bypassCache = false): Promise<Partial<Resume>> {
    const inputHash = computeHash(prompt);
    const taskType = 'generate-resume';

    if (!bypassCache) {
      const cached = await getCachedResponse(taskType, inputHash);
      if (cached) return JSON.parse(cached);
    }

    await trackAiUsage();

    const ai = getAIClient();
    const response = await ai.chat.completions.create({
      model: MODEL_PRO, // Resume generation requires high-quality premium model
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: RESUME_GENERATION_SYSTEM,
        },
        {
          role: 'user',
          content: `Generate a resume based on this description:\n\n${prompt}`,
        },
      ],
      temperature: 0.7,
      maxOutputTokens: 2000,
      requestType: 'resume_generation',
    });

    const contentText = response.content || '{}';
    await saveCachedResponse(taskType, inputHash, contentText, response.provider, response.model);
    const parsed = JSON.parse(contentText);
    return parsed as Partial<Resume>;
  }
}

