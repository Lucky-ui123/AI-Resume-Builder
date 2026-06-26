'use server'

import { saveResume, saveResumeVersion, getResumeVersions, getResumeVersionData } from '@/lib/db-service';
import { Resume } from '@/types';
import { revalidatePath } from 'next/cache';

export async function saveResumeAction(resume: Resume) {
  const result = await saveResume(resume);
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/builder');
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
