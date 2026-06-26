'use client';

import { useState, useEffect, useCallback } from 'react';
import { Resume } from '@/types';
import { 
  Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileText, MoreVertical, Edit3, Copy, Trash2, Download, 
  History, Plus, UploadCloud, FileEdit, Clock, Target
} from 'lucide-react';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { useRouter } from 'next/navigation';
import { 
  deleteResumeAction, renameResumeAction, duplicateResumeAction, 
  deleteVersionAction, restoreVersionAction 
} from './actions';
import { getResumeVersionsAction, saveResumeVersionAction } from '../builder/actions';
import { formatDistanceToNow } from 'date-fns';
import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toast';

interface ResumesClientProps {
  initialResumes: Resume[];
}

export default function ResumesClient({ initialResumes }: ResumesClientProps) {
  const router = useRouter();
  const [resumes, setResumes] = useState<Resume[]>(initialResumes);
  const [hydrated, setHydrated] = useState(false);
  
  // Dialog States
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newVersionDialogOpen, setNewVersionDialogOpen] = useState(false);
  const [versionsDrawerOpen, setVersionsDrawerOpen] = useState(false);
  
  // Target Resume State
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [versionName, setVersionName] = useState('');
  const [versions, setVersions] = useState<{id: string, name: string, created_at: string}[]>([]);
  
  // Loading States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);

  // Merge localStorage resumes into the list on the client.
  useEffect(() => {
    let isMounted = true;
    
    const hydrate = async () => {
      try {
        const { lsGetAllResumes } = await import('@/lib/local-storage-service');
        if (!isMounted) return;
        
        const lsResumes = lsGetAllResumes();
        
        if (lsResumes.length > 0) {
          const existingIds = new Set(initialResumes.map(r => r.id));
          const newOnes = lsResumes.filter(r => !existingIds.has(r.id));
          
          if (newOnes.length > 0) {
            setResumes(
              [...initialResumes, ...newOnes].sort((a, b) => 
                new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
              )
            );
          } else {
            setResumes(initialResumes);
          }
        } else {
          setResumes(initialResumes);
        }
      } catch {
        if (isMounted) setResumes(initialResumes);
      } finally {
        if (isMounted) setHydrated(true);
      }
    };
    
    hydrate();
    
    return () => {
      isMounted = false;
    };
  }, [initialResumes]);

  const handleEdit = (resume: Resume) => {
    // In a real app we might set this resume ID in some global state or session
    // For now we assume builder loads the latest, or builder takes an ID param
    // Let's redirect to builder
    router.push(`/dashboard/builder?id=${resume.id}`);
  };

  const handleExport = (resume: Resume) => {
    router.push(`/dashboard/export?id=${resume.id}`);
  };

  const openRenameDialog = (resume: Resume) => {
    setActiveResume(resume);
    setNewTitle(resume.title || 'Untitled');
    setRenameDialogOpen(true);
  };

  const submitRename = async () => {
    if (!activeResume || !newTitle.trim()) return;
    setIsProcessing(true);
    const toastId = showLoading('Renaming resume...');
    try {
      let error: string | null = null;

      if (activeResume.id.startsWith('ls_')) {
        // localStorage-backed resume — handle client-side
        const { lsRenameResume } = await import('@/lib/local-storage-service');
        const result = lsRenameResume(activeResume.id, newTitle);
        error = result.error;
      } else {
        const result = await renameResumeAction(activeResume.id, newTitle);
        error = result?.error ?? null;
      }

      if (error) throw new Error(error);
      
      // Update local state for immediate feedback
      setResumes(resumes.map(r => r.id === activeResume.id ? { ...r, title: newTitle } : r));
      
      setRenameDialogOpen(false);
      showSuccess('Resume renamed successfully');
    } catch (error) {
      console.error('Rename error:', error);
      showError(error instanceof Error ? error.message : 'Failed to rename resume');
    } finally {
      dismissToast(toastId);
      setIsProcessing(false);
    }
  };

  const openDeleteDialog = (resume: Resume) => {
    setActiveResume(resume);
    setDeleteDialogOpen(true);
  };

  const submitDelete = async () => {
    if (!activeResume) return;
    setIsProcessing(true);
    const toastId = showLoading('Deleting resume...');
    try {
      let error: string | null = null;

      if (activeResume.id.startsWith('ls_')) {
        const { lsDeleteResume } = await import('@/lib/local-storage-service');
        const result = lsDeleteResume(activeResume.id);
        error = result.error;
      } else {
        const result = await deleteResumeAction(activeResume.id);
        error = result?.error ?? null;
      }

      if (error) throw new Error(error);
      
      setResumes(resumes.filter(r => r.id !== activeResume.id));
      
      setDeleteDialogOpen(false);
      showSuccess('Resume deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete resume');
    } finally {
      dismissToast(toastId);
      setIsProcessing(false);
    }
  };

  const handleDuplicate = async (resume: Resume) => {
    setIsProcessing(true);
    const toastId = showLoading('Duplicating resume...');
    try {
      let newId: string | null = null;
      let error: string | null = null;

      if (resume.id.startsWith('ls_')) {
        const { lsDuplicateResume, lsGetAllResumes } = await import('@/lib/local-storage-service');
        const result = lsDuplicateResume(resume.id);
        newId = result.newId;
        error = result.error;
        if (newId) {
          // Refresh local list without a server round-trip
          setResumes(lsGetAllResumes());
          showSuccess('Resume duplicated successfully');
        }
      } else {
        const result = await duplicateResumeAction(resume.id);
        newId = result?.newId ?? null;
        error = result?.error ?? null;
        if (newId) {
          router.refresh();
          showSuccess('Resume duplicated successfully');
        }
      }

      if (error) showError(error);
    } catch (error) {
      console.error('Duplicate error:', error);
      showError(error instanceof Error ? error.message : 'Failed to duplicate resume');
    } finally {
      dismissToast(toastId);
      setIsProcessing(false);
    }
  };

  const openNewVersionDialog = (resume: Resume) => {
    setActiveResume(resume);
    setVersionName(`v${Math.floor(Math.random() * 100)} - Draft`);
    setNewVersionDialogOpen(true);
  };

  const submitNewVersion = async () => {
    if (!activeResume || !versionName.trim()) return;
    setIsProcessing(true);
    const toastId = showLoading('Saving new version...');
    try {
      const result = await saveResumeVersionAction(activeResume.id, versionName, activeResume);
      if (result?.error) throw new Error(result.error);
      setNewVersionDialogOpen(false);
      showSuccess('Version saved successfully');
    } catch (error) {
      console.error('Save version error:', error);
      showError(error instanceof Error ? error.message : 'Failed to save version');
    } finally {
      dismissToast(toastId);
      setIsProcessing(false);
    }
  };

  const openVersionsDrawer = async (resume: Resume) => {
    setActiveResume(resume);
    setVersionsDrawerOpen(true);
    setIsLoadingVersions(true);
    try {
      const data = await getResumeVersionsAction(resume.id);
      setVersions(data || []);
    } catch (error) {
      console.error('Load versions error:', error);
      showError('Failed to load version history');
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!activeResume) return;
    setIsProcessing(true);
    const toastId = showLoading('Restoring version...');
    try {
      const result = await restoreVersionAction(activeResume.id, versionId);
      if (result?.error) throw new Error(result.error);
      router.refresh(); // Refresh page to get latest content
      setVersionsDrawerOpen(false);
      showSuccess('Version restored successfully');
    } catch (error) {
      console.error('Restore version error:', error);
      showError(error instanceof Error ? error.message : 'Failed to restore version');
    } finally {
      dismissToast(toastId);
      setIsProcessing(false);
    }
  };

  const handleDeleteVersion = async (versionId: string) => {
    setIsProcessing(true);
    const toastId = showLoading('Deleting version...');
    try {
      const result = await deleteVersionAction(versionId);
      if (result?.error) throw new Error(result.error);
      setVersions(versions.filter(v => v.id !== versionId));
      showSuccess('Version deleted successfully');
    } catch (error) {
      console.error('Delete version error:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete version');
    } finally {
      dismissToast(toastId);
      setIsProcessing(false);
    }
  };

  // Don't flash the empty state before localStorage has been checked.
  if (!hydrated) return null;

  if (resumes.length === 0) {
    return (
      <div className="p-8 w-full space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm border border-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">My Resumes</h1>
            <p className="text-muted-foreground mt-1 text-lg">Manage and organize your saved resumes.</p>
          </div>
        </div>
      </div>
        
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl bg-card/50">
          <FileText className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No resumes yet</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Create your first resume to start matching with jobs and generating cover letters.
          </p>
          <div className="flex items-center gap-4">
            <Button onClick={() => router.push('/dashboard/builder?id=new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create New
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard/upload')}>
              <UploadCloud className="mr-2 h-4 w-4" />
              Upload Existing
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 w-full space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm border border-primary/10">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">My Resumes</h1>
            <p className="text-muted-foreground mt-1 text-lg">Manage and organize your saved resumes.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push('/dashboard/upload')}>
            <UploadCloud className="h-4 w-4 mr-2" /> Upload
          </Button>
          <Button size="sm" onClick={() => router.push('/dashboard/builder?id=new')}>
            <Plus className="h-4 w-4 mr-2" /> New Resume
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resumes.map((resume) => (
          <Card key={resume.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group border-border rounded-2xl">
            <CardHeader className="pb-4 bg-secondary border-b relative">
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-8 w-8 bg-background/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleEdit(resume)}>
                        <Edit3 className="mr-2 h-4 w-4 text-primary" /> Edit content
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openRenameDialog(resume)}>
                        <FileEdit className="mr-2 h-4 w-4 text-primary" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(resume)}>
                        <Copy className="mr-2 h-4 w-4 text-success" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport(resume)}>
                        <Download className="mr-2 h-4 w-4 text-primary" /> Export PDF
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openNewVersionDialog(resume)}>
                        <Plus className="mr-2 h-4 w-4" /> Save Version
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openVersionsDrawer(resume)}>
                        <History className="mr-2 h-4 w-4" /> View Versions
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => openDeleteDialog(resume)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-background border border-border flex items-center justify-center mb-3 text-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg truncate pr-8 flex items-center gap-2" title={resume.title || 'Untitled'}>
                {resume.title || 'Untitled'}
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${resume.isDraft ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                  {resume.isDraft ? 'Draft' : 'Saved'}
                </span>
              </CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Target className="h-3.5 w-3.5 mr-1" />
                {resume.targetRole || 'General Resume'}
              </CardDescription>
            </CardHeader>
            <CardContent className="py-4 flex-1">
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs font-medium">Last Updated</span>
                  <span className="font-medium truncate">{resume.lastModified ? formatDistanceToNow(new Date(resume.lastModified), { addSuffix: true }) : 'Unknown'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-xs font-medium">Template</span>
                  <span className="font-medium capitalize truncate">{resume.templateId?.replace('tpl_', '') || 'Classic'}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pb-4 border-t mt-auto flex gap-2">
              <Button className="w-full" variant="default" size="sm" onClick={() => handleEdit(resume)}>
                Edit Resume
              </Button>
              <Button className="w-full" variant="outline" size="sm" onClick={() => handleExport(resume)}>
                Export
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Resume</DialogTitle>
            <DialogDescription>Enter a new title for this resume.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="title" className="mb-2 block">Resume Title</Label>
            <Input id="title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)} disabled={isProcessing}>Cancel</Button>
            <Button onClick={submitRename} disabled={!newTitle.trim() || isProcessing}>
              {isProcessing ? 'Saving...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{activeResume?.title}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isProcessing}>Cancel</Button>
            <Button variant="destructive" onClick={submitDelete} disabled={isProcessing}>
              {isProcessing ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Version Dialog */}
      <Dialog open={newVersionDialogOpen} onOpenChange={setNewVersionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save New Version</DialogTitle>
            <DialogDescription>Save a snapshot of the current resume content.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="versionName" className="mb-2 block">Version Name</Label>
            <Input id="versionName" value={versionName} onChange={(e) => setVersionName(e.target.value)} autoFocus />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewVersionDialogOpen(false)} disabled={isProcessing}>Cancel</Button>
            <Button onClick={submitNewVersion} disabled={!versionName.trim() || isProcessing}>
              {isProcessing ? 'Saving...' : 'Save Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Versions Drawer */}
      <Sheet open={versionsDrawerOpen} onOpenChange={setVersionsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center">
              <History className="mr-2 h-5 w-5 text-primary" /> 
              Version History
            </SheetTitle>
            <SheetDescription>
              Manage saved versions for &quot;{activeResume?.title}&quot;.
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4">
            {isLoadingVersions ? (
              <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                Loading versions...
              </div>
            ) : versions.length === 0 ? (
              <div className="py-8 text-center border rounded-lg bg-muted/20">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No versions saved yet.</p>
                <p className="text-xs text-muted-foreground mt-1">Save a version to track changes over time.</p>
              </div>
            ) : (
              versions.map((v) => (
                <div key={v.id} className="border rounded-lg p-4 bg-card shadow-sm group">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-sm">{v.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {v.created_at ? formatDistanceToNow(new Date(v.created_at), { addSuffix: true }) : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => handleRestoreVersion(v.id)} disabled={isProcessing}>
                      Restore
                    </Button>
                    <Button size="sm" variant="destructive" className="w-full text-xs" onClick={() => handleDeleteVersion(v.id)} disabled={isProcessing}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
