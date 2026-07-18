'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Resume } from '@/types';
import { 
  saveResumeAction, 
  createResumeAction 
} from '@/app/dashboard/builder/actions';
import { 
  deleteResumeAction, 
  renameResumeAction, 
  duplicateResumeAction 
} from '@/app/dashboard/resumes/actions';

interface ResumeContextType {
  resumes: Resume[];
  isLoading: boolean;
  refreshResumes: () => Promise<void>;
  saveResume: (resume: Resume) => Promise<{ id: string; error: string | null }>;
  deleteResume: (id: string) => Promise<{ error: string | null }>;
  renameResume: (id: string, newTitle: string) => Promise<{ error: string | null }>;
  duplicateResume: (id: string) => Promise<{ newId: string | null; error: string | null }>;
  createResume: (title: string, targetRole: string) => Promise<{ id: string; error: string | null }>;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export function useResumes() {
  const context = useContext(ResumeContext);
  if (!context) {
    throw new Error('useResumes must be used within a ResumeProvider');
  }
  return context;
}

export function ResumeProvider({ children }: { children: React.ReactNode }) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isSupabase = useCallback(() => {
    return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }, []);

  const fetchResumesData = useCallback(async () => {
    let serverResumes: Resume[] = [];
    if (isSupabase()) {
      const response = await fetch('/api/resumes-api'); // Fallback or fetch from a client endpoint if needed
      if (response.ok) {
        const data = await response.json();
        serverResumes = data.resumes || [];
      }
    }
    
    const { lsGetAllResumes, lsDeleteResume } = await import('@/lib/local-storage-service');
    const localResumes = lsGetAllResumes();
    
    const now = new Date();
    const validLocalResumes = localResumes.filter(r => {
      if (r.expiresAt && new Date(r.expiresAt) < now) {
        lsDeleteResume(r.id);
        return false;
      }
      return true;
    });
    
    const existingIds = new Set(serverResumes.map(r => r.id));
    const filteredLocal = validLocalResumes.filter(r => !existingIds.has(r.id));
    
    return [...serverResumes, ...filteredLocal].sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  }, [isSupabase]);

  const refreshResumes = useCallback(async () => {
    setIsLoading(true);
    try {
      const merged = await fetchResumesData();
      setResumes(merged);
    } catch (e) {
      console.error('Failed to load resumes:', e);
    } finally {
      setIsLoading(false);
    }
  }, [fetchResumesData]);

  // Load initially
  useEffect(() => {
    let ignore = false;

    // Prune localStorage drafts older than 7 days
    try {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('hirecraft_draft_')) {
          const draftStr = localStorage.getItem(key);
          if (draftStr) {
            const draft = JSON.parse(draftStr);
            if (draft && draft.lastModified) {
              const lastModifiedTime = new Date(draft.lastModified).getTime();
              if (lastModifiedTime < sevenDaysAgo) {
                localStorage.removeItem(key);
                i--; // Adjust index because key was removed
              }
            }
          }
        }
      }
    } catch (e) {
      console.error('Error cleaning up local drafts:', e);
    }

    fetchResumesData().then(merged => {
      if (!ignore) {
        setResumes(merged);
        setIsLoading(false);
      }
    }).catch(e => {
      if (!ignore) {
        console.error('Failed to load resumes:', e);
        setIsLoading(false);
      }
    });
    return () => { ignore = true; };
  }, [fetchResumesData]);

  const saveResume = async (resume: Resume) => {
    let id = '';
    let error: string | null = null;
    const isNew = !resume.id || resume.id === 'new';

    if (isSupabase()) {
      const res = await saveResumeAction(resume);
      id = res.id;
      error = res.error;
    } else {
      const { lsSaveResume } = await import('@/lib/local-storage-service');
      const res = lsSaveResume(resume);
      id = res.id;
      error = res.error;
    }

    if (!error && id) {
      const updatedResume = { ...resume, id, lastModified: new Date().toISOString() };
      setResumes(prev => {
        const idx = prev.findIndex(r => r.id === (isNew ? 'new' : resume.id));
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedResume;
          return next.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
        }
        return [updatedResume, ...prev].sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
      });
    }
    return { id, error };
  };

  const deleteResume = async (id: string) => {
    let error: string | null = null;

    if (id.startsWith('ls_')) {
      const { lsDeleteResume } = await import('@/lib/local-storage-service');
      const res = lsDeleteResume(id);
      error = res.error;
    } else {
      const res = await deleteResumeAction(id);
      error = res?.error ?? null;
    }

    if (!error) {
      setResumes(prev => prev.filter(r => r.id !== id));
    }
    return { error };
  };

  const renameResume = async (id: string, newTitle: string) => {
    let error: string | null = null;

    if (id.startsWith('ls_')) {
      const { lsRenameResume } = await import('@/lib/local-storage-service');
      const res = lsRenameResume(id, newTitle);
      error = res.error;
    } else {
      const res = await renameResumeAction(id, newTitle);
      error = res?.error ?? null;
    }

    if (!error) {
      setResumes(prev => prev.map(r => r.id === id ? { ...r, title: newTitle, lastModified: new Date().toISOString() } : r));
    }
    return { error };
  };

  const duplicateResume = async (id: string) => {
    let newId: string | null = null;
    let error: string | null = null;

    if (id.startsWith('ls_')) {
      const { lsDuplicateResume } = await import('@/lib/local-storage-service');
      const res = lsDuplicateResume(id);
      newId = res.newId;
      error = res.error;
    } else {
      const res = await duplicateResumeAction(id);
      newId = res?.newId ?? null;
      error = res?.error ?? null;
    }

    if (!error && newId) {
      refreshResumes();
    }
    return { newId, error };
  };

  const createResume = async (title: string, targetRole: string) => {
    let id = '';
    let error: string | null = null;

    const emptyResume = {
      id: '',
      userId: '',
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
      awards: [],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    } as unknown as Resume;

    if (isSupabase()) {
      const res = await createResumeAction(title, targetRole);
      id = res.id;
      error = res.error;
    } else {
      const { lsSaveResume } = await import('@/lib/local-storage-service');
      const res = lsSaveResume(emptyResume as Resume);
      id = res.id;
      error = res.error;
    }

    if (!error && id) {
      refreshResumes();
    }
    return { id, error };
  };

  return (
    <ResumeContext.Provider value={{
      resumes,
      isLoading,
      refreshResumes,
      saveResume,
      deleteResume,
      renameResume,
      duplicateResume,
      createResume
    }}>
      {children}
    </ResumeContext.Provider>
  );
}
