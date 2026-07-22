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
  atsFriendly: boolean;
  supportsPhoto: boolean;
  supportsSidebar: boolean;
  tags: string[];
  badge?: string;
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
    atsFriendly: true,
    supportsPhoto: false,
    supportsSidebar: false,
    tags: ['Traditional', 'Clean', 'ATS Optimal'],
  },
  {
    id: 'modern-professional',
    name: 'Modern Professional',
    description: 'Clean and contemporary design with a touch of color for modern industries.',
    category: ['All', 'Professional', 'Modern'],
    thumbnail: '/templates/modern.png',
    isPremium: false,
    atsScore: 92,
    atsFriendly: true,
    supportsPhoto: true,
    supportsSidebar: false,
    tags: ['Elegant', 'Grid Layout', 'Corporate'],
  },
  {
    id: 'product-designer',
    name: 'Designer Portfolio',
    description: 'A two-column layout highlighting skills and a modern dark-mode header.',
    category: ['All', 'Creative', 'Modern'],
    thumbnail: '/templates/designer.png',
    isPremium: false,
    atsScore: 85,
    atsFriendly: false,
    supportsPhoto: true,
    supportsSidebar: true,
    tags: ['Asymmetric', 'Skills Highlight', 'Creative'],
  },
  {
    id: 'executive',
    name: 'Executive',
    description: 'Elegant serif typography focused on impactful achievements and leadership.',
    category: ['All', 'Professional', 'Minimal'],
    thumbnail: '/templates/executive.png',
    isPremium: true,
    atsScore: 95,
    atsFriendly: true,
    supportsPhoto: false,
    supportsSidebar: true,
    tags: ['Leadership', 'Serif', 'Clean Line'],
    badge: 'Popular'
  },
  {
    id: 'startup',
    name: 'Startup Hustle',
    description: 'Bold headers and high-contrast accents designed to stand out at tech startups.',
    category: ['All', 'Modern', 'Creative'],
    thumbnail: '/templates/startup.png',
    isPremium: false,
    atsScore: 88,
    atsFriendly: true,
    supportsPhoto: true,
    supportsSidebar: true,
    tags: ['High Contrast', 'Tech', 'Startup'],
  },
  {
    id: 'nordic-minimal',
    name: 'Nordic Minimal',
    description: 'An ultra-clean Scandinavian aesthetic utilizing soft whitespace and subtle typography.',
    category: ['All', 'Minimal', 'Modern'],
    thumbnail: '/templates/nordic.png',
    isPremium: false,
    atsScore: 94,
    atsFriendly: true,
    supportsPhoto: false,
    supportsSidebar: false,
    tags: ['Whitespace', 'Minimalist', 'Spacious'],
    badge: 'New'
  },
  {
    id: 'silicon-valley',
    name: 'Silicon Valley',
    description: 'High-density, monospace layout focused on developers, algorithms, and deep tech.',
    category: ['All', 'ATS Friendly', 'Modern'],
    thumbnail: '/templates/tech.png',
    isPremium: true,
    atsScore: 97,
    atsFriendly: true,
    supportsPhoto: false,
    supportsSidebar: false,
    tags: ['Tech Stack', 'Monospace', 'High Density'],
    badge: 'New'
  },
  {
    id: 'harvard-academic',
    name: 'Harvard Academic',
    description: 'Traditional centered layout perfect for research CVs, publications, and lecturing.',
    category: ['All', 'Professional', 'Minimal'],
    thumbnail: '/templates/academic.png',
    isPremium: false,
    atsScore: 96,
    atsFriendly: true,
    supportsPhoto: false,
    supportsSidebar: false,
    tags: ['Formal', 'Classic CV', 'Publications'],
    badge: 'New'
  },
  {
    id: 'creative-sidebar',
    name: 'Creative Sidebar',
    description: 'Bold asymmetric layout featuring a colored left sidebar and clean timeline nodes.',
    category: ['All', 'Creative', 'Modern'],
    thumbnail: '/templates/creative-sidebar.png',
    isPremium: true,
    atsScore: 82,
    atsFriendly: false,
    supportsPhoto: true,
    supportsSidebar: true,
    tags: ['Colored Sidebar', 'Bold', 'Timeline'],
    badge: 'New'
  },
  {
    id: 'timeline-modern',
    name: 'Timeline Modern',
    description: 'Visual chronological layout mapping career progression along a clean vertical axis.',
    category: ['All', 'Modern', 'Professional'],
    thumbnail: '/templates/timeline.png',
    isPremium: true,
    atsScore: 90,
    atsFriendly: true,
    supportsPhoto: false,
    supportsSidebar: false,
    tags: ['Chronological', 'Design Flow', 'Modern'],
    badge: 'New'
  }
];
