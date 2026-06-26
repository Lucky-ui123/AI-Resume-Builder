export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  targetRole: string;
  templateId: string;
  lastModified: string;
  personalInfo: PersonalInfo;
  summary: string;
  experience: WorkExperience[];
  education: Education[];
  skills: Skill[];
  projects: Project[];
  certifications: Certification[];
  languages?: Language[];
  awards?: Award[];
  customSections?: CustomSection[];
}

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  current: boolean;
  score?: string;
}

export interface Skill {
  id: string;
  name: string;
  category: 'Hard' | 'Soft' | 'Tools' | 'Languages';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  url?: string;
  startDate?: string;
  endDate?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url?: string;
}

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  description: string;
  keywords: string[];
}

export interface AtsReport {
  id: string;
  resumeId: string;
  jobDescriptionId?: string;
  overallScore: number;
  keywordScore: number;
  formattingScore: number;
  readabilityScore: number;
  completenessScore: number;
  missingKeywords: string[];
  suggestions: AtsSuggestion[];
}

export interface AtsSuggestion {
  id: string;
  priority: 'High' | 'Medium' | 'Low';
  message: string;
  section: string;
}

export interface AiSuggestion {
  id: string;
  section: string;
  originalText: string;
  improvedText: string;
}

export interface CoverLetter {
  id: string;
  resumeId: string;
  jobDescriptionId: string;
  content: string;
  lastModified: string;
}

export interface Template {
  id: string;
  name: string;
  thumbnail: string;
  isPremium: boolean;
}

export interface Language {
  id: string;
  name: string;
  proficiency?: string;
}

export interface Award {
  id: string;
  title: string;
  issuer?: string;
  date?: string;
  description?: string;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: CustomSectionItem[];
}
