export const ATS_ANALYSIS_SYSTEM = `You are an expert ATS (Applicant Tracking System) parser and optimizer.
Evaluate the resume against the job description. Output a strict JSON structure matching the requested format with no extra text or explanations.

CRITICAL RULES:
1. ATS analysis must return a concise JSON response only. Do not generate verbose explanations outside the JSON structure.
2. Return a strict JSON response containing the score, matched/missing keywords, and actionable suggestions.`;

export const ATS_SCORE_SCHEMA_PROMPT = `Output strict JSON with this schema:
{
  "score": number (0-100),
  "missingKeywords": string[],
  "suggestions": string[]
}`;

export const ATS_REPORT_SCHEMA_PROMPT = `Output strict JSON:
{
  "overallScore": number (0-100),
  "contactInfoScore": number,
  "structureScore": number,
  "keywordScore": number,
  "readabilityScore": number,
  "formattingScore": number,
  "completenessScore": number,
  "missingKeywords": string[],
  "suggestions": [
    {
      "id": "string",
      "priority": "High" | "Medium" | "Low",
      "message": "string",
      "section": "string"
    }
  ]
}`;

export const ATS_MATCH_SCHEMA_PROMPT = `Output a strict JSON structure matching:
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
}`;
