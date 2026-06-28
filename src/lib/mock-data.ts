import { Resume, User, JobDescription, AtsReport, CoverLetter } from '@/types';

export const mockUser: User = {
  id: 'usr_123',
  name: 'Alex Johnson',
  email: 'alex.j@example.com',
  avatarUrl: 'https://i.pravatar.cc/150?u=alex',
};

import { PlanType } from './subscription-config';

export const mockSubscription = {
  plan: 'pro' as PlanType,
  aiUsageCount: 0,
  exportUsageCount: 0,
};

export const mockResume: Resume = {
  id: 'res_123',
  userId: 'usr_123',
  title: 'Senior Frontend Developer Resume',
  targetRole: 'Senior Frontend Developer',
  templateId: 'modern-professional',
  theme: {
    primaryColor: '#0f172a',
    fontFamily: 'Inter, sans-serif',
    fontSize: 'medium',
    spacing: 'normal',
  },
  lastModified: new Date().toISOString(),
  personalInfo: {
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.j@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexj',
    github: 'github.com/alexj',
    website: 'alexj.dev',
  },
  summary: 'Detail-oriented Senior Frontend Developer with 6+ years of experience building scalable web applications using React, Next.js, and TypeScript. Passionate about performance optimization and creating intuitive user experiences.',
  experience: [
    {
      id: 'exp_1',
      company: 'TechFlow Solutions',
      role: 'Senior Frontend Developer',
      startDate: '2021-03',
      endDate: '',
      current: true,
      location: 'San Francisco, CA',
      description: '• Led a team of 4 developers to rebuild the core SaaS platform using Next.js and Tailwind CSS, resulting in a 40% improvement in load times.\n• Implemented complex state management using Zustand and React Query.\n• Mentored junior developers and established code review guidelines.',
    },
    {
      id: 'exp_2',
      company: 'WebSphere Inc.',
      role: 'Frontend Developer',
      startDate: '2018-06',
      endDate: '2021-02',
      current: false,
      location: 'Remote',
      description: '• Developed interactive dashboard components using React and D3.js.\n• Integrated RESTful APIs and optimized front-end performance.\n• Collaborated closely with UX designers to implement responsive designs.',
    },
  ],
  education: [
    {
      id: 'edu_1',
      institution: 'University of California, Berkeley',
      degree: 'Bachelor of Science',
      fieldOfStudy: 'Computer Science',
      startDate: '2014-08',
      endDate: '2018-05',
      current: false,
      score: '3.8 GPA',
    },
  ],
  skills: [
    { id: 'sk_1', name: 'JavaScript', category: 'Languages' },
    { id: 'sk_2', name: 'TypeScript', category: 'Languages' },
    { id: 'sk_3', name: 'React', category: 'Hard' },
    { id: 'sk_4', name: 'Next.js', category: 'Hard' },
    { id: 'sk_5', name: 'Tailwind CSS', category: 'Tools' },
    { id: 'sk_6', name: 'Node.js', category: 'Hard' },
    { id: 'sk_7', name: 'Team Leadership', category: 'Soft' },
  ],
  projects: [
    {
      id: 'prj_1',
      name: 'E-commerce Storefront',
      description: 'Built a headless e-commerce storefront using Next.js, Shopify Storefront API, and Stripe.',
      url: 'github.com/alexj/storefront',
    },
  ],
  certifications: [
    {
      id: 'cert_1',
      name: 'AWS Certified Developer - Associate',
      issuer: 'Amazon Web Services',
      date: '2022-11',
    },
  ],
  languages: [
    { id: 'lang_1', name: 'English', proficiency: 'Professional' },
    { id: 'lang_2', name: 'Spanish', proficiency: 'Intermediate' },
  ],
  awards: [
    { id: 'awd_1', title: 'Employee of the Year', issuer: 'TechFlow Solutions', date: '2022-12', description: 'Awarded for leading the SaaS platform rewrite.' }
  ],
  customSections: [
    {
      id: 'cs_1',
      title: 'Publications',
      items: [
        { id: 'csi_1', title: 'Modern State Management', subtitle: 'Frontend Weekly', date: '2021-08', description: 'An article comparing Zustand with Redux.' }
      ]
    }
  ]
};

