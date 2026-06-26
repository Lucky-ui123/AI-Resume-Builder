export type TemplateCategory = 
  | 'All' 
  | 'ATS Friendly' 
  | 'Professional' 
  | 'Modern' 
  | 'Creative' 
  | 'Minimal';

export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory[];
  thumbnail: string;
  isPremium: boolean;
  atsScore: number;
  popular?: boolean;
}

export const templates: ResumeTemplate[] = [
  {
    id: 'classic-ats',
    name: 'Classic ATS',
    description: 'A traditional, single-column layout optimized for Applicant Tracking Systems.',
    category: ['All', 'ATS Friendly', 'Professional'],
    thumbnail: '/templates/classic-ats.png',
    isPremium: false,
    atsScore: 98,
    popular: true,
  },
  {
    id: 'modern-professional',
    name: 'Modern Professional',
    description: 'Clean and contemporary design with a touch of color for modern industries.',
    category: ['All', 'Professional', 'Modern'],
    thumbnail: '/templates/modern.png',
    isPremium: false,
    atsScore: 92,
  },
  {
    id: 'product-designer',
    name: 'Designer Portfolio',
    description: 'A two-column layout highlighting skills and a modern dark-mode header.',
    category: ['All', 'Creative', 'Modern'],
    thumbnail: '/templates/designer.png',
    isPremium: false,
    atsScore: 85,
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Elegant serif typography focused on impactful achievements and leadership.',
    category: ['All', 'Professional', 'Minimal'],
    thumbnail: '/templates/executive.png',
    isPremium: true,
    atsScore: 95,
  },
  {
    id: 'startup',
    name: 'Startup Hustle',
    description: 'Bold headers and high-contrast accents designed to stand out at tech startups.',
    category: ['All', 'Modern', 'Creative'],
    thumbnail: '/templates/startup.png',
    isPremium: false,
    atsScore: 88,
  }
];
