import OpenAI from 'openai';
import { Resume, MatchReport, AtsReport, CoverLetter, ResumeSuggestion } from '@/types';

const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

const shouldUseMock = () => {
  return !openai;
};

async function trackAiUsage() {
  if (typeof window === 'undefined') {
    const { checkAndIncrementAiUsage } = await import('./db-service');
    await checkAndIncrementAiUsage();
  }
}

// ---------------------------------------------------------------------------
// 1. Job Matcher Service
// ---------------------------------------------------------------------------
export class JobMatcherService {
  static async analyzeMatch(resume: Resume, jobDescription: string): Promise<Omit<MatchReport, 'id' | 'created_at'>> {
    await trackAiUsage();
    const resumeText = JSON.stringify({
      title: resume.title,
      targetRole: resume.targetRole,
      summary: resume.summary,
      skills: resume.skills?.map(s => s.name) || [],
      experience: resume.experience || [],
      education: resume.education || []
    });

    if (shouldUseMock()) {
      await new Promise(r => setTimeout(r, 2000));
      // Extract mock skills/keywords
      const jobLower = jobDescription.toLowerCase();
      const possibleKeywords = ['react', 'next.js', 'typescript', 'tailwind', 'graphql', 'node', 'sql', 'agile', 'aws', 'ci/cd'];
      const matched = possibleKeywords.filter(k => jobLower.includes(k) && JSON.stringify(resume).toLowerCase().includes(k));
      const missing = possibleKeywords.filter(k => jobLower.includes(k) && !JSON.stringify(resume).toLowerCase().includes(k));
      
      const score = Math.max(45, Math.min(95, 50 + matched.length * 8));

      return {
        resumeId: resume.id,
        resumeTitle: resume.title,
        jobTitle: resume.targetRole || 'Software Engineer',
        companyName: 'Target Company',
        jobDescription,
        matchScore: score,
        skillsMatch: { matched, missing },
        keywords: { matched, missing },
        experienceMatch: 'Matches 3 out of 5 core experience requirements specified in the description.',
        educationMatch: 'Education qualifications match the minimum requirement.',
        strengths: [
          'Excellent technical alignment with core front-end languages.',
          'Solid project history reflecting production scale deployments.'
        ],
        weaknesses: [
          'Missing back-end database orchestration experience.',
          'No mention of cloud provider services (e.g. AWS, GCP).'
        ],
        recommendations: [
          'Integrate node/database tools into the skills list.',
          'Explicitly highlight any minor AWS services used in past projects.'
        ]
      };
    }

    const response = await openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert recruitment ATS and Job Match Analyzer. Compare the resume against the job description. Output a strict JSON structure matching:
          {
            "jobTitle": "string",
            "companyName": "string",
            "matchScore": number (0-100),
            "skillsMatch": { "matched": string[], "missing": string[] },
            "keywords": { "matched": string[], "missing": string[] },
            "experienceMatch": "string summary",
            "educationMatch": "string summary",
            "strengths": string[],
            "weaknesses": string[],
            "recommendations": string[]
          }`
        },
        {
          role: 'user',
          content: `Resume details:\n${resumeText}\n\nJob Description:\n${jobDescription}`
        }
      ],
      temperature: 0.3
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    return {
      resumeId: resume.id,
      resumeTitle: resume.title,
      jobDescription,
      jobTitle: parsed.jobTitle || 'Target Role',
      companyName: parsed.companyName || 'Target Company',
      matchScore: parsed.matchScore || 50,
      skillsMatch: parsed.skillsMatch || { matched: [], missing: [] },
      keywords: parsed.keywords || { matched: [], missing: [] },
      experienceMatch: parsed.experienceMatch || '',
      educationMatch: parsed.educationMatch || '',
      strengths: parsed.strengths || [],
      weaknesses: parsed.weaknesses || [],
      recommendations: parsed.recommendations || []
    };
  }
}

// ---------------------------------------------------------------------------
// 2. ATS Analyzer Service
// ---------------------------------------------------------------------------
export class ATSService {
  static async analyzeResume(resume: Resume): Promise<Omit<AtsReport, 'id' | 'created_at'>> {
    await trackAiUsage();
    
    if (shouldUseMock()) {
      await new Promise(r => setTimeout(r, 2000));
      return {
        resumeId: resume.id,
        resumeTitle: resume.title,
        overallScore: 82,
        contactInfoScore: 90,
        structureScore: 85,
        keywordScore: 75,
        readabilityScore: 88,
        formattingScore: 80,
        completenessScore: 95,
        missingKeywords: ['CI/CD', 'Docker', 'Kubernetes'],
        suggestions: [
          { id: '1', priority: 'High', message: 'Include quantifiable results (e.g. percentages, values) in experience bullet points.', section: 'Work Experience' },
          { id: '2', priority: 'Medium', message: 'Avoid graphics or complex multi-column grids that impede parser scanning.', section: 'Formatting' },
          { id: '3', priority: 'Low', message: 'Include missing cloud deployment keywords.', section: 'Keywords' }
        ]
      };
    }

    const resumeText = JSON.stringify(resume);
    const response = await openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert ATS (Applicant Tracking System) parser and optimizer. Grade the resume. Output strict JSON:
          {
            "overallScore": number (0-100),
            "contactInfoScore": number,
            "structureScore": number,
            "keywordScore": number,
            "readabilityScore": number,
            "formattingScore": number,
            "completenessScore": number,
            "missingKeywords": string[],
            "suggestions": [{ "id": "string", "priority": "High"|"Medium"|"Low", "message": "string", "section": "string" }]
          }`
        },
        {
          role: 'user',
          content: `Resume Content JSON:\n${resumeText}`
        }
      ],
      temperature: 0.2
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    return {
      resumeId: resume.id,
      resumeTitle: resume.title,
      overallScore: parsed.overallScore || 70,
      contactInfoScore: parsed.contactInfoScore || 70,
      structureScore: parsed.structureScore || 70,
      keywordScore: parsed.keywordScore || 70,
      readabilityScore: parsed.readabilityScore || 70,
      formattingScore: parsed.formattingScore || 70,
      completenessScore: parsed.completenessScore || 70,
      missingKeywords: parsed.missingKeywords || [],
      suggestions: parsed.suggestions || []
    };
  }
}

