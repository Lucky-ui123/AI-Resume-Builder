'use server';

import { 
  saveMatchReport, 
  getMatchReports, 
  deleteMatchReport,
  saveAtsReport,
  getAtsReports,
  deleteAtsReport,
  saveCoverLetter,
  getCoverLetters,
  deleteCoverLetter,
  renameCoverLetter,
  duplicateCoverLetter,
  saveSuggestions,
  getSuggestions
} from '@/lib/db-service';
import { revalidatePath } from 'next/cache';
import { MatchReport, AtsReport, CoverLetter, ResumeSuggestion } from '@/types';

export async function saveMatchReportAction(report: MatchReport) {
  const result = await saveMatchReport(report);
  revalidatePath('/dashboard');
  return result;
}

export async function getMatchReportsAction() {
  return await getMatchReports();
}

export async function deleteMatchReportAction(id: string) {
  const result = await deleteMatchReport(id);
  revalidatePath('/dashboard');
  return result;
}

export async function saveAtsReportAction(report: AtsReport) {
  const result = await saveAtsReport(report);
  revalidatePath('/dashboard');
  return result;
}

export async function getAtsReportsAction() {
  return await getAtsReports();
}

export async function deleteAtsReportAction(id: string) {
  const result = await deleteAtsReport(id);
  revalidatePath('/dashboard');
  return result;
}

export async function saveCoverLetterAction(letter: CoverLetter) {
  const result = await saveCoverLetter(letter);
  revalidatePath('/dashboard');
  return result;
}

export async function getCoverLettersAction() {
  return await getCoverLetters();
}

export async function deleteCoverLetterAction(id: string) {
  const result = await deleteCoverLetter(id);
  revalidatePath('/dashboard');
  return result;
}

export async function renameCoverLetterAction(id: string, newTitle: string) {
  const result = await renameCoverLetter(id, newTitle);
  revalidatePath('/dashboard');
  return result;
}

export async function duplicateCoverLetterAction(id: string) {
  const result = await duplicateCoverLetter(id);
  revalidatePath('/dashboard');
  return result;
}

export async function saveSuggestionsAction(resumeId: string, suggestions: ResumeSuggestion[]) {
  return await saveSuggestions(resumeId, suggestions);
}

export async function getSuggestionsAction(resumeId: string) {
  return await getSuggestions(resumeId);
}

// AI Services Server Actions
import { JobMatcherService, ATSService, CoverLetterService, ResumeSuggestionService } from '@/lib/ai-career-services';
import { Resume } from '@/types';

export async function analyzeMatchAction(resume: Resume, jobDescription: string) {
  return await JobMatcherService.analyzeMatch(resume, jobDescription);
}

export async function analyzeAtsAction(resume: Resume) {
  return await ATSService.analyzeResume(resume);
}

export async function generateCoverLetterAiAction(params: {
  resume: Resume;
  jobDescription: string;
  companyName: string;
  hiringManager?: string;
  tone: string;
  length: string;
}) {
  return await CoverLetterService.generateLetter(params);
}

export async function rewriteCoverLetterAiAction(content: string, instruction: string) {
  return await CoverLetterService.rewriteLetter(content, instruction);
}

export async function generateSuggestionsAction(resume: Resume) {
  return await ResumeSuggestionService.generateSuggestions(resume);
}
