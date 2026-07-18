'use client';

import { useState, useEffect, useRef, useDeferredValue, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Eye, LayoutPanelLeft, Check, X, Loader2, History, FileEdit, Trash2, Plus, Palette, LayoutTemplate, AlertCircle, Download } from 'lucide-react';
import { emptyResume } from '@/lib/mock-data';
import { saveResumeVersionAction } from './actions';
import { Resume, Skill, ResumeSuggestion, ThemeConfig } from '@/types';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toast';
import { templates } from '@/lib/templates';
import { TemplateMiniPreview } from '@/components/resume/TemplateMiniPreview';
import { generatePDF } from '@/lib/export-utils';
import { generateSuggestionsAction } from '../career-actions';
import { useResumes } from '@/context/ResumeContext';
import { SuggestionsDashboard } from './SuggestionsDashboard';
import { ResumeScores } from '@/types';

type SaveState = 'clean' | 'editing' | 'saving' | 'saved' | 'error' | 'offline';

export default function BuilderClient({ 
  initialResume,
  userProfile
}: { 
  initialResume: Resume | null;
  userProfile?: { userName: string; userEmail: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { saveResume } = useResumes();

  const getStartingResume = () => {
    if (initialResume) return initialResume;
    
    const name = userProfile?.userName || '';
    const email = userProfile?.userEmail || '';
    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return {
      ...emptyResume,
      personalInfo: {
        ...emptyResume.personalInfo,
        firstName: firstName !== 'User' ? firstName : '',
        lastName: firstName !== 'User' ? lastName : '',
        email: email || ''
      }
    };
  };

  const [resume, setResume] = useState<Resume>(getStartingResume);
  const deferredResume = useDeferredValue(resume);
  const [showPreviewMobile, setShowPreviewMobile] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [suggestions, setSuggestions] = useState<ResumeSuggestion[]>([]);
  const [isAnalyzingSuggestions, setIsAnalyzingSuggestions] = useState(false);
  
  const [saveState, setSaveState] = useState<SaveState>('clean');
  const [hasUnsyncedChanges, setHasUnsyncedChanges] = useState(false);
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window !== 'undefined') {
      return navigator.onLine;
    }
    return true;
  });

  // AI Generation State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [scores, setScores] = useState<ResumeScores | undefined>(undefined);
  const [undoStack, setUndoStack] = useState<Record<string, string>>({});
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  // Debounced auto-scan
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!resume.id) return;
      setIsAnalyzingSuggestions(true);
      try {
        const data = await generateSuggestionsAction(resume);
        setScores(data.scores);
        setSuggestions(data.suggestions.filter(s => !dismissedSuggestions.has(s.id)));
      } catch (error) {
        console.error(error);
      } finally {
        setIsAnalyzingSuggestions(false);
      }
    }, 1500); // Wait 1.5s after typing stops
    return () => clearTimeout(handler);
  }, [resume, dismissedSuggestions]);

  const handleApplySuggestion = (sug: ResumeSuggestion) => {
    const updated = { ...resume };
    let previousText = '';
    
    if (sug.targetField === 'summary') {
      previousText = updated.summary || '';
      updated.summary = sug.suggestedText;
    } else if (sug.targetField === 'personalInfo.linkedin') {
      previousText = updated.personalInfo.linkedin || '';
      updated.personalInfo.linkedin = sug.suggestedText;
    } else if (sug.targetField === 'skills') {
      previousText = updated.skills?.map(s => typeof s === 'string' ? s : s.name).join(', ') || '';
      updated.skills = sug.suggestedText.split(',').map(s => ({ id: crypto.randomUUID(), name: s.trim(), category: 'Hard' as const }));
    } else if (sug.targetField.startsWith('experience[')) {
      const match = sug.targetField.match(/experience\[(\d+)\]\.description/);
      if (match && updated.experience) {
        const idx = parseInt(match[1]);
        if (updated.experience[idx]) {
          previousText = updated.experience[idx].description || '';
          updated.experience[idx].description = sug.suggestedText;
        }
      }
    }
    
    setUndoStack(prev => ({ ...prev, [sug.id]: previousText }));
    setResume(updated);
    showSuccess(`Applied suggestion!`);
  };

  const handleUndoSuggestion = (id: string) => {
    const sug = suggestions.find(s => s.id === id);
    if (!sug || undoStack[id] === undefined) return;
    
    const previousText = undoStack[id];
    const updated = { ...resume };
    
    if (sug.targetField === 'summary') {
      updated.summary = previousText;
    } else if (sug.targetField === 'personalInfo.linkedin') {
      updated.personalInfo.linkedin = previousText;
    } else if (sug.targetField === 'skills') {
      updated.skills = previousText.split(',').map(s => ({ id: crypto.randomUUID(), name: s.trim(), category: 'Hard' as const }));
    } else if (sug.targetField.startsWith('experience[')) {
      const match = sug.targetField.match(/experience\[(\d+)\]\.description/);
      if (match && updated.experience) {
        const idx = parseInt(match[1]);
        if (updated.experience[idx]) {
          updated.experience[idx].description = previousText;
        }
      }
    }
    
    setResume(updated);
    setUndoStack(prev => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
    showSuccess('Reverted suggestion');
  };

  const handleDismissSuggestion = (id: string) => {
    setDismissedSuggestions(prev => new Set(prev).add(id));
    setSuggestions(prev => prev.filter(s => s.id !== id));
  };
  
  const initialLoadDone = useRef(false);
  const latestState = useRef<{
    resume: Resume;
    saveState: SaveState;
    performSave?: (res: Resume) => Promise<{ id: string; error: string | null }>;
  }>({ resume, saveState });
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // On mount: restore the best available draft from localStorage.
  // - For a brand-new resume (no initialResume): automatically load the 'new' draft
  //   if one was saved previously, so the user never loses work.
  // - For an ls_-backed resume loaded via URL param: the server returned it via
  //   lsGetResume, so initialResume is already correct — just flag load done.
  // - For a Supabase resume that has a newer local draft: show the Restore banner
  //   so the user can choose (conflict resolution).
  useEffect(() => {
    if (!initialResume) {
      const idParam = searchParams.get('id');
      
      if (idParam && idParam !== 'new') {
        // If server returned null but we have an ls_ ID in URL, we need to load from localStorage
        if (idParam.startsWith('ls_')) {
          import('@/lib/local-storage-service').then(({ lsGetResume }) => {
            const loaded = lsGetResume(idParam);
            if (loaded) {
              setResume(loaded);
              setSaveState('saved');
            } else {
              // Not found, maybe deleted
              router.replace('/dashboard/resumes');
            }
            initialLoadDone.current = true;
          }).catch(console.error);
          return; // wait for import
        } else {
          // A Supabase ID was requested but the server returned null (e.g. deleted or unauthorized)
          router.replace('/dashboard/resumes');
          initialLoadDone.current = true;
          return;
        }
      }

      // New resume — check for an auto-saved 'new' draft and restore it silently.
      const draftStr = localStorage.getItem('hirecraft_draft_new');
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          if (draft && draft.title) {
            setTimeout(() => {
              setResume(draft);
              setSaveState('editing');
            }, 0);
            // Don't remove the draft yet; it will be cleared after the first
            // successful auto-save produces a real ID.
          }
        } catch (e) {
          console.error('Failed to restore new draft', e);
        }
      }
    } else {
      // Existing resume — check if there's a *different*, newer local draft
      // (can happen if the user made changes that failed to sync).
      const draftStr = localStorage.getItem(`hirecraft_draft_${initialResume.id}`);
      if (draftStr) {
        try {
          const draft = JSON.parse(draftStr);
          if (draft && draft.title) {
            setTimeout(() => {
              setHasUnsyncedChanges(true);
            }, 0);
          }
        } catch (e) {
          console.error('Failed to parse local draft', e);
        }
      }
    }

    initialLoadDone.current = true;
  }, [searchParams, initialResume, router]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (latestState.current.saveState === 'offline') {
        setSaveState('editing'); // Trigger a save on reconnect
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      if (latestState.current.saveState !== 'clean') {
        setSaveState('offline');
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const performSave = useCallback(async (res: Resume) => {
    return await saveResume(res);
  }, [saveResume]);

  useEffect(() => {
    latestState.current = { resume, saveState, performSave };
  }, [resume, saveState, performSave]);

  // Robust Unload Prevention
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const state = latestState.current.saveState;
      if (state === 'editing' || state === 'saving' || state === 'error' || state === 'offline') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Save when component unmounts for Next.js soft navigation
  useEffect(() => {
    return () => {
      const { resume: r, saveState: s, performSave: saveFn } = latestState.current;
      // Only attempt an unmount-save if there are unsaved changes and the
      // resume has a real persisted ID (not an empty/placeholder value).
      const hasRealId = r.id && r.id !== 'new';
      if ((s === 'editing' || s === 'error' || s === 'offline') && hasRealId && saveFn) {
        saveFn({ 
          ...r, 
          isDraft: r.isDraft !== false 
        }).catch(console.error);
      }
    };
  }, []);

  // Tracks whether the last resume state change was caused by an auto-save
  // assigning a new ID (not a user edit), to prevent re-triggering a save.
  const justAssignedIdRef = useRef(false);

  // Stores the JSON hash of the last successfully saved resume.
  // Used to detect whether the data has actually changed before triggering
  // a network save — this is the primary guard against the autosave loop.
  const lastSavedHash = useRef<string>('');

  useEffect(() => {
    if (!initialLoadDone.current) return;

    // Skip the save cycle if this change was triggered by assigning the real ID
    // after a successful auto-save (prevents save loop on new resumes).
    if (justAssignedIdRef.current) {
      justAssignedIdRef.current = false;
      return;
    }

    // Hash-guard: skip network save when resume data has not changed.
    // This prevents the autosave from re-firing after setSaveState / setResume
    // calls that flow back from the server response.
    const currentHash = JSON.stringify(resume);
    if (currentHash === lastSavedHash.current) {
      return;
    }

    // Transition to editing state unless we're already mid-save
    const currentSaveState = latestState.current.saveState;
    if (currentSaveState === 'clean' || currentSaveState === 'saved') {
      setTimeout(() => {
        setSaveState('editing');
      }, 0);
    }

    // Save locally immediately (offline-first)
    const draftKey = `hirecraft_draft_${resume.id || 'new'}`;
    try {
      localStorage.setItem(draftKey, JSON.stringify(resume));
    } catch (e) {
      console.error('Failed to save to localStorage, quota may be exceeded', e);
    }

    if (!isOnline) {
      setTimeout(() => {
        setSaveState('offline');
      }, 0);
      return;
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      setSaveState('saving');
      try {
        const isDraftStatus = resume.isDraft !== false;
        const { id, error } = await performSave({ ...resume, isDraft: isDraftStatus });
        if (!error && id) {
          // Record the hash BEFORE mutating resume state so the next
          // effect run sees the match and exits early.
          lastSavedHash.current = currentHash;

          const isNewResume = !resume.id || resume.id === 'new';
          if (isNewResume) {
            // Mark that the next resume state change is from ID assignment, not a user edit
            justAssignedIdRef.current = true;
            router.replace('/dashboard/builder?id=' + id);
            setResume(prev => ({ ...prev, id, isDraft: isDraftStatus }));
            localStorage.removeItem('hirecraft_draft_new');
          }
          setSaveState('saved');
          localStorage.removeItem(draftKey);
          setHasUnsyncedChanges(false);
        } else {
          setSaveState('error');
        }
      } catch (err) {
        console.error('Auto-save failed', err);
        setSaveState('error');
      }
    }, 1000);
    
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [resume, router, isOnline, performSave]);
  

  const handleSaveVersion = async () => {
    if (!resume.id || resume.id === 'res_123' || resume.id === 'new' || resume.id.startsWith('ls_')) return;
    setSaveState('saving');
    const loadingId = showLoading('Saving version...');
    try {
      const name = `Version ${new Date().toLocaleDateString()}`;
      await saveResumeVersionAction(resume.id, name, resume);
      dismissToast(loadingId);
      showSuccess('Version saved successfully');
      setSaveState('saved');
    } catch {
      dismissToast(loadingId);
      setSaveState('error');
      showError("Couldn't save version.");
    }
  };
  
  const handleExport = async () => {
    setIsExporting(true);
    const loadingId = showLoading('Exporting PDF...');
    
    try {
      // Check export limit
      const limitRes = await fetch('/api/export-limit', { method: 'POST' });
      if (!limitRes.ok) {
        if (limitRes.status === 403) {
          dismissToast(loadingId);
          showError('Export limit reached. Upgrade to Pro for unlimited exports.');
          setIsExporting(false);
          return;
        }
        throw new Error('Failed to check export limit');
      }

      const formatName = (name: string) => {
        if (!name) return '';
        const trimmed = name.trim();
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      };

      const firstName = formatName(resume.personalInfo.firstName) || 'Firstname';
      const lastName = formatName(resume.personalInfo.lastName) || 'Lastname';
      const filename = `${firstName}_${lastName}_Resume.pdf`;
      
      await generatePDF('resume-export-preview-hidden', filename);
      
      dismissToast(loadingId);
      showSuccess('PDF exported successfully!');
    } catch (err) {
      console.error('Export failed:', err);
      dismissToast(loadingId);
      showError('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  // AI States
  const [isImprovingSummary, setIsImprovingSummary] = useState(false);
  const [summarySuggestion, setSummarySuggestion] = useState<string | null>(null);
  const [improvingExpId, setImprovingExpId] = useState<string | null>(null);
  const [expSuggestions, setExpSuggestions] = useState<Record<string, string>>({});

  const handleImproveSummary = async () => {
    setIsImprovingSummary(true);
    const loadingId = showLoading('Generating AI content...');
    try {
      const res = await fetch('/api/ai/improve-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: resume.summary })
      });
      const data = await res.json();
      dismissToast(loadingId);
      if (data.result) {
        setSummarySuggestion(data.result);
        showSuccess('AI content generated successfully');
      } else {
        showError(data.error || "AI couldn't generate content. Please try again.");
      }
    } catch (err) {
      dismissToast(loadingId);
      showError("AI couldn't generate content. Please try again.");
      console.error(err);
    } finally {
      setIsImprovingSummary(false);
    }
  };

  const handleImproveExp = async (expId: string, role: string, company: string, description: string) => {
    setImprovingExpId(expId);
    const loadingId = showLoading('Generating AI content...');
    try {
      const res = await fetch('/api/ai/improve-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, company, description })
      });
      const data = await res.json();
      dismissToast(loadingId);
      if (data.result) {
        setExpSuggestions(prev => ({ ...prev, [expId]: data.result }));
        showSuccess('AI content generated successfully');
      } else {
        showError(data.error || "AI couldn't generate content. Please try again.");
      }
    } catch (err) {
      dismissToast(loadingId);
      showError("AI couldn't generate content. Please try again.");
      console.error(err);
    } finally {
      setImprovingExpId(null);
    }
  };

  const applySummary = () => {
    if (summarySuggestion) {
      setResume(prev => ({ ...prev, summary: summarySuggestion }));
      setSummarySuggestion(null);
    }
  };

  const applyExp = (id: string) => {
    if (expSuggestions[id]) {
      setResume(prev => ({
        ...prev,
        experience: prev.experience.map(e => e.id === id ? { ...e, description: expSuggestions[id] } : e)
      }));
      setExpSuggestions(prev => {
        const newObj = { ...prev };
        delete newObj[id];
        return newObj;
      });
    }
  };
  const handleGenerateResume = async () => {
    if (!generatePrompt.trim()) {
      showError('Please enter a description for your resume.');
      return;
    }

    setIsGenerating(true);
    const loadingId = showLoading('Generating resume with AI... this may take a moment');
    
    try {
      const res = await fetch('/api/ai/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generatePrompt })
      });
      
      const data = await res.json();
      dismissToast(loadingId);
      
      if (data.result) {
        setResume(prev => ({
          ...prev,
          ...data.result,
          // Ensure we don't overwrite the ID or theme
          id: prev.id,
          theme: prev.theme,
          lastModified: new Date().toISOString()
        }));
        showSuccess('Resume generated successfully!');
        setIsGenerateModalOpen(false);
        setGeneratePrompt('');
      } else {
        showError(data.error || "Failed to generate resume.");
      }
    } catch (err) {
      dismissToast(loadingId);
      showError("An error occurred during generation.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="flex h-full flex-col overflow-hidden bg-muted/10 font-sans relative">
      {/* Recovery Banner */}
      {hasUnsyncedChanges && (
        <div className="bg-orange-500/10 border-b border-orange-500/20 px-4 py-3 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center text-orange-600 dark:text-orange-400 text-sm font-medium">
            <AlertCircle className="h-4 w-4 mr-2" />
            You have unsaved changes from a previous session.
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 border-orange-500/20 hover:bg-orange-500/10 text-orange-600" onClick={() => {
              const draftStr = localStorage.getItem(`hirecraft_draft_${resume.id || 'new'}`);
              if (draftStr) {
                setResume(JSON.parse(draftStr));
                setSaveState('editing');
              }
              setHasUnsyncedChanges(false);
            }}>
              Restore
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:bg-muted" onClick={() => {
              localStorage.removeItem(`hirecraft_draft_${resume.id || 'new'}`);
              setHasUnsyncedChanges(false);
            }}>
              Discard
            </Button>
          </div>
        </div>
      )}

      {/* Builder Header */}
      <div className="p-4 md:p-8 w-full shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm border border-primary/10">
              <FileEdit className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Resume Builder</h1>
              <p className="text-muted-foreground mt-1 text-lg">Edit and customize your resume content.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button variant="outline" className="md:hidden shadow-sm font-semibold border-border/50" onClick={() => setShowPreviewMobile(!showPreviewMobile)}>
              {showPreviewMobile ? <LayoutPanelLeft className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showPreviewMobile ? 'Edit' : 'Preview'}
            </Button>
            <div className="flex items-center gap-2">
              <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
                <Button variant="default" className="shadow-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground hidden md:flex" onClick={() => setIsGenerateModalOpen(true)}>
                  <Sparkles className="mr-2 h-4 w-4" /> Fill with AI
                </Button>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Generate Resume with AI</DialogTitle>
                    <DialogDescription>
                      Describe yourself, your target role, and your experience. AI will generate a complete resume structure for you.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <Textarea 
                      placeholder="e.g. Senior Frontend Engineer with 5 years of experience in React and Node.js. Target role is Full Stack Developer. Currently working at Acme Corp." 
                      className="min-h-[150px]"
                      value={generatePrompt}
                      onChange={(e) => setGeneratePrompt(e.target.value)}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsGenerateModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleGenerateResume} disabled={isGenerating || !generatePrompt.trim()}>
                      {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Generate'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                variant="outline" 
                className="shadow-sm font-semibold border-border/50 bg-background hover:bg-accent" 
                onClick={handleExport} 
                disabled={isExporting}
              >
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Export PDF
              </Button>
              <Button variant="outline" className="shadow-sm font-semibold border-border/50" onClick={handleSaveVersion} disabled={saveState === 'saving' || !resume.id || resume.id === 'res_123'}>
                <History className="mr-2 h-4 w-4" /> Save Version
              </Button>

            </div>
          </div>
        </div>
      </div>

      {/* Builder Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Editor Panel */}
        <div className={`w-full md:w-1/2 flex-col bg-background z-10 ${showPreviewMobile ? 'hidden' : 'flex'}`}>
          <Tabs defaultValue="content" className="flex flex-col h-full w-full">
            <div className="p-4 md:p-6 border-b flex justify-between items-center bg-background/95 sticky top-0 z-10">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="content"><FileEdit className="w-4 h-4 mr-2"/>Content</TabsTrigger>
                <TabsTrigger value="templates"><LayoutTemplate className="w-4 h-4 mr-2"/>Templates</TabsTrigger>
                <TabsTrigger value="theme"><Palette className="w-4 h-4 mr-2"/>Theme</TabsTrigger>
                <TabsTrigger value="suggestions"><Sparkles className="w-4 h-4 mr-2"/>Suggestions</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-20 md:pb-6 custom-scrollbar">
              <TabsContent value="content" className="mt-0">
                <Accordion defaultValue={["personalInfo", "summary", "experience"]} className="w-full mt-2">

                  {/* Personal Information */}
                  <AccordionItem value="personalInfo" className="border-b-0 mb-3 bg-card rounded-lg border border-border px-5 shadow-sm">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Personal Information</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-1 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="resume-title" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resume Title (Internal Reference)</Label>
                      <Input id="resume-title" value={resume.title} onChange={(e) => setResume({ ...resume, title: e.target.value })} placeholder="e.g. Software Engineer Resume" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Role</Label>
                      <Input value={resume.targetRole || ''} onChange={(e) => setResume({ ...resume, targetRole: e.target.value })} placeholder="e.g. Frontend Developer" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="first-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">First Name</Label>
                      <Input id="first-name" value={resume.personalInfo.firstName} onChange={(e) => setResume({ ...resume, personalInfo: { ...resume.personalInfo, firstName: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Name</Label>
                      <Input value={resume.personalInfo.lastName} onChange={(e) => setResume({ ...resume, personalInfo: { ...resume.personalInfo, lastName: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</Label>
                      <Input value={resume.personalInfo.email} onChange={(e) => setResume({ ...resume, personalInfo: { ...resume.personalInfo, email: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</Label>
                      <Input value={resume.personalInfo.phone} onChange={(e) => setResume({ ...resume, personalInfo: { ...resume.personalInfo, phone: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</Label>
                      <Input value={resume.personalInfo.location} onChange={(e) => setResume({ ...resume, personalInfo: { ...resume.personalInfo, location: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Website</Label>
                      <Input value={resume.personalInfo.website || ''} onChange={(e) => setResume({ ...resume, personalInfo: { ...resume.personalInfo, website: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">LinkedIn</Label>
                      <Input value={resume.personalInfo.linkedin || ''} onChange={(e) => setResume({ ...resume, personalInfo: { ...resume.personalInfo, linkedin: e.target.value } })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">GitHub</Label>
                      <Input value={resume.personalInfo.github || ''} onChange={(e) => setResume({ ...resume, personalInfo: { ...resume.personalInfo, github: e.target.value } })} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Professional Summary */}
              <AccordionItem value="summary" className="border-b-0 mb-3 bg-card rounded-lg border border-border px-5 shadow-sm">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Professional Summary</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-1 pb-4">
                  <div className="space-y-2">
                    <Textarea 
                      value={resume.summary} 
                      onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                      className="min-h-[160px] bg-background shadow-sm leading-relaxed p-4"
                    />
                    <div className="flex justify-end mt-2">
                      <Button 
                        size="sm" 
                        variant="ai" 
                        onClick={handleImproveSummary}
                        disabled={isImprovingSummary}
                        className="h-8 text-xs shadow-sm"
                      >
                        {isImprovingSummary ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                        Improve with AI
                      </Button>
                    </div>
                  </div>

                  {summarySuggestion && (
                    <div className="p-4 mt-3 bg-primary/5 border border-primary/20 rounded-lg shadow-sm">
                      <p className="text-xs font-bold text-primary uppercase mb-2 flex items-center"><Sparkles className="h-3 w-3 mr-1"/> AI Suggestion</p>
                      <p className="text-sm text-foreground leading-relaxed mb-3">{summarySuggestion}</p>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ai" onClick={applySummary} className="h-8">
                          <Check className="h-4 w-4 mr-1" /> Apply
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setSummarySuggestion(null)} className="h-8 text-primary hover:bg-primary/10 hover:text-primary">
                          <X className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Work Experience */}
              <AccordionItem value="experience" className="border-b-0 mb-3 bg-card rounded-lg border border-border px-5 shadow-sm">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Work Experience</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-1 pb-4">
                  {resume.experience.map((exp, idx) => (
                    <div key={exp.id} className="p-5 border border-border rounded-lg bg-card shadow-sm space-y-4 relative group">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => {
                        const newExp = resume.experience.filter((_, i) => i !== idx);
                        setResume({ ...resume, experience: newExp });
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</Label>
                          <Input value={exp.role} onChange={(e) => {
                            const newExp = [...resume.experience];
                            newExp[idx].role = e.target.value;
                            setResume({ ...resume, experience: newExp });
                          }} className="font-medium" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company</Label>
                          <Input value={exp.company} onChange={(e) => {
                            const newExp = [...resume.experience];
                            newExp[idx].company = e.target.value;
                            setResume({ ...resume, experience: newExp });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</Label>
                          <Input value={exp.location} onChange={(e) => {
                            const newExp = [...resume.experience];
                            newExp[idx].location = e.target.value;
                            setResume({ ...resume, experience: newExp });
                          }} />
                        </div>
                        <div className="space-y-2 flex flex-col justify-between">
                            <div className="flex items-center space-x-2 mt-auto mb-2">
                              <input type="checkbox" id={`exp-current-${idx}`} checked={exp.current} onChange={(e) => {
                                const newExp = [...resume.experience];
                                newExp[idx].current = e.target.checked;
                                if (e.target.checked) newExp[idx].endDate = 'Present';
                                setResume({ ...resume, experience: newExp });
                              }} className="rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor={`exp-current-${idx}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Currently working here
                              </label>
                            </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</Label>
                          <Input value={exp.startDate} onChange={(e) => {
                            const newExp = [...resume.experience];
                            newExp[idx].startDate = e.target.value;
                            setResume({ ...resume, experience: newExp });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Date</Label>
                          <Input value={exp.endDate} disabled={exp.current} onChange={(e) => {
                            const newExp = [...resume.experience];
                            newExp[idx].endDate = e.target.value;
                            setResume({ ...resume, experience: newExp });
                          }} />
                        </div>
                      </div>

                      <div className="space-y-2 mt-4">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
                        <Textarea 
                          value={exp.description} 
                          onChange={(e) => {
                            const newExp = [...resume.experience];
                            newExp[idx].description = e.target.value;
                            setResume({ ...resume, experience: newExp });
                          }}
                          className="min-h-[120px] bg-background shadow-sm leading-relaxed p-4"
                        />
                        <div className="flex justify-end mt-2">
                          <Button 
                            size="sm" 
                            variant="ai" 
                            onClick={() => handleImproveExp(exp.id, exp.role, exp.company, exp.description)}
                            disabled={improvingExpId === exp.id}
                            className="h-8 text-xs shadow-sm"
                          >
                            {improvingExpId === exp.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                            Enhance Bullets
                          </Button>
                        </div>
                      </div>

                      {expSuggestions[exp.id] && (
                        <div className="p-4 mt-3 bg-primary/5 border border-primary/20 rounded-lg shadow-sm">
                          <p className="text-xs font-bold text-primary uppercase mb-2 flex items-center"><Sparkles className="h-3 w-3 mr-1"/> AI Enhanced Bullets</p>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-3">{expSuggestions[exp.id]}</p>
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ai" onClick={() => applyExp(exp.id)} className="h-8">
                              <Check className="h-4 w-4 mr-1" /> Apply
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setExpSuggestions(prev => { const n = {...prev}; delete n[exp.id]; return n;})} className="h-8 text-primary hover:bg-primary/10 hover:text-primary">
                              <X className="h-4 w-4 mr-1" /> Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-2" onClick={() => {
                    setResume({
                      ...resume,
                      experience: [...resume.experience, { id: Date.now().toString(), role: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' }]
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Experience
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* Education */}
              <AccordionItem value="education" className="border-b-0 mb-3 bg-card rounded-lg border border-border px-5 shadow-sm">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Education</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-1 pb-4">
                  {resume.education?.map((edu, idx) => (
                    <div key={edu.id} className="p-5 border border-border rounded-lg bg-card shadow-sm space-y-4 relative group">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => {
                        const newEdu = resume.education.filter((_, i) => i !== idx);
                        setResume({ ...resume, education: newEdu });
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Institution</Label>
                          <Input value={edu.institution} onChange={(e) => {
                            const newEdu = [...resume.education];
                            newEdu[idx].institution = e.target.value;
                            setResume({ ...resume, education: newEdu });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Degree</Label>
                          <Input value={edu.degree} onChange={(e) => {
                            const newEdu = [...resume.education];
                            newEdu[idx].degree = e.target.value;
                            setResume({ ...resume, education: newEdu });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Field of Study</Label>
                          <Input value={edu.fieldOfStudy} onChange={(e) => {
                            const newEdu = [...resume.education];
                            newEdu[idx].fieldOfStudy = e.target.value;
                            setResume({ ...resume, education: newEdu });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</Label>
                          <Input value={edu.score || ''} onChange={(e) => {
                            const newEdu = [...resume.education];
                            newEdu[idx].score = e.target.value;
                            setResume({ ...resume, education: newEdu });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</Label>
                          <Input value={edu.startDate} onChange={(e) => {
                            const newEdu = [...resume.education];
                            newEdu[idx].startDate = e.target.value;
                            setResume({ ...resume, education: newEdu });
                          }} />
                        </div>
                        <div className="space-y-2 flex flex-col justify-between">
                          <div>
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Date</Label>
                            <Input value={edu.endDate} disabled={edu.current} onChange={(e) => {
                              const newEdu = [...resume.education];
                              newEdu[idx].endDate = e.target.value;
                              setResume({ ...resume, education: newEdu });
                            }} />
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <input type="checkbox" id={`edu-current-${idx}`} checked={edu.current} onChange={(e) => {
                              const newEdu = [...resume.education];
                              newEdu[idx].current = e.target.checked;
                              if (e.target.checked) newEdu[idx].endDate = 'Present';
                              setResume({ ...resume, education: newEdu });
                            }} className="rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor={`edu-current-${idx}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              Currently studying here
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-2" onClick={() => {
                    setResume({
                      ...resume,
                      education: [...(resume.education || []), { id: Date.now().toString(), institution: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', current: false }]
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Education
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* Skills */}
              <AccordionItem value="skills" className="border-b-0 mb-3 bg-card rounded-lg border border-border px-5 shadow-sm">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Skills</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-1 pb-4">
                  {resume.skills?.map((skill, idx) => (
                    <div key={skill.id} className="p-4 border border-border rounded-lg bg-card shadow-sm space-y-4 relative group">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => {
                        const newSkills = resume.skills.filter((_, i) => i !== idx);
                        setResume({ ...resume, skills: newSkills });
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skill Name</Label>
                          <Input value={skill.name} onChange={(e) => {
                            const newSkills = [...resume.skills];
                            newSkills[idx].name = e.target.value;
                            setResume({ ...resume, skills: newSkills });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={skill.category} 
                            onChange={(e) => {
                              const newSkills = [...resume.skills];
                              newSkills[idx].category = e.target.value as Skill['category'];
                              setResume({ ...resume, skills: newSkills });
                            }}
                          >
                            <option value="Hard">Hard Skill</option>
                            <option value="Soft">Soft Skill</option>
                            <option value="Tools">Tool</option>
                            <option value="Languages">Language</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-2" onClick={() => {
                    setResume({
                      ...resume,
                      skills: [...(resume.skills || []), { id: Date.now().toString(), name: '', category: 'Hard' }]
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Skill
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* Projects */}
              <AccordionItem value="projects" className="border-b-0 mb-3 bg-card rounded-lg border border-border px-5 shadow-sm">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Projects</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-1 pb-4">
                  {resume.projects?.map((proj, idx) => (
                    <div key={proj.id} className="p-5 border border-border rounded-lg bg-card shadow-sm space-y-4 relative group">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => {
                        const newProjects = resume.projects.filter((_, i) => i !== idx);
                        setResume({ ...resume, projects: newProjects });
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Project Name</Label>
                          <Input value={proj.name} onChange={(e) => {
                            const newProjects = [...resume.projects];
                            newProjects[idx].name = e.target.value;
                            setResume({ ...resume, projects: newProjects });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL (Optional)</Label>
                          <Input value={proj.url || ''} onChange={(e) => {
                            const newProjects = [...resume.projects];
                            newProjects[idx].url = e.target.value;
                            setResume({ ...resume, projects: newProjects });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</Label>
                          <Input value={proj.startDate || ''} onChange={(e) => {
                            const newProjects = [...resume.projects];
                            newProjects[idx].startDate = e.target.value;
                            setResume({ ...resume, projects: newProjects });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">End Date</Label>
                          <Input value={proj.endDate || ''} onChange={(e) => {
                            const newProjects = [...resume.projects];
                            newProjects[idx].endDate = e.target.value;
                            setResume({ ...resume, projects: newProjects });
                          }} />
                        </div>
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description</Label>
                        <Textarea 
                          value={proj.description} 
                          onChange={(e) => {
                            const newProjects = [...resume.projects];
                            newProjects[idx].description = e.target.value;
                            setResume({ ...resume, projects: newProjects });
                          }}
                          className="min-h-[120px] bg-background shadow-sm leading-relaxed p-4"
                        />
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-2" onClick={() => {
                    setResume({
                      ...resume,
                      projects: [...(resume.projects || []), { id: Date.now().toString(), name: '', description: '', url: '', startDate: '', endDate: '' }]
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Project
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* Certifications */}
              <AccordionItem value="certifications" className="border-b-0 mb-3 bg-card rounded-lg border border-border px-5 shadow-sm">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Certifications</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-1 pb-4">
                  {resume.certifications?.map((cert, idx) => (
                    <div key={cert.id} className="p-5 border border-border rounded-lg bg-card shadow-sm space-y-4 relative group">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => {
                        const newCerts = resume.certifications.filter((_, i) => i !== idx);
                        setResume({ ...resume, certifications: newCerts });
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Certification Name</Label>
                          <Input value={cert.name} onChange={(e) => {
                            const newCerts = [...resume.certifications];
                            newCerts[idx].name = e.target.value;
                            setResume({ ...resume, certifications: newCerts });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issuer</Label>
                          <Input value={cert.issuer} onChange={(e) => {
                            const newCerts = [...resume.certifications];
                            newCerts[idx].issuer = e.target.value;
                            setResume({ ...resume, certifications: newCerts });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
                          <Input value={cert.date} onChange={(e) => {
                            const newCerts = [...resume.certifications];
                            newCerts[idx].date = e.target.value;
                            setResume({ ...resume, certifications: newCerts });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">URL (Optional)</Label>
                          <Input value={cert.url || ''} onChange={(e) => {
                            const newCerts = [...resume.certifications];
                            newCerts[idx].url = e.target.value;
                            setResume({ ...resume, certifications: newCerts });
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-2" onClick={() => {
                    setResume({
                      ...resume,
                      certifications: [...(resume.certifications || []), { id: Date.now().toString(), name: '', issuer: '', date: '', url: '' }]
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Certification
                  </Button>
                </AccordionContent>
              </AccordionItem>


              {/* Languages */}
              <AccordionItem value="languages" className="border-b-0 mb-3 bg-card rounded-lg border border-border px-5 shadow-sm">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Languages</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-1 pb-4">
                  {(resume.languages || []).map((lang, idx) => (
                    <div key={lang.id} className="relative p-4 rounded-xl border border-border/60 bg-muted/20 space-y-4">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => {
                        const newLangs = [...resume.languages!];
                        newLangs.splice(idx, 1);
                        setResume({ ...resume, languages: newLangs });
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Language</Label>
                          <Input value={lang.name} onChange={(e) => {
                            const newLangs = [...resume.languages!];
                            newLangs[idx].name = e.target.value;
                            setResume({ ...resume, languages: newLangs });
                          }} placeholder="e.g. English" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Proficiency (Optional)</Label>
                          <Input value={lang.proficiency || ''} onChange={(e) => {
                            const newLangs = [...resume.languages!];
                            newLangs[idx].proficiency = e.target.value;
                            setResume({ ...resume, languages: newLangs });
                          }} placeholder="e.g. Professional" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-2" onClick={() => {
                    setResume({
                      ...resume,
                      languages: [...(resume.languages || []), { id: Date.now().toString(), name: '', proficiency: '' }]
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Language
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* Awards / Achievements */}
              <AccordionItem value="awards" className="border-b-0 mb-3 bg-card rounded-lg border border-border px-5 shadow-sm">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Awards / Achievements</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-1 pb-4">
                  {(resume.awards || []).map((award, idx) => (
                    <div key={award.id} className="relative p-4 rounded-xl border border-border/60 bg-muted/20 space-y-4">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => {
                        const newAwards = [...resume.awards!];
                        newAwards.splice(idx, 1);
                        setResume({ ...resume, awards: newAwards });
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Title</Label>
                          <Input value={award.title} onChange={(e) => {
                            const newAwards = [...resume.awards!];
                            newAwards[idx].title = e.target.value;
                            setResume({ ...resume, awards: newAwards });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Issuer (Optional)</Label>
                          <Input value={award.issuer || ''} onChange={(e) => {
                            const newAwards = [...resume.awards!];
                            newAwards[idx].issuer = e.target.value;
                            setResume({ ...resume, awards: newAwards });
                          }} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date (Optional)</Label>
                          <Input value={award.date || ''} onChange={(e) => {
                            const newAwards = [...resume.awards!];
                            newAwards[idx].date = e.target.value;
                            setResume({ ...resume, awards: newAwards });
                          }} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description (Optional)</Label>
                          <Textarea className="min-h-[80px]" value={award.description || ''} onChange={(e) => {
                            const newAwards = [...resume.awards!];
                            newAwards[idx].description = e.target.value;
                            setResume({ ...resume, awards: newAwards });
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-2" onClick={() => {
                    setResume({
                      ...resume,
                      awards: [...(resume.awards || []), { id: Date.now().toString(), title: '', issuer: '', date: '', description: '' }]
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Award
                  </Button>
                </AccordionContent>
              </AccordionItem>

              {/* Custom Sections */}
              <AccordionItem value="customSections" className="border-b-0 mb-3 bg-card rounded-lg border border-border px-5 shadow-sm">
                <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Custom Sections</AccordionTrigger>
                <AccordionContent className="space-y-6 pt-1 pb-4">
                  {(resume.customSections || []).map((section, sIdx) => (
                    <div key={section.id} className="relative p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => {
                        const newSections = [...resume.customSections!];
                        newSections.splice(sIdx, 1);
                        setResume({ ...resume, customSections: newSections });
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="space-y-2 pt-2 pr-8">
                        <Label className="text-xs font-semibold text-primary uppercase tracking-wider">Section Title</Label>
                        <Input className="border-primary/20 focus-visible:ring-primary/30 font-semibold" value={section.title} onChange={(e) => {
                          const newSections = [...resume.customSections!];
                          newSections[sIdx].title = e.target.value;
                          setResume({ ...resume, customSections: newSections });
                        }} placeholder="e.g. Publications" />
                      </div>
                      
                      <div className="space-y-4 pl-2 border-l-2 border-primary/10 ml-1">
                        {section.items.map((item, idx) => (
                          <div key={item.id} className="relative p-4 rounded-lg border border-border/60 bg-background space-y-4">
                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => {
                              const newSections = [...resume.customSections!];
                              newSections[sIdx].items.splice(idx, 1);
                              setResume({ ...resume, customSections: newSections });
                            }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 pr-6">
                              <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Item Title</Label>
                                <Input value={item.title} onChange={(e) => {
                                  const newSections = [...resume.customSections!];
                                  newSections[sIdx].items[idx].title = e.target.value;
                                  setResume({ ...resume, customSections: newSections });
                                }} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subtitle (Optional)</Label>
                                <Input value={item.subtitle || ''} onChange={(e) => {
                                  const newSections = [...resume.customSections!];
                                  newSections[sIdx].items[idx].subtitle = e.target.value;
                                  setResume({ ...resume, customSections: newSections });
                                }} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date (Optional)</Label>
                                <Input value={item.date || ''} onChange={(e) => {
                                  const newSections = [...resume.customSections!];
                                  newSections[sIdx].items[idx].date = e.target.value;
                                  setResume({ ...resume, customSections: newSections });
                                }} />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description (Optional)</Label>
                                <Textarea className="min-h-[80px]" value={item.description || ''} onChange={(e) => {
                                  const newSections = [...resume.customSections!];
                                  newSections[sIdx].items[idx].description = e.target.value;
                                  setResume({ ...resume, customSections: newSections });
                                }} />
                              </div>
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => {
                          const newSections = [...resume.customSections!];
                          newSections[sIdx].items.push({ id: Date.now().toString(), title: '', subtitle: '', date: '', description: '' });
                          setResume({ ...resume, customSections: newSections });
                        }}>
                          <Plus className="h-3 w-3 mr-2" /> Add Item
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-2" onClick={() => {
                    setResume({
                      ...resume,
                      customSections: [...(resume.customSections || []), { id: Date.now().toString(), title: 'New Section', items: [{ id: Date.now().toString() + '_1', title: '', subtitle: '', date: '', description: '' }] }]
                    });
                  }}>
                    <Plus className="h-4 w-4 mr-2" /> Add Custom Section
                  </Button>
                </AccordionContent>
              </AccordionItem>

                </Accordion>
              </TabsContent>
              <TabsContent value="templates" className="mt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4 mt-4">
                  {templates.map(template => (
                    <div 
                      key={template.id}
                      onClick={() => setResume({ ...resume, templateId: template.id })}
                      className={`cursor-pointer rounded-xl border p-2 transition-all duration-200 ${resume.templateId === template.id ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50 bg-card'}`}
                    >
                      <div className="aspect-[1/1.2] bg-slate-50 rounded-md mb-2 flex items-center justify-center border relative overflow-hidden group">
                        {resume.templateId === template.id && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground p-1 rounded-full shadow-sm z-10">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                        <TemplateMiniPreview templateId={template.id} />
                      </div>
                      <h4 className="font-semibold text-sm truncate">{template.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{template.category[1] || template.category[0]}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
              <TabsContent value="theme" className="mt-0 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Primary Color</Label>
                    <p className="text-sm text-muted-foreground mb-3">Choose a color for headings and accents.</p>
                    <div className="flex flex-wrap gap-3">
                      {['#0f172a', '#2563eb', '#16a34a', '#dc2626', '#9333ea', '#ea580c', '#0891b2'].map(color => (
                        <div 
                          key={color}
                          onClick={() => setResume({ 
                            ...resume,                             theme: { ...resume.theme, primaryColor: color } as ThemeConfig 
                          })}
                          className={`w-10 h-10 rounded-full cursor-pointer flex items-center justify-center transition-all ${resume.theme?.primaryColor === color ? 'ring-2 ring-offset-2 ring-primary' : 'hover:scale-110'}`}
                          style={{ backgroundColor: color }}
                        >
                          {resume.theme?.primaryColor === color && <Check className="w-5 h-5 text-white" />}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <Label className="text-base font-semibold">Typography</Label>
                    <p className="text-sm text-muted-foreground mb-3">Select the main font family.</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { id: 'Inter, sans-serif', name: 'Inter (Sans)' },
                        { id: 'Merriweather, serif', name: 'Merriweather (Serif)' },
                        { id: 'Roboto Mono, monospace', name: 'Roboto Mono' },
                        { id: 'system-ui, sans-serif', name: 'System Default' }
                      ].map(font => (
                        <div 
                          key={font.id}
                          onClick={() => setResume({ 
                            ...resume,                             theme: { ...resume.theme, fontFamily: font.id } as ThemeConfig 
                          })}
                          className={`cursor-pointer rounded-lg border p-3 flex items-center justify-between ${resume.theme?.fontFamily === font.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}
                          style={{ fontFamily: font.id }}
                        >
                          <span className="text-sm font-medium">{font.name}</span>
                          {resume.theme?.fontFamily === font.id && <Check className="w-4 h-4 text-primary" />}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="suggestions" className="mt-0 h-full">
                <SuggestionsDashboard 
                  suggestions={suggestions}
                  scores={scores}
                  isAnalyzing={isAnalyzingSuggestions}
                  onApply={handleApplySuggestion}
                  onUndo={handleUndoSuggestion}
                  onDismiss={handleDismissSuggestion}
                  canUndo={(id) => undoStack[id] !== undefined}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Live Preview Panel */}
        <div className={`w-full md:w-1/2 bg-muted/30 flex-col relative md:border-l border-border/50 ${showPreviewMobile ? 'flex' : 'hidden md:flex'}`}>
          <div className="w-full flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 flex justify-end items-start">
            {/* Wrapper reserves the scaled dimensions to prevent clipping */}
            <div style={{ width: '520px', height: 'max-content' }}>
              <div className="shadow-2xl border border-border/50 bg-white" style={{ width: '800px', transform: 'scale(0.65)', transformOrigin: 'top left' }}>
                <ResumePreview resume={deferredResume} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Resume Preview for Export Generation */}
      <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none opacity-0 -z-50">
        <div id="resume-export-preview-hidden">
          <ResumePreview resume={deferredResume} />
        </div>
      </div>
    </div>
  );
}