// ---------------------------------------------------------------------------
// 3. AI Suggestions Service
// ---------------------------------------------------------------------------
export class ResumeSuggestionService {
  static async generateSuggestions(resume: Resume): Promise<ResumeSuggestion[]> {
    await trackAiUsage();

    if (shouldUseMock()) {
      await new Promise(r => setTimeout(r, 1500));
      return [
        {
          id: 'sug_1',
          category: 'Metrics',
          targetField: 'summary',
          currentText: resume.summary,
          suggestedText: `Results-oriented specialist with over ${resume.experience?.length || 2} years of history driving high-value feature design. Developed core products reducing page render latency by 30%.`,
          reason: 'Including clear business metrics at the top grabs recruiter attention immediately.'
        },
        {
          id: 'sug_2',
          category: 'Action Verbs',
          targetField: 'experience[0].description',
          currentText: resume.experience?.[0]?.description || 'Worked on projects',
          suggestedText: '• Spearheaded critical UI redesign, leading to 25% user retention increase.\n• Orchestrated API caching, decreasing server load.',
          reason: 'Replaces passive language with active keywords to maximize ATS indexing potential.'
        }
      ];
    }

    const resumeText = JSON.stringify(resume);
    const response = await openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert AI Writing Assistant panel. Analyze the resume and output JSON suggestions for improvement. Schema:
          {
            "suggestions": [
              {
                "id": "string",
                "category": "Grammar"|"Tone"|"Action Verbs"|"Metrics"|"Skills"|"Summary"|"Title"|"ATS",
                "targetField": "string (e.g. summary or experience[0].description)",
                "currentText": "string",
                "suggestedText": "string",
                "reason": "string"
              }
            ]
          }`
        },
        {
          role: 'user',
          content: `Resume JSON:\n${resumeText}`
        }
      ],
      temperature: 0.4
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    return parsed.suggestions || [];
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
  }): Promise<string> {
    await trackAiUsage();

    if (shouldUseMock()) {
      await new Promise(r => setTimeout(r, 2000));
      const name = `${params.resume.personalInfo.firstName} ${params.resume.personalInfo.lastName}`;
      const manager = params.hiringManager || 'Hiring Manager';
      
      return `Dear ${manager},

I am writing to express my strong interest in the opportunity at ${params.companyName}. With a solid foundation in software development and experience building responsive interfaces, I am confident that my skills align well with the needs of your team.

Throughout my career, I have focused on designing efficient architectures and translating business requirements into scalable code. Specifically, my expertise in templates and layouts will allow me to integrate seamlessly into your engineering workflows.

Thank you for your time and consideration. I look forward to discussing how my qualifications align with the target role.

Sincerely,
${name}`;
    }

    const resumeText = JSON.stringify(params.resume);
    const prompt = `Generate a personalized cover letter.
    Candidate Name: ${params.resume.personalInfo.firstName} ${params.resume.personalInfo.lastName}
    Hiring Manager: ${params.hiringManager || 'Hiring Manager'}
    Company: ${params.companyName}
    Tone: ${params.tone}
    Length: ${params.length}
    Job Description: ${params.jobDescription}
    Resume Details: ${resumeText}`;

    const response = await openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an elite career strategist. Write a cover letter using candidate info and job details. Maintain formatting.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7
    });

    return response.choices[0].message.content || '';
  }

  static async rewriteLetter(content: string, instruction: string): Promise<string> {
    await trackAiUsage();
    if (shouldUseMock()) {
      await new Promise(r => setTimeout(r, 1500));
      return `${content}\n\n[AI Refined with instruction: "${instruction}"]: Optimized text for better engagement and tone flow.`;
    }

    const response = await openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a professional copywriter. Rewrite the cover letter text based on the user instructions.' },
        { role: 'user', content: `Cover Letter:\n${content}\n\nInstruction: ${instruction}` }
      ],
      temperature: 0.7
    });

    return response.choices[0].message.content || content;
  }
}
