export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  headingColor?: string;
  bodyColor?: string;
  linkColor?: string;
  dividerColor?: string;
  backgroundColor?: string;
  
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  spacing: 'compact' | 'normal' | 'relaxed';
  
  fontSizeHeading?: number;
  fontSizeBody?: number;
  fontSizeName?: number;
  fontWeightBody?: string;
  lineHeight?: number;
  letterSpacing?: number;
  
  sectionStyle?: 'minimal' | 'modern' | 'classic' | 'executive' | 'creative';
  headingStyle?: 'style1' | 'style2' | 'style3' | 'style4' | 'style5';
  dividerStyle?: 'solid' | 'double' | 'dotted' | 'dashed' | 'none';
  
  density?: 'compact' | 'normal' | 'comfortable';
  sectionSpacing?: number;
  contentPadding?: number;
  pageMargin?: 'narrow' | 'normal' | 'wide' | 'custom';
  borderRadius?: number;
  
  iconsEnabled?: boolean;
  iconStyle?: 'outline' | 'filled' | 'minimal';
  
  photoEnabled?: boolean;
  photoShape?: 'circle' | 'rounded-square' | 'square';
  photoSize?: 'small' | 'medium' | 'large';
  photoPosition?: 'left' | 'center' | 'right';
  
  paperSize?: 'a4' | 'letter' | 'legal';
  orientation?: 'portrait' | 'landscape';
}

export interface Resume {
  id: string;
  userId: string;
  title: string;
  targetRole: string;
  templateId: string;
  theme?: ThemeConfig;
  lastModified: string;
  expiresAt?: string;
  isDraft?: boolean;
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

export interface MatchReport {
  id: string;
  resumeId: string;
  resumeTitle: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  matchScore: number;
  skillsMatch: {
    matched: string[];
    missing: string[];
  };
  keywords: {
    matched: string[];
    missing: string[];
  };
  experienceMatch: string;
  educationMatch: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  created_at: string;
}

export interface AtsReport {
  id: string;
  resumeId: string;
  resumeTitle: string;
  overallScore: number;
  contactInfoScore: number;
  structureScore: number;
  keywordScore: number;
  readabilityScore: number;
  formattingScore: number;
  completenessScore: number;
  missingKeywords: string[];
  suggestions: AtsSuggestion[];
  created_at: string;
}

export interface AtsSuggestion {
  id: string;
  priority: 'High' | 'Medium' | 'Low';
  message: string;
  section: string;
}

export interface ResumeScores {
  overall: number;
  ats: number;
  writing: number;
  content: number;
  keyword: number;
  experience: number;
}

export interface ResumeSuggestion {
  id: string;
  title: string;
  description: string;
  reason: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  category: 'Content' | 'ATS' | 'Grammar' | 'Formatting' | string;
  impact: 'High' | 'Medium' | 'Low';
  targetField: string; // e.g. "summary", "experience[0].description"
  currentText: string;
  suggestedText: string;
}

export interface CoverLetter {
  id: string;
  title: string;
  resumeId: string;
  jobTitle: string;
  companyName: string;
  jobDescription: string;
  hiringManager?: string;
  tone: string;
  length: string;
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