export const mockJobDescription: JobDescription = {
  id: 'jd_123',
  title: 'Lead React Developer',
  company: 'InnovateTech',
  description: 'We are looking for a Lead React Developer to join our core product team. You will be responsible for architecting and building out new features using React, Next.js, and TypeScript. The ideal candidate has strong experience with state management, performance optimization, and unit testing (Jest/Cypress). Experience with cloud deployment on AWS or Vercel is a plus.',
  keywords: ['React', 'Next.js', 'TypeScript', 'State Management', 'Performance Optimization', 'Jest', 'Cypress', 'AWS', 'Vercel'],
};

export const mockAtsReport: AtsReport = {
  id: 'ats_123',
  resumeId: 'res_123',
  resumeTitle: 'Senior Frontend Developer Resume',
  overallScore: 82,
  contactInfoScore: 85,
  structureScore: 90,
  keywordScore: 75,
  readabilityScore: 85,
  formattingScore: 90,
  completenessScore: 100,
  missingKeywords: ['Jest', 'Cypress', 'AWS', 'Vercel'],
  suggestions: [
    {
      id: 'sug_1',
      priority: 'High',
      message: 'Add testing frameworks (Jest, Cypress) to your skills section if you have experience with them.',
      section: 'Skills',
    },
    {
      id: 'sug_2',
      priority: 'Medium',
      message: 'Mention your AWS certification more prominently or tie it to a specific project.',
      section: 'Projects',
    },
  ],
  created_at: new Date().toISOString(),
};

export interface AiSuggestion {
  id: string;
  section: string;
  originalText: string;
  improvedText: string;
}

export const mockAiSuggestions: AiSuggestion[] = [
  {
    id: 'ai_1',
    section: 'Summary',
    originalText: 'Detail-oriented Senior Frontend Developer with 6+ years of experience building scalable web applications using React, Next.js, and TypeScript. Passionate about performance optimization and creating intuitive user experiences.',
    improvedText: 'Results-driven Senior Frontend Developer with 6+ years of expertise in architecting scalable applications using React, Next.js, and TypeScript. Proven track record of improving web performance by 40% and delivering intuitive, user-centric experiences in agile environments.',
  },
  {
    id: 'ai_2',
    section: 'Experience (TechFlow Solutions)',
    originalText: '• Led a team of 4 developers to rebuild the core SaaS platform using Next.js and Tailwind CSS, resulting in a 40% improvement in load times.',
    improvedText: '• Directed a 4-person engineering team to re-architect the flagship SaaS platform utilizing Next.js and Tailwind CSS, achieving a 40% reduction in page load times and boosting overall user retention.',
  }
];

export const mockCoverLetter: CoverLetter = {
  id: 'cl_123',
  resumeId: 'res_123',
  title: 'Cover Letter for InnovateTech',
  jobTitle: 'Lead React Developer',
  companyName: 'InnovateTech',
  jobDescription: 'We are looking for a Lead React Developer to join our core product team. You will be responsible for architecting and building out new features using React, Next.js, and TypeScript.',
  tone: 'Professional',
  length: 'Medium',
  content: `Dear Hiring Manager,\n\nI am writing to express my interest in the Lead React Developer position at InnovateTech. With over 6 years of experience building scalable web applications and leading frontend teams, I am confident in my ability to contribute effectively to your core product team.\n\nIn my current role at TechFlow Solutions, I led the successful rebuild of our core SaaS platform using Next.js and Tailwind CSS, which improved our load times by 40%. I noticed that InnovateTech values performance optimization and modern React architectures, which aligns perfectly with my recent work implementing complex state management solutions with Zustand and React Query.\n\nFurthermore, my AWS Certified Developer credential and experience mentoring junior developers position well to take on the technical and leadership responsibilities this role demands. I would welcome the opportunity to discuss how my technical skills and leadership experience can help drive InnovateTech's frontend initiatives forward.\n\nThank you for considering my application. I look forward to the possibility of speaking with you.\n\nSincerely,\nAlex Johnson`,
  lastModified: new Date().toISOString(),
};

export const mockResumes: Resume[] = [
  mockResume,
  {
    ...mockResume,
    id: 'res_456',
    title: 'Product Designer Resume',
    targetRole: 'Product Designer',
    templateId: 'product-designer',
    lastModified: new Date(Date.now() - 86400000).toISOString(),
  }
];

export const emptyResume: Resume = {
  id: '',
  userId: '',
  title: 'Untitled Resume',
  targetRole: '',
  templateId: 'classic-ats',
  theme: {
    primaryColor: '#0f172a',
    fontFamily: 'Inter, sans-serif',
    fontSize: 'medium',
    spacing: 'normal',
  },
  lastModified: new Date().toISOString(),
  personalInfo: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: ''
  },
  summary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  awards: [],
  customSections: []
};
