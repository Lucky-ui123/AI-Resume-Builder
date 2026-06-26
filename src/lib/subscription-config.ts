export type PlanType = 'free' | 'pro' | 'premium';

export interface PlanLimits {
  resumes: number;
  aiActionsPerMonth: number;
  exportsPerMonth: number;
  hasAdvancedTemplates: boolean;
  hasCoverLetter: boolean;
  hasLinkedin: boolean;
  hasPriorityFeatures: boolean;
}

export const SUBSCRIPTION_PLANS: Record<PlanType, PlanLimits> = {
  free: {
    resumes: 1,
    aiActionsPerMonth: 50,
    exportsPerMonth: 1,
    hasAdvancedTemplates: false,
    hasCoverLetter: false,
    hasLinkedin: false,
    hasPriorityFeatures: false,
  },
  pro: {
    resumes: 10,
    aiActionsPerMonth: 100,
    exportsPerMonth: Infinity,
    hasAdvancedTemplates: true,
    hasCoverLetter: true,
    hasLinkedin: true,
    hasPriorityFeatures: false,
  },
  premium: {
    resumes: Infinity,
    aiActionsPerMonth: Infinity,
    exportsPerMonth: Infinity,
    hasAdvancedTemplates: true,
    hasCoverLetter: true,
    hasLinkedin: true,
    hasPriorityFeatures: true,
  }
};
