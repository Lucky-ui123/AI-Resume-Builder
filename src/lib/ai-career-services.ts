import OpenAI from 'openai';
import { Resume, MatchReport, AtsReport, ResumeScores, ResumeSuggestion } from '@/types';
import { GeminiOpenAiWrapper } from './gemini-compat';

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
      model: aiModel,
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
      model: aiModel,
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
import { LocalHeuristicAnalyzer } from './local-heuristic-analyzer';

export class ResumeSuggestionService {
  static async generateSuggestions(resume: Resume, jobDescription?: string): Promise<{ scores: ResumeScores, suggestions: ResumeSuggestion[] }> {
    await trackAiUsage();

    if (shouldUseMock() || !openai) {
      await new Promise(r => setTimeout(r, 600)); // debounce simulation
      return LocalHeuristicAnalyzer.analyze(resume);
    }

    const resumeText = JSON.stringify(resume);
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
      const response = await openai.chat.completions.create({
        model: aiModel,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Resume JSON:\n${resumeText}` }
        ],
        temperature: 0.4
      });

      const parsed = JSON.parse(response.choices[0].message.content || '{}');
      return {
        scores: parsed.scores || LocalHeuristicAnalyzer.analyze(resume).scores,
        suggestions: parsed.suggestions || []
      };
    } catch (e) {
      console.error("OpenAI failed, falling back to local heuristic:", e);
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
      model: aiModel,
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
      model: aiModel,
      messages: [
        { role: 'system', content: 'You are a professional copywriter. Rewrite the cover letter text based on the user instructions.' },
        { role: 'user', content: `Cover Letter:\n${content}\n\nInstruction: ${instruction}` }
      ],
      temperature: 0.7
    });

    return response.choices[0].message.content || content;
  }
}

// ---------------------------------------------------------------------------
// 5. Resume Builder Service
// ---------------------------------------------------------------------------
export class ResumeBuilderService {
  static async generateResume(prompt: string): Promise<Partial<Resume>> {
    await trackAiUsage();
    
    if (shouldUseMock()) {
      await new Promise(r => setTimeout(r, 2000));
      return {
        title: "AI Generated Resume",
        targetRole: prompt.substring(0, 30) + (prompt.length > 30 ? "..." : ""),
        summary: `This is an AI generated summary based on the prompt: "${prompt}". You can edit this text to better match your actual experience.`,
        personalInfo: {
          firstName: "Alex",
          lastName: "Morgan",
          email: "alex.morgan@example.com",
          phone: "(555) 123-4567",
          location: "San Francisco, CA",
        },
        experience: [
          {
            id: 'mock-exp-1',
            role: "Senior Software Engineer",
            company: "Tech Solutions Inc.",
            location: "San Francisco, CA",
            startDate: "2020-01",
            endDate: "Present",
            current: true,
            description: "- Led development of core microservices using Node.js and React\n- Improved system performance by 40% through database optimization\n- Mentored junior engineers and conducted code reviews"
          }
        ],
        education: [
          {
            id: 'mock-edu-1',
            institution: "University of Technology",
            degree: "Bachelor of Science",
            fieldOfStudy: "Computer Science",
            startDate: "2015-08",
            endDate: "2019-05",
            current: false
          }
        ],
        skills: [
          { id: 'mock-skill-1', name: "JavaScript", category: "Languages" },
          { id: 'mock-skill-2', name: "React", category: "Hard" },
          { id: 'mock-skill-3', name: "Node.js", category: "Hard" },
        ]
      };
    }

    const response = await openai!.chat.completions.create({
      model: aiModel,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert resume writer. Generate a highly professional, fully-fleshed out resume in JSON format based on the user's prompt. 
          Use standard resume structure. Create realistic sounding companies and bullet points if they are not provided, tailored to the requested role.
          
          Return ONLY JSON matching this EXACT structure (excluding id, theme, lastModified which are handled by the client):
          {
            "title": "Resume Title",
            "targetRole": "The target job title",
            "summary": "A professional 3-4 sentence summary",
            "personalInfo": { "firstName": "John", "lastName": "Doe", "email": "email@example.com", "phone": "555-555-5555", "location": "City, State" },
            "experience": [
              {
                "id": "gen-exp-1",
                "role": "Job Title",
                "company": "Company Name",
                "location": "City, State",
                "startDate": "YYYY-MM",
                "endDate": "YYYY-MM or Present",
                "current": boolean,
                "description": "- Bullet point 1\\n- Bullet point 2\\n- Bullet point 3"
              }
            ],
            "education": [
              {
                "id": "gen-edu-1",
                "institution": "School Name",
                "degree": "Degree (e.g. BS)",
                "fieldOfStudy": "Field of Study",
                "startDate": "YYYY-MM",
                "endDate": "YYYY-MM",
                "current": boolean
              }
            ],
            "skills": [
              {
                "id": "gen-skill-1",
                "name": "Skill Name",
                "category": "Hard"
              }
            ]
          }`
        },
        {
          role: 'user',
          content: `Generate a resume based on this description:\n\n${prompt}`
        }
      ],
      temperature: 0.7
    });

    const parsed = JSON.parse(response.choices[0].message.content || '{}');
    return parsed as Partial<Resume>;
  }
}
