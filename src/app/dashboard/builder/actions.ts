'use server'

import { saveResume, saveResumeVersion, getResumeVersions, getResumeVersionData } from '@/lib/db-service';
import { Resume } from '@/types';
import { revalidatePath } from 'next/cache';

export async function saveResumeAction(resume: Resume) {
  const result = await saveResume(resume);
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/resumes');
  revalidatePath('/dashboard/builder');
  return result;
}

export async function createResumeAction(title: string, targetRole: string) {
  const emptyResume = {
    id: '',
    userId: '', // Populated by server
    title,
    targetRole,
    templateId: 'classic-ats',
    theme: {
      primaryColor: '#0f172a',
      fontFamily: 'Inter, sans-serif',
      fontSize: 'medium',
      spacing: 'normal',
    },
    lastModified: new Date().toISOString(),
    isDraft: true,
    personalInfo: { firstName: '', lastName: '', email: '', phone: '', location: '' },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    languages: [],
    awards: []
  };
  
  const result = await saveResume(emptyResume as Resume);
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/resumes');
  return result;
}

export async function saveResumeVersionAction(resumeId: string, name: string, content: Resume) {
  const result = await saveResumeVersion(resumeId, name, content);
  revalidatePath('/dashboard/builder');
  return result;
}

export async function getResumeVersionsAction(resumeId: string) {
  return await getResumeVersions(resumeId);
}

export async function getResumeVersionDataAction(versionId: string) {
  return await getResumeVersionData(versionId);
}
