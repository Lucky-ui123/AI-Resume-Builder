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
import { Sparkles, Eye, LayoutPanelLeft, Check, X, Loader2, History, FileEdit, Trash2, Plus, Palette, LayoutTemplate, AlertCircle, Download, Minus, Search, Star } from 'lucide-react';
import { emptyResume } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { saveResumeVersionAction } from './actions';
import { Resume, Skill, ResumeSuggestion, ThemeConfig } from '@/types';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toast';
import { templates } from '@/lib/templates';
import { PageHeader } from '@/components/ui/PageHeader';
import { TemplateMiniPreview } from '@/components/resume/TemplateMiniPreview';
import { generatePDF } from '@/lib/export-utils';
import { generateSuggestionsAction } from '../career-actions';
import { useResumes } from '@/context/ResumeContext';
import { ResumeScores } from '@/types';
import dynamic from 'next/dynamic';

const SuggestionsDashboard = dynamic(
  () => import('./SuggestionsDashboard').then((mod) => mod.SuggestionsDashboard),
  { loading: () => <div className="p-4 text-center text-muted-foreground">Loading suggestions...</div> }
);

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

  // Split pane state
  const [splitPosition, setSplitPosition] = useState<number>(45); // in %
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const [editorWidth, setEditorWidth] = useState(500);
  const [activeTab, setActiveTab] = useState("content");

  useEffect(() => {
    if (!editorPanelRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setEditorWidth(entry.contentRect.width);
      }
    });
    observer.observe(editorPanelRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const activeEl = editorPanelRef.current?.querySelector('[data-state="active"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeTab, editorWidth]);

  // Zoom and Pan states
  const [zoom, setZoom] = useState<number>(1); // e.g. 1.0 = 100%
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const isSpacePressedRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const previewScrollContainerRef = useRef<HTMLDivElement>(null);
  const previewInnerRef = useRef<HTMLDivElement>(null);
  const [resumeHeight, setResumeHeight] = useState(1130);

  const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  const [customThemes, setCustomThemes] = useState<Array<{ id: string; name: string; config: Partial<ThemeConfig> }>>([]);
  const [newThemeName, setNewThemeName] = useState('');

  // Templates Search, Filter & Favorite states
  const [templateSearch, setTemplateSearch] = useState('');
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<string>('All');
  const [favoriteTemplates, setFavoriteTemplates] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('fav_templates') || '[]');
      } catch {
        return [];
      }
    }
    return [];
  });

  const toggleFavoriteTemplate = useCallback((id: string) => {
    setFavoriteTemplates(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('fav_templates', JSON.stringify(next));
      return next;
    });
  }, []);

  // Load custom themes from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedThemes = localStorage.getItem('hirecraft_custom_themes');
      if (savedThemes) {
        try {
          setCustomThemes(JSON.parse(savedThemes));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleSaveCustomTheme = () => {
    if (!newThemeName.trim()) return;
    const newTheme = {
      id: Date.now().toString(),
      name: newThemeName.trim(),
      config: { ...resume.theme }
    };
    const updatedThemes = [...customThemes, newTheme];
    setCustomThemes(updatedThemes);
    localStorage.setItem('hirecraft_custom_themes', JSON.stringify(updatedThemes));
    setNewThemeName('');
    showSuccess('Theme saved successfully!');
  };

  const handleDeleteCustomTheme = (id: string) => {
    const updatedThemes = customThemes.filter(t => t.id !== id);
    setCustomThemes(updatedThemes);
    localStorage.setItem('hirecraft_custom_themes', JSON.stringify(updatedThemes));
    showSuccess('Theme deleted successfully!');
  };

  // Load splitPosition and zoom from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSplit = localStorage.getItem('hirecraft_builder_split_position');
      if (savedSplit) {
        setSplitPosition(parseFloat(savedSplit));
      }
      const savedZoom = localStorage.getItem('hirecraft_builder_zoom');
      if (savedZoom) {
        setZoom(parseFloat(savedZoom));
      }

      const savedScroll = localStorage.getItem('hirecraft_builder_preview_scroll');
      if (savedScroll && previewScrollContainerRef.current) {
        // Wait briefly for contents to render before restoring scroll
        setTimeout(() => {
          if (previewScrollContainerRef.current) {
            previewScrollContainerRef.current.scrollTop = parseFloat(savedScroll);
          }
        }, 100);
      }
    }
  }, []);

  // Track height of resume preview to ensure container sizing is perfect
  useEffect(() => {
    if (previewInnerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          setResumeHeight(entry.target.clientHeight);
        }
      });
      resizeObserver.observe(previewInnerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [resume]);

  const handlePreviewScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    localStorage.setItem('hirecraft_builder_preview_scroll', target.scrollTop.toString());
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      let newPercentage = (newX / rect.width) * 100;

      // Constrain minimum widths in pixels
      const minLeftPx = 350;
      const minRightPx = 450;

      const minLeftPct = (minLeftPx / rect.width) * 100;
      const minRightPct = 100 - (minRightPx / rect.width) * 100;

      newPercentage = Math.max(minLeftPct, Math.min(newPercentage, minRightPct));
      setSplitPosition(newPercentage);
      localStorage.setItem('hirecraft_builder_split_position', newPercentage.toString());
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleDividerDoubleClick = useCallback(() => {
    setSplitPosition(50);
    localStorage.setItem('hirecraft_builder_split_position', '50');
  }, []);

  const changeZoom = useCallback((newZoom: number) => {
    const clamped = Math.max(0.25, Math.min(newZoom, 2.0));
    setZoom(clamped);
    localStorage.setItem('hirecraft_builder_zoom', clamped.toString());
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom(prev => {
      const next = ZOOM_LEVELS.find(v => v > prev) || 2.0;
      localStorage.setItem('hirecraft_builder_zoom', next.toString());
      return next;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(prev => {
      const prior = [...ZOOM_LEVELS].reverse().find(v => v < prev) || 0.25;
      localStorage.setItem('hirecraft_builder_zoom', prior.toString());
      return prior;
    });
  }, []);

  const handleZoomReset = useCallback(() => {
    changeZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
  }, [changeZoom]);

  const handleFitWidth = useCallback(() => {
    if (!previewScrollContainerRef.current) return;
    const containerWidth = previewScrollContainerRef.current.clientWidth;
    const fitZoom = (containerWidth - 64) / 800; // 32px padding on each side
    changeZoom(fitZoom);
    setPanOffset({ x: 0, y: 0 });
  }, [changeZoom]);

  const handleFitPage = useCallback(() => {
    if (!previewScrollContainerRef.current) return;
    const containerHeight = previewScrollContainerRef.current.clientHeight;
    const fitZoom = (containerHeight - 64) / 1130;
    changeZoom(fitZoom);
    setPanOffset({ x: 0, y: 0 });
  }, [changeZoom]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom(prev => {
        const next = Math.max(0.25, Math.min(prev * factor, 2.0));
        localStorage.setItem('hirecraft_builder_zoom', next.toString());
        return next;
      });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        isSpacePressedRef.current = true;
        e.preventDefault();
      }

      if (e.ctrlKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === '-') {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          handleZoomReset();
        } else if (e.key === '1') {
          e.preventDefault();
          if (e.shiftKey) {
            handleFitPage();
          } else {
            handleFitWidth();
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleZoomIn, handleZoomOut, handleZoomReset, handleFitWidth, handleFitPage]);

  const handlePreviewMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const isMiddleClick = e.button === 1;
    const isSpaceDrag = isSpacePressedRef.current;

    if (isMiddleClick || isSpaceDrag) {
      e.preventDefault();
      setIsPanning(true);
      dragStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    }
  }, [panOffset]);

  const handlePreviewMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    e.preventDefault();
    const newX = e.clientX - dragStartRef.current.x;
    const newY = e.clientY - dragStartRef.current.y;
    setPanOffset({ x: newX, y: newY });
  }, [isPanning]);

  const handlePreviewMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

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

      <div className="sticky top-0 z-20 px-4 md:px-6 bg-card border-b border-border/40 shrink-0">
        <PageHeader
          icon={<FileEdit />}
          title="Resume Builder"
          description="Edit and customize your resume content."
          actions={
          <>
            <Button variant="outline" className="md:hidden shadow-sm font-semibold border-border/50" onClick={() => setShowPreviewMobile(!showPreviewMobile)}>
              {showPreviewMobile ? <LayoutPanelLeft className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showPreviewMobile ? 'Edit' : 'Preview'}
            </Button>
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
          </>
        }
      />
      </div>

      {/* Builder Workspace */}
      <div
        ref={containerRef}
        className="flex flex-1 overflow-hidden relative"
        style={{ userSelect: isResizing || isPanning ? 'none' : 'auto' }}
      >
        {/* Editor Panel */}
        <div
          ref={editorPanelRef}
          className={`flex-col bg-background z-10 ${showPreviewMobile ? 'hidden' : 'flex'}`}
          style={{
            width: `${splitPosition}%`,
            minWidth: '350px'
          }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full w-full">
            <div className="p-4 md:p-6 border-b flex justify-between items-center bg-background/95 sticky top-0 z-10">
              <TabsList
                className={cn(
                  "w-full bg-muted p-1 rounded-lg transition-all duration-200",
                  editorWidth < 350
                    ? "flex overflow-x-auto flex-nowrap scrollbar-none snap-x snap-mandatory justify-start"
                    : "grid grid-cols-4"
                )}
                style={{
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                {[
                  { value: 'content', label: 'Content', icon: FileEdit },
                  { value: 'templates', label: 'Templates', icon: LayoutTemplate },
                  { value: 'theme', label: 'Theme', icon: Palette },
                  { value: 'suggestions', label: 'Suggestions', icon: Sparkles }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSmall = editorWidth < 500;
                  const isVerySmall = editorWidth < 350;

                  return (
                    <TabsTrigger
                      key={tab.value}
                      value={tab.value}
                      title={isSmall ? tab.label : undefined}
                      className={cn(
                        "flex items-center justify-center font-semibold transition-all duration-200 snap-center shrink-0",
                        isVerySmall ? "px-4 py-2 min-w-[100px]" : "py-1.5",
                        isSmall && !isVerySmall ? "px-2" : "px-3"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-4 h-4 shrink-0 transition-transform duration-200",
                          isSmall ? "mr-0" : "mr-2"
                        )}
                      />
                      {!isSmall && (
                        <span className="truncate text-xs md:text-sm">
                          {tab.label}
                        </span>
                      )}
                    </TabsTrigger>
                  );
                })}
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
                          <p className="text-xs font-bold text-primary uppercase mb-2 flex items-center"><Sparkles className="h-3 w-3 mr-1" /> AI Suggestion</p>
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
                              <p className="text-xs font-bold text-primary uppercase mb-2 flex items-center"><Sparkles className="h-3 w-3 mr-1" /> AI Enhanced Bullets</p>
                              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap mb-3">{expSuggestions[exp.id]}</p>
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ai" onClick={() => applyExp(exp.id)} className="h-8">
                                  <Check className="h-4 w-4 mr-1" /> Apply
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setExpSuggestions(prev => { const n = { ...prev }; delete n[exp.id]; return n; })} className="h-8 text-primary hover:bg-primary/10 hover:text-primary">
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
              <TabsContent value="templates" className="mt-0 flex flex-col h-full gap-4">
                {/* Search Bar */}
                <div className="relative mt-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    className="pl-9 h-9"
                    value={templateSearch}
                    onChange={(e) => setTemplateSearch(e.target.value)}
                  />
                </div>

                {/* Filter Category Tabs/Pills */}
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {['All', 'ATS Friendly', 'Professional', 'Modern', 'Creative', 'Minimal'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedTemplateCategory(cat)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full font-semibold border transition-all duration-150",
                        selectedTemplateCategory === cat
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background text-muted-foreground hover:text-foreground border-border hover:bg-muted/50"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Templates Grid Container */}
                <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-1 pb-16 custom-scrollbar">
                  {templates
                    .filter((t) => {
                      const matchesSearch = t.name.toLowerCase().includes(templateSearch.toLowerCase()) || 
                        t.description.toLowerCase().includes(templateSearch.toLowerCase()) ||
                        t.tags.some(tag => tag.toLowerCase().includes(templateSearch.toLowerCase()));
                      const matchesCategory = selectedTemplateCategory === 'All' || t.category.includes(selectedTemplateCategory as any);
                      return matchesSearch && matchesCategory;
                    })
                    .map((template) => {
                      const isFavorite = favoriteTemplates.includes(template.id);
                      return (
                        <div
                          key={template.id}
                          className={cn(
                            "group cursor-pointer rounded-xl border p-2 bg-card relative transition-all duration-200 hover:shadow-md",
                            resume.templateId === template.id ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50'
                          )}
                          onClick={() => setResume({ ...resume, templateId: template.id })}
                        >
                          {/* Favorite button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteTemplate(template.id);
                            }}
                            className="absolute top-4 left-4 p-1.5 rounded-full bg-background/85 hover:bg-background text-muted-foreground hover:text-yellow-500 shadow-sm z-20 transition-colors"
                          >
                            <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-yellow-500 text-yellow-500")} />
                          </button>

                          {/* New / Premium Badges */}
                          {template.badge && (
                            <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm z-20">
                              {template.badge}
                            </span>
                          )}

                          {/* Image preview area */}
                          <div className="aspect-[1/1.2] bg-slate-50 rounded-md mb-2 flex items-center justify-center border relative overflow-hidden group-hover:shadow-inner">
                            {resume.templateId === template.id && (
                              <div className="absolute top-3 right-3 bg-primary text-primary-foreground p-1 rounded-full shadow z-10">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
                            <TemplateMiniPreview templateId={template.id} />
                          </div>

                          {/* Title and tags info */}
                          <div className="px-1 py-0.5">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h4 className="font-semibold text-xs text-foreground truncate">{template.name}</h4>
                              {template.atsFriendly && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 shrink-0">
                                  ATS {template.atsScore}%
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                              {template.tags.slice(0, 2).map(tag => (
                                <span key={tag} className="text-[9px] px-1 py-0.2 rounded bg-muted text-muted-foreground truncate">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </TabsContent>
              <TabsContent value="theme" className="mt-0 space-y-6">
                {/* Theme Presets and Custom Themes */}
                <div className="p-4 bg-muted/40 rounded-xl border space-y-4">
                  <div>
                    <h3 className="font-semibold text-xs mb-2 text-foreground uppercase tracking-wider">Design Style Presets</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          name: 'ATS Professional',
                          config: {
                            primaryColor: '#0f172a', secondaryColor: '#475569', headingColor: '#0f172a', bodyColor: '#1e293b', dividerColor: '#cbd5e1',
                            fontFamily: 'Inter, sans-serif', fontSizeHeading: 18, fontSizeBody: 11, fontSizeName: 30, fontWeightBody: '400',
                            lineHeight: 1.3, letterSpacing: -0.5, headingStyle: 'style1', dividerStyle: 'solid', density: 'compact',
                            sectionSpacing: 12, contentPadding: 16, pageMargin: 'normal'
                          }
                        },
                        {
                          name: 'Corporate Navy',
                          config: {
                            primaryColor: '#1e3a8a', secondaryColor: '#3b82f6', headingColor: '#1e3a8a', bodyColor: '#1f2937', dividerColor: '#e5e7eb',
                            fontFamily: 'Merriweather, serif', fontSizeHeading: 20, fontSizeBody: 12, fontSizeName: 34, fontWeightBody: '400',
                            lineHeight: 1.4, letterSpacing: 0, headingStyle: 'style2', dividerStyle: 'solid', density: 'normal',
                            sectionSpacing: 16, contentPadding: 24, pageMargin: 'normal'
                          }
                        },
                        {
                          name: 'Modern Minimal',
                          config: {
                            primaryColor: '#27272a', secondaryColor: '#71717a', headingColor: '#18181b', bodyColor: '#27272a', dividerColor: '#f4f4f5',
                            fontFamily: 'Outfit, sans-serif', fontSizeHeading: 20, fontSizeBody: 11, fontSizeName: 32, fontWeightBody: '400',
                            lineHeight: 1.5, letterSpacing: -0.5, headingStyle: 'style3', dividerStyle: 'none', density: 'compact',
                            sectionSpacing: 14, contentPadding: 20, pageMargin: 'narrow'
                          }
                        },
                        {
                          name: 'Creative Startup',
                          config: {
                            primaryColor: '#7c3aed', secondaryColor: '#db2777', headingColor: '#4c1d95', bodyColor: '#1f2937', dividerColor: '#f3e8ff',
                            fontFamily: 'Poppins, sans-serif', fontSizeHeading: 22, fontSizeBody: 12, fontSizeName: 38, fontWeightBody: '500',
                            lineHeight: 1.4, letterSpacing: -0.2, headingStyle: 'style4', dividerStyle: 'dashed', density: 'comfortable',
                            sectionSpacing: 18, contentPadding: 24, pageMargin: 'normal'
                          }
                        }
                      ].map(preset => (
                        <Button
                          key={preset.name}
                          variant="outline"
                          size="sm"
                          className="text-xs h-9 justify-start px-3 border-border/50 bg-background"
                          onClick={() => {
                            setResume({ ...resume, theme: preset.config as ThemeConfig });
                            showSuccess(`Applied ${preset.name} preset`);
                          }}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* <div className="pt-2 border-t border-border">
                    <h3 className="font-semibold text-xs mb-2 text-foreground uppercase tracking-wider">Saved Custom Theme</h3>
                    {customThemes.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {customThemes.map(ct => (
                          <div key={ct.id} className="flex items-center justify-between bg-background p-2 rounded-lg border text-xs">
                            <span className="font-medium truncate mr-2">{ct.name}</span>
                            <div className="flex gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-primary"
                                onClick={() => {
                                  setResume({ ...resume, theme: ct.config as ThemeConfig });
                                  showSuccess(`Loaded ${ct.name}`);
                                }}
                              >
                                Load
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                                onClick={() => handleDeleteCustomTheme(ct.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mb-3">No custom themes saved yet.</p>
                    )}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Theme Name..."
                        className="h-8 text-xs"
                        value={newThemeName}
                        onChange={e => setNewThemeName(e.target.value)}
                      />
                      <Button size="sm" className="h-8 text-xs font-semibold shrink-0" onClick={handleSaveCustomTheme}>
                        Save Current
                      </Button>
                    </div>
                  </div> */}
                </div>

                <Accordion defaultValue={["colorTheme"]} className="w-full space-y-3">
                  {/* Color Theme */}
                  <AccordionItem value="colorTheme" className="bg-card rounded-lg border border-border px-4 shadow-sm">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Color Theme</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-1 pb-4">
                      {/* Presets */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Palette Presets</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { name: 'Professional Blue', p: '#2563eb', s: '#1e3a8a', a: '#60a5fa' },
                            { name: 'Corporate Navy', p: '#0f172a', s: '#334155', a: '#3b82f6' },
                            { name: 'Emerald Green', p: '#059669', s: '#064e3b', a: '#34d399' },
                            { name: 'Crimson Red', p: '#dc2626', s: '#7f1d1d', a: '#f87171' },
                            { name: 'Modern Purple', p: '#7c3aed', s: '#4c1d95', a: '#a78bfa' },
                            { name: 'Orange Accent', p: '#ea580c', s: '#7c2d12', a: '#fb923c' },
                            { name: 'Teal Style', p: '#0d9488', s: '#115e59', a: '#2dd4bf' },
                            { name: 'Slate Palette', p: '#475569', s: '#1e293b', a: '#94a3b8' }
                          ].map(colorDef => (
                            <button
                              key={colorDef.name}
                              type="button"
                              onClick={() => setResume({
                                ...resume,
                                theme: {
                                  ...resume.theme,
                                  primaryColor: colorDef.p,
                                  secondaryColor: colorDef.s,
                                  accentColor: colorDef.a,
                                  headingColor: colorDef.p,
                                  linkColor: colorDef.p,
                                  dividerColor: '#cbd5e1'
                                } as ThemeConfig
                              })}
                              className="flex items-center gap-2 p-2 rounded-lg border text-left text-xs bg-background hover:bg-accent transition-colors"
                            >
                              <div className="flex -space-x-1">
                                <span className="w-3.5 h-3.5 rounded-full border border-background" style={{ backgroundColor: colorDef.p }} />
                                <span className="w-3.5 h-3.5 rounded-full border border-background" style={{ backgroundColor: colorDef.s }} />
                                <span className="w-3.5 h-3.5 rounded-full border border-background" style={{ backgroundColor: colorDef.a }} />
                              </div>
                              <span className="font-medium truncate">{colorDef.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Color Pickers */}
                      <div className="pt-2 border-t space-y-3">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Custom Colors</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: 'Primary', field: 'primaryColor' },
                            { label: 'Secondary', field: 'secondaryColor' },
                            { label: 'Accent', field: 'accentColor' },
                            { label: 'Heading', field: 'headingColor' },
                            { label: 'Body Text', field: 'bodyColor' },
                            { label: 'Link Color', field: 'linkColor' },
                            { label: 'Divider Color', field: 'dividerColor' },
                            { label: 'Background', field: 'backgroundColor' }
                          ].map(cfg => (
                            <div key={cfg.field} className="flex flex-col gap-1.5">
                              <span className="text-xs font-medium text-muted-foreground">{cfg.label}</span>
                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={resume.theme?.[cfg.field as keyof ThemeConfig] as string || '#000000'}
                                  onChange={e => setResume({
                                    ...resume,
                                    theme: { ...resume.theme, [cfg.field]: e.target.value } as ThemeConfig
                                  })}
                                  className="w-8 h-8 rounded border cursor-pointer p-0 overflow-hidden bg-transparent"
                                />
                                <span className="text-[11px] font-mono select-all">
                                  {resume.theme?.[cfg.field as keyof ThemeConfig] as string || 'default'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Typography */}
                  <AccordionItem value="typography" className="bg-card rounded-lg border border-border px-4 shadow-sm">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Typography</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-1 pb-4">
                      {/* Font Family Choice */}
                      <div className="grid grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {[
                          // Sans
                          { id: 'Inter, sans-serif', name: 'Inter', category: 'Sans Serif' },
                          { id: 'Poppins, sans-serif', name: 'Poppins', category: 'Sans Serif' },
                          { id: 'Outfit, sans-serif', name: 'Outfit', category: 'Sans Serif' },
                          { id: 'DM Sans, sans-serif', name: 'DM Sans', category: 'Sans Serif' },
                          { id: 'Open Sans, sans-serif', name: 'Open Sans', category: 'Sans Serif' },
                          // Serif
                          { id: 'Merriweather, serif', name: 'Merriweather', category: 'Serif' },
                          { id: 'Lora, serif', name: 'Lora', category: 'Serif' },
                          { id: 'Playfair Display, serif', name: 'Playfair Display', category: 'Serif' },
                          { id: 'Libre Baskerville, serif', name: 'Libre Baskerville', category: 'Serif' },
                          // Mono
                          { id: 'Roboto Mono, monospace', name: 'Roboto Mono', category: 'Monospace' },
                          { id: 'Fira Code, monospace', name: 'Fira Code', category: 'Monospace' }
                        ].map(font => (
                          <button
                            key={font.id}
                            type="button"
                            onClick={() => setResume({
                              ...resume,
                              theme: { ...resume.theme, fontFamily: font.id } as ThemeConfig
                            })}
                            style={{ fontFamily: font.id }}
                            className={`p-2.5 rounded-lg border text-left bg-background hover:bg-accent hover:border-primary/40 transition-all ${resume.theme?.fontFamily === font.id ? 'border-primary ring-1 ring-primary bg-primary/5' : ''}`}
                          >
                            <span className="text-[10px] text-muted-foreground uppercase block font-sans tracking-wide">{font.category}</span>
                            <span className="text-sm font-bold block mt-0.5">{font.name}</span>
                            <span className="text-xs text-muted-foreground block truncate">Aa Bb Cc 123</span>
                          </button>
                        ))}
                      </div>

                      {/* Font Size, Weight, Spacing controls */}
                      <div className="pt-2 border-t space-y-4">
                        {/* Sizes */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Heading Size</span>
                            <select
                              value={resume.theme?.fontSizeHeading || 20}
                              onChange={e => setResume({
                                ...resume,
                                theme: { ...resume.theme, fontSizeHeading: parseInt(e.target.value) } as ThemeConfig
                              })}
                              className="w-full h-8 rounded border text-xs px-2 bg-background focus:ring-1 focus:ring-primary"
                            >
                              {[14, 16, 18, 20, 22, 24, 26, 28].map(sz => (
                                <option key={sz} value={sz}>{sz}px</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-muted-foreground">Body Size</span>
                            <select
                              value={resume.theme?.fontSizeBody || 12}
                              onChange={e => setResume({
                                ...resume,
                                theme: { ...resume.theme, fontSizeBody: parseInt(e.target.value) } as ThemeConfig
                              })}
                              className="w-full h-8 rounded border text-xs px-2 bg-background focus:ring-1 focus:ring-primary"
                            >
                              {[9, 10, 11, 12, 13, 14, 15].map(sz => (
                                <option key={sz} value={sz}>{sz}px</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Font Weight */}
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-muted-foreground block">Body Font Weight</span>
                          <div className="flex gap-2">
                            {['300', '400', '500', '600'].map(weight => (
                              <Button
                                key={weight}
                                variant={resume.theme?.fontWeightBody === weight ? 'default' : 'outline'}
                                size="sm"
                                className="h-7 text-xs flex-1 font-semibold"
                                onClick={() => setResume({
                                  ...resume,
                                  theme: { ...resume.theme, fontWeightBody: weight } as ThemeConfig
                                })}
                              >
                                {weight === '300' ? 'Light' : weight === '400' ? 'Regular' : weight === '500' ? 'Medium' : 'Semibold'}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Line Height & Letter Spacing sliders */}
                        <div className="space-y-3 pt-2">
                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                              <span>Line Height</span>
                              <span>{resume.theme?.lineHeight || 1.4}</span>
                            </div>
                            <input
                              type="range"
                              min="1.0"
                              max="1.8"
                              step="0.1"
                              value={resume.theme?.lineHeight || 1.4}
                              onChange={e => setResume({
                                ...resume,
                                theme: { ...resume.theme, lineHeight: parseFloat(e.target.value) } as ThemeConfig
                              })}
                              className="w-full accent-primary cursor-pointer h-1 rounded"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                              <span>Letter Spacing</span>
                              <span>{resume.theme?.letterSpacing || 0}px</span>
                            </div>
                            <input
                              type="range"
                              min="-1"
                              max="4"
                              step="0.5"
                              value={resume.theme?.letterSpacing || 0}
                              onChange={e => setResume({
                                ...resume,
                                theme: { ...resume.theme, letterSpacing: parseFloat(e.target.value) } as ThemeConfig
                              })}
                              className="w-full accent-primary cursor-pointer h-1 rounded"
                            />
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Section Styles & Headings */}
                  <AccordionItem value="sectionStyles" className="bg-card rounded-lg border border-border px-4 shadow-sm">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Section Styles & Headings</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-1 pb-4">
                      {/* Section Styles Presets */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Heading Style Type</Label>
                        <select
                          value={resume.theme?.headingStyle || 'style1'}
                          onChange={e => setResume({
                            ...resume,
                            theme: { ...resume.theme, headingStyle: e.target.value as ThemeConfig['headingStyle'] } as ThemeConfig
                          })}
                          className="w-full h-9 rounded border text-xs px-2 bg-background focus:ring-1 focus:ring-primary"
                        >
                          <option value="style1">Style 1: Standard Plain Heading</option>
                          <option value="style2">Style 2: Bottom Border Accent</option>
                          <option value="style3">Style 3: Solid Left Border Bar</option>
                          <option value="style4">Style 4: Solid Square Prefix</option>
                          <option value="style5">Style 5: Mixed Left Border + Underline</option>
                        </select>
                      </div>

                      {/* Divider Options */}
                      <div className="space-y-1.5 pt-2 border-t">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Divider Style</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'solid', label: '────── Solid' },
                            { id: 'double', label: '══════ Double' },
                            { id: 'dotted', label: '········ Dotted' },
                            { id: 'dashed', label: '-------- Dashed' },
                            { id: 'none', label: 'No Divider' }
                          ].map(divOpt => (
                            <Button
                              key={divOpt.id}
                              variant={resume.theme?.dividerStyle === divOpt.id ? 'default' : 'outline'}
                              size="sm"
                              className="h-8 text-xs justify-start px-2.5"
                              onClick={() => setResume({
                                ...resume,
                                theme: { ...resume.theme, dividerStyle: divOpt.id as ThemeConfig['dividerStyle'] } as ThemeConfig
                              })}
                            >
                              {divOpt.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Layout & Margins */}
                  <AccordionItem value="layoutSettings" className="bg-card rounded-lg border border-border px-4 shadow-sm">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Layout & Density</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-1 pb-4">
                      {/* Density selectors */}
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Resume Density</Label>
                        <div className="flex gap-2">
                          {['compact', 'normal', 'comfortable'].map(d => (
                            <Button
                              key={d}
                              variant={resume.theme?.density === d ? 'default' : 'outline'}
                              size="sm"
                              className="h-8 text-xs flex-1 font-semibold"
                              onClick={() => setResume({
                                ...resume,
                                theme: {
                                  ...resume.theme,
                                  density: d as ThemeConfig['density'],
                                  contentPadding: d === 'compact' ? 16 : d === 'comfortable' ? 32 : 24,
                                  sectionSpacing: d === 'compact' ? 10 : d === 'comfortable' ? 24 : 16
                                } as ThemeConfig
                              })}
                            >
                              {d.charAt(0).toUpperCase() + d.slice(1)}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Sliders */}
                      <div className="space-y-3 pt-2 border-t">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                            <span>Content Padding</span>
                            <span>{resume.theme?.contentPadding !== undefined ? resume.theme.contentPadding : 24}px</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="36"
                            step="2"
                            value={resume.theme?.contentPadding !== undefined ? resume.theme.contentPadding : 24}
                            onChange={e => setResume({
                              ...resume,
                              theme: { ...resume.theme, contentPadding: parseInt(e.target.value) } as ThemeConfig
                            })}
                            className="w-full accent-primary cursor-pointer h-1 rounded"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                            <span>Section Spacing</span>
                            <span>{resume.theme?.sectionSpacing !== undefined ? resume.theme.sectionSpacing : 16}px</span>
                          </div>
                          <input
                            type="range"
                            min="8"
                            max="32"
                            step="2"
                            value={resume.theme?.sectionSpacing !== undefined ? resume.theme.sectionSpacing : 16}
                            onChange={e => setResume({
                              ...resume,
                              theme: { ...resume.theme, sectionSpacing: parseInt(e.target.value) } as ThemeConfig
                            })}
                            className="w-full accent-primary cursor-pointer h-1 rounded"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                            <span>Border Radius</span>
                            <span>{resume.theme?.borderRadius !== undefined ? resume.theme.borderRadius : 4}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="16"
                            step="2"
                            value={resume.theme?.borderRadius !== undefined ? resume.theme.borderRadius : 4}
                            onChange={e => setResume({
                              ...resume,
                              theme: { ...resume.theme, borderRadius: parseInt(e.target.value) } as ThemeConfig
                            })}
                            className="w-full accent-primary cursor-pointer h-1 rounded"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Profile Photo */}
                  <AccordionItem value="profilePhoto" className="bg-card rounded-lg border border-border px-4 shadow-sm">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Profile Photo Settings</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-1 pb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-muted-foreground">Show Profile Photo</span>
                        <input
                          type="checkbox"
                          checked={resume.theme?.photoEnabled !== false}
                          onChange={e => setResume({
                            ...resume,
                            theme: { ...resume.theme, photoEnabled: e.target.checked } as ThemeConfig
                          })}
                          className="w-4 h-4 rounded accent-primary cursor-pointer"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-muted-foreground">Photo Shape</span>
                          <select
                            value={resume.theme?.photoShape || 'circle'}
                            onChange={e => setResume({
                              ...resume,
                              theme: { ...resume.theme, photoShape: e.target.value as ThemeConfig['photoShape'] } as ThemeConfig
                            })}
                            className="w-full h-8 rounded border text-xs px-2 bg-background focus:ring-1 focus:ring-primary"
                          >
                            <option value="circle">Circle</option>
                            <option value="rounded-square">Rounded Square</option>
                            <option value="square">Square</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-muted-foreground">Photo Size</span>
                          <select
                            value={resume.theme?.photoSize || 'medium'}
                            onChange={e => setResume({
                              ...resume,
                              theme: { ...resume.theme, photoSize: e.target.value as ThemeConfig['photoSize'] } as ThemeConfig
                            })}
                            className="w-full h-8 rounded border text-xs px-2 bg-background focus:ring-1 focus:ring-primary"
                          >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                          </select>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Page Settings */}
                  <AccordionItem value="pageSettings" className="bg-card rounded-lg border border-border px-4 shadow-sm">
                    <AccordionTrigger className="text-sm font-semibold hover:no-underline py-3">Page Settings & Size</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-1 pb-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-muted-foreground">Paper Size</span>
                          <select
                            value={resume.theme?.paperSize || 'a4'}
                            onChange={e => setResume({
                              ...resume,
                              theme: { ...resume.theme, paperSize: e.target.value as ThemeConfig['paperSize'] } as ThemeConfig
                            })}
                            className="w-full h-8 rounded border text-xs px-2 bg-background focus:ring-1 focus:ring-primary"
                          >
                            <option value="a4">A4</option>
                            <option value="letter">Letter</option>
                            <option value="legal">Legal</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-xs font-semibold text-muted-foreground">Orientation</span>
                          <select
                            value={resume.theme?.orientation || 'portrait'}
                            onChange={e => setResume({
                              ...resume,
                              theme: { ...resume.theme, orientation: e.target.value as ThemeConfig['orientation'] } as ThemeConfig
                            })}
                            className="w-full h-8 rounded border text-xs px-2 bg-background focus:ring-1 focus:ring-primary"
                          >
                            <option value="portrait">Portrait</option>
                            <option value="landscape">Landscape</option>
                          </select>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="pt-4 border-t flex gap-3">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1 font-semibold text-xs"
                    onClick={() => {
                      setResume({
                        ...resume,
                        theme: {
                          primaryColor: '#0f172a',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: 'medium',
                          spacing: 'normal'
                        } as ThemeConfig
                      });
                      showSuccess('Theme configuration reset to defaults');
                    }}
                  >
                    Reset Theme to Defaults
                  </Button>
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

        {/* Resizable Divider Handle (Hidden on Mobile) */}
        {!showPreviewMobile && (
          <div
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDividerDoubleClick}
            className={`hidden md:block w-2 relative z-50 cursor-col-resize select-none group transition-all duration-200 ${isResizing ? 'bg-primary/20' : 'bg-transparent hover:bg-primary/10'}`}
          >
            {/* Wider invisible grab handle */}
            <div className="absolute inset-y-0 -left-1.5 -right-1.5 cursor-col-resize z-50" />
            {/* Visual divider line */}
            <div className={`absolute left-1/2 -translate-x-1/2 inset-y-0 w-[1px] transition-all ${isResizing ? 'bg-primary h-full w-[2px]' : 'bg-border/60 group-hover:bg-primary/60 group-hover:w-[2px]'}`} />
          </div>
        )}

        {/* Live Preview Panel */}
        <div
          className={`bg-muted/30 flex-col relative md:border-l border-border/50 ${showPreviewMobile ? 'flex w-full' : 'hidden md:flex'}`}
          style={{
            width: `${100 - splitPosition}%`,
            minWidth: '450px'
          }}
        >
          {/* Zoom & Page Controls Toolbar */}
          <div className="shrink-0 border-b border-border/50 bg-background/95 px-4 py-2 flex items-center justify-between gap-2 z-20 text-xs font-semibold text-muted-foreground shadow-sm">
            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleZoomOut}
                title="Zoom Out (Ctrl -)"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <span className="w-12 text-center select-none font-medium">{Math.round(zoom * 100)}%</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleZoomIn}
                title="Zoom In (Ctrl +)"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleFitWidth}
                title="Fit Width (Ctrl 1)"
              >
                Fit Width
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleFitPage}
                title="Fit Page (Ctrl Shift 1)"
              >
                Fit Page
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                onClick={handleZoomReset}
                title="100% (Ctrl 0)"
              >
                100%
              </Button>
            </div>
          </div>

          {/* Viewport Scroll Container */}
          <div
            ref={previewScrollContainerRef}
            onScroll={handlePreviewScroll}
            onWheel={handleWheel}
            onMouseDown={handlePreviewMouseDown}
            onMouseMove={handlePreviewMouseMove}
            onMouseUp={handlePreviewMouseUp}
            onMouseLeave={handlePreviewMouseUp}
            className={`w-full flex-1 overflow-auto custom-scrollbar relative flex p-6 ${isSpacePressedRef.current ? 'cursor-grab' : ''} ${isPanning ? 'cursor-grabbing' : ''}`}
            style={{
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}
          >
            {/* Sized Wrapper to reserve space for scaled element, avoiding clipping */}
            <div
              style={{
                width: `${800 * zoom}px`,
                height: `${resumeHeight * zoom}px`,
                position: 'relative',
                flexShrink: 0,
                transition: 'width 75ms ease-out, height 75ms ease-out'
              }}
            >
              <div
                ref={previewInnerRef}
                className="shadow-2xl border border-border/50 bg-white"
                style={{
                  width: '800px',
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  left: 0,
                  top: 0
                }}
              >
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

