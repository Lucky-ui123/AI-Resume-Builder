'use server'

import { 
  deleteResume, 
  renameResume, 
  duplicateResume, 
  deleteVersion, 
  restoreVersion 
} from '@/lib/db-service';
import { revalidatePath } from 'next/cache';

export async function deleteResumeAction(id: string) {
  const result = await deleteResume(id);
  revalidatePath('/dashboard/resumes');
  revalidatePath('/dashboard');
  return result;
}

export async function renameResumeAction(id: string, newTitle: string) {
  const result = await renameResume(id, newTitle);
  revalidatePath('/dashboard/resumes');
  return result;
}

export async function duplicateResumeAction(id: string) {
  const result = await duplicateResume(id);
  revalidatePath('/dashboard/resumes');
  return result;
}

export async function deleteVersionAction(versionId: string) {
  const result = await deleteVersion(versionId);
  revalidatePath('/dashboard/resumes');
  return result;
}

export async function restoreVersionAction(resumeId: string, versionId: string) {
  const result = await restoreVersion(resumeId, versionId);
  revalidatePath('/dashboard/resumes');
  return result;
}
