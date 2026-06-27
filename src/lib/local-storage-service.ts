/**
 * local-storage-service.ts
 *
 * Client-side only. Provides a full CRUD layer for Resume objects stored in
 * localStorage. This module must only be imported in client contexts (components,
 * browser-side hooks). It is safe to import dynamically from server files using
 * dynamic `import()` inside conditional branches that never run on the server.
 *
 * Storage layout:
 *   localStorage['hirecraft_resumes'] = JSON.stringify(Resume[])
 *
 * IDs:
 *   New resumes get an ID like "ls_<randomhex>" so server code can detect
 *   localStorage-backed resumes by checking id.startsWith('ls_').
 */

import { Resume } from '@/types';

const STORAGE_KEY = 'hirecraft_resumes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateLocalId(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `ls_${hex}`;
}

function readAll(): Resume[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(resumes: Resume[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Upsert a resume into localStorage. If `resume.id` is falsy or 'new',
 * a new `ls_` ID is generated and the resume is inserted. Otherwise the
 * existing entry is replaced in-place.
 *
 * Returns { id, error }
 */
export function lsSaveResume(
  resume: Resume
): { id: string; error: string | null } {
  try {
    const all = readAll();
    const isNew = !resume.id || resume.id === 'new';

    if (isNew) {
      const newId = generateLocalId();
      const newResume: Resume = {
        ...resume,
        id: newId,
        lastModified: new Date().toISOString(),
      };
      writeAll([newResume, ...all]);
      return { id: newId, error: null };
    }

    // Update existing
    const idx = all.findIndex((r) => r.id === resume.id);
    const updated: Resume = { ...resume, lastModified: new Date().toISOString() };
    if (idx >= 0) {
      all[idx] = updated;
    } else {
      // Not found — insert (e.g. if localStorage was cleared mid-session)
      all.unshift(updated);
    }
    writeAll(all);
    return { id: resume.id, error: null };
  } catch (err) {
    return { id: '', error: String(err) };
  }
}

/**
 * Retrieve a single resume by ID. Returns null if not found.
 */
export function lsGetResume(id: string): Resume | null {
  if (!id) return null;
  const all = readAll();
  return all.find((r) => r.id === id) ?? null;
}

/**
 * Return all locally stored resumes, sorted newest-first by lastModified.
 */
export function lsGetAllResumes(): Resume[] {
  return readAll().sort(
    (a, b) =>
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
  );
}

/**
 * Delete a resume by ID. Returns { error }.
 */
export function lsDeleteResume(id: string): { error: string | null } {
  try {
    const filtered = readAll().filter((r) => r.id !== id);
    writeAll(filtered);
    // Also clean up any draft buffer
    localStorage.removeItem(`hirecraft_draft_${id}`);
    return { error: null };
  } catch (err) {
    return { error: String(err) };
  }
}

/**
 * Rename a resume by ID.
 */
export function lsRenameResume(
  id: string,
  newTitle: string
): { error: string | null } {
  try {
    const all = readAll();
    const idx = all.findIndex((r) => r.id === id);
    if (idx < 0) return { error: 'Resume not found' };
    all[idx] = { ...all[idx], title: newTitle, lastModified: new Date().toISOString() };
    writeAll(all);
    return { error: null };
  } catch (err) {
    return { error: String(err) };
  }
}

/**
 * Duplicate a resume, assigning a new ls_ ID and appending " (Copy)" to
 * the title. Returns { newId, error }.
 */
export function lsDuplicateResume(id: string): {
  newId: string | null;
  error: string | null;
} {
  try {
    const all = readAll();
    const original = all.find((r) => r.id === id);
    if (!original) return { newId: null, error: 'Resume not found' };
    const newId = generateLocalId();
    const copy: Resume = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      lastModified: new Date().toISOString(),
    };
    writeAll([copy, ...all]);
    return { newId, error: null };
  } catch (err) {
    return { newId: null, error: String(err) };
  }
}

/**
 * Returns true if the given ID belongs to a localStorage-backed resume.
 */
export function isLocalId(id: string): boolean {
  return typeof id === 'string' && id.startsWith('ls_');
}

// ---------------------------------------------------------------------------
// Match Reports Local Storage Operations
// ---------------------------------------------------------------------------
const MATCH_KEY = 'hirecraft_match_reports';

export function lsSaveMatchReport(report: Omit<MatchReport, 'id' | 'created_at'> & { id?: string }): MatchReport {
  const reports = lsGetMatchReports();
  const id = report.id || `mr_${Math.random().toString(36).substr(2, 9)}`;
  const newReport: MatchReport = {
    ...report,
    id,
    created_at: new Date().toISOString()
  };
  localStorage.setItem(MATCH_KEY, JSON.stringify([newReport, ...reports]));
  return newReport;
}

export function lsGetMatchReports(): MatchReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(MATCH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function lsDeleteMatchReport(id: string): { error: string | null } {
  try {
    const reports = lsGetMatchReports().filter(r => r.id !== id);
    localStorage.setItem(MATCH_KEY, JSON.stringify(reports));
    return { error: null };
  } catch (e) {
    return { error: String(e) };
  }
}

// ---------------------------------------------------------------------------
// ATS Reports Local Storage Operations
// ---------------------------------------------------------------------------
const ATS_KEY = 'hirecraft_ats_reports';

export function lsSaveAtsReport(report: Omit<AtsReport, 'id' | 'created_at'> & { id?: string }): AtsReport {
  const reports = lsGetAtsReports();
  const id = report.id || `ats_${Math.random().toString(36).substr(2, 9)}`;
  const newReport: AtsReport = {
    ...report,
    id,
    created_at: new Date().toISOString()
  };
  localStorage.setItem(ATS_KEY, JSON.stringify([newReport, ...reports]));
  return newReport;
}

export function lsGetAtsReports(): AtsReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ATS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function lsDeleteAtsReport(id: string): { error: string | null } {
  try {
    const reports = lsGetAtsReports().filter(r => r.id !== id);
    localStorage.setItem(ATS_KEY, JSON.stringify(reports));
    return { error: null };
  } catch (e) {
    return { error: String(e) };
  }
}

// ---------------------------------------------------------------------------
// Cover Letters Local Storage Operations
// ---------------------------------------------------------------------------
const LETTER_KEY = 'hirecraft_cover_letters';

export function lsSaveCoverLetter(letter: CoverLetter): CoverLetter {
  const letters = lsGetCoverLetters();
  const isNew = !letter.id || letter.id === 'new';
  const id = isNew ? `cl_${Math.random().toString(36).substr(2, 9)}` : letter.id;
  const updatedLetter: CoverLetter = {
    ...letter,
    id,
    lastModified: new Date().toISOString()
  };
  
  if (isNew) {
    localStorage.setItem(LETTER_KEY, JSON.stringify([updatedLetter, ...letters]));
  } else {
    const idx = letters.findIndex(l => l.id === letter.id);
    if (idx >= 0) {
      letters[idx] = updatedLetter;
    } else {
      letters.unshift(updatedLetter);
    }
    localStorage.setItem(LETTER_KEY, JSON.stringify(letters));
  }
  return updatedLetter;
}

export function lsGetCoverLetters(): CoverLetter[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LETTER_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function lsDeleteCoverLetter(id: string): { error: string | null } {
  try {
    const letters = lsGetCoverLetters().filter(l => l.id !== id);
    localStorage.setItem(LETTER_KEY, JSON.stringify(letters));
    return { error: null };
  } catch (e) {
    return { error: String(e) };
  }
}

export function lsRenameCoverLetter(id: string, newTitle: string): { error: string | null } {
  try {
    const letters = lsGetCoverLetters();
    const idx = letters.findIndex(l => l.id === id);
    if (idx < 0) return { error: 'Cover letter not found' };
    letters[idx] = { ...letters[idx], title: newTitle, lastModified: new Date().toISOString() };
    localStorage.setItem(LETTER_KEY, JSON.stringify(letters));
    return { error: null };
  } catch (e) {
    return { error: String(e) };
  }
}

export function lsDuplicateCoverLetter(id: string): { newId: string | null; error: string | null } {
  try {
    const letters = lsGetCoverLetters();
    const original = letters.find(l => l.id === id);
    if (!original) return { newId: null, error: 'Cover letter not found' };
    const newId = `cl_${Math.random().toString(36).substr(2, 9)}`;
    const copy: CoverLetter = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
      lastModified: new Date().toISOString()
    };
    localStorage.setItem(LETTER_KEY, JSON.stringify([copy, ...letters]));
    return { newId, error: null };
  } catch (e) {
    return { newId: null, error: String(e) };
  }
}

// ---------------------------------------------------------------------------
// Resume Suggestions Local Storage Operations
// ---------------------------------------------------------------------------
const SUGGESTIONS_KEY = 'hirecraft_suggestions';

export function lsSaveSuggestions(resumeId: string, suggestions: ResumeSuggestion[]): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SUGGESTIONS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[resumeId] = suggestions;
    localStorage.setItem(SUGGESTIONS_KEY, JSON.stringify(all));
  } catch (e) {
    console.error(e);
  }
}

export function lsGetSuggestions(resumeId: string): ResumeSuggestion[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SUGGESTIONS_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[resumeId] || [];
  } catch {
    return [];
  }
}
