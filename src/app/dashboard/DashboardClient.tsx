'use client';

import { useState, useEffect } from 'react';
import { Resume, MatchReport, AtsReport, CoverLetter } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { 
  FileText, Target, TrendingUp, Briefcase, Plus, Clock, History, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ResumeCard } from '@/components/dashboard/ResumeCard';
import { CreateResumeDialog } from '@/components/dashboard/CreateResumeDialog';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { useResumes } from '@/context/ResumeContext';
import { deleteVersionAction, restoreVersionAction } from './resumes/actions';
import { getResumeVersionsAction, saveResumeVersionAction } from './builder/actions';
import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toast';
import { formatDistanceToNow } from 'date-fns';

interface DashboardClientProps {
  stats: {
    totalResumes: number;
    latestAtsScore: number;
    coverLetters: number;
  };
  userName: string;
}

export default function DashboardClient({ stats, userName }: DashboardClientProps) {
  const router = useRouter();
  const { 
    resumes, 
    isLoading: contextLoading, 
    renameResume, 
    deleteResume, 
    duplicateResume 
  } = useResumes();

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

  // Career Modules States
  const [matchReports, setMatchReports] = useState<MatchReport[]>([]);
  const [atsReports, setAtsReports] = useState<AtsReport[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);

  // Loading States
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [exportingResume, setExportingResume] = useState<Resume | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState<string | null>(null);

  useEffect(() => {
    const loadCareerData = async () => {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { getMatchReportsAction, getAtsReportsAction, getCoverLettersAction } = await import('./career-actions');
        const [mr, ats, cl] = await Promise.all([
          getMatchReportsAction(),
          getAtsReportsAction(),
          getCoverLettersAction()
        ]);
        setMatchReports(mr);
        setAtsReports(ats);
        setCoverLetters(cl);
      } else {
        const { lsGetMatchReports, lsGetAtsReports, lsGetCoverLetters } = await import('@/lib/local-storage-service');
        setMatchReports(lsGetMatchReports());
        setAtsReports(lsGetAtsReports());
        setCoverLetters(lsGetCoverLetters());
      }
    };
    loadCareerData();
  }, []);

  const handleEdit = (resume: Resume) => {
    router.push(`/dashboard/builder?id=${resume.id}`);
  };

  const handleExport = async (resume: Resume) => {
    setIsExportingPDF(resume.id);
    setExportingResume(resume);
    const toastId = showLoading('Generating PDF...');
    
    try {
      const formatName = (name: string) => {
        if (!name) return '';
        const trimmed = name.trim();
        return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
      };

      const firstName = formatName(resume.personalInfo?.firstName) || 'Firstname';
      const lastName = formatName(resume.personalInfo?.lastName) || 'Lastname';
      const filename = `${firstName}_${lastName}_Resume.pdf`;
      
      // Wait for React to render the hidden preview element
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const { generatePDF } = await import('@/lib/export-utils');
      await generatePDF(`resume-pdf-render-${resume.id}`, filename);
      
      showSuccess('PDF exported successfully!');
    } catch (err) {
      console.error('Export failed:', err);
      showError('Failed to export PDF. Please try again.');
    } finally {
      dismissToast(toastId);
      setIsExportingPDF(null);
      setExportingResume(null);
    }
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
      const { error } = await renameResume(activeResume.id, newTitle);
      if (error) throw new Error(error);
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
      const { error } = await deleteResume(activeResume.id);
      if (error) throw new Error(error);
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
      const { error } = await duplicateResume(resume.id);
      if (error) showError(error);
      else showSuccess('Resume duplicated successfully');
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
      router.refresh();
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

  const recentResumes = resumes.slice(0, 3);
  const profileStrength = Math.min(100, 40 + (resumes.length * 15));
  
  let atsFeedback = "Needs improvement";
  if (stats.latestAtsScore >= 80) atsFeedback = "Excellent fit for recent roles";
  else if (stats.latestAtsScore >= 60) atsFeedback = "Good fit for recent roles";

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userName.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Here is what is happening with your job search today.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/matcher">
            <Button variant="outline">Match Job</Button>
          </Link>
          <CreateResumeDialog />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Profile Strength</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileStrength}%</div>
            <Progress value={profileStrength} className="mt-3 h-1.5" />
            <p className="text-xs text-muted-foreground mt-3">
              Based on your active resumes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Avg ATS Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.latestAtsScore}/100</div>
            <p className="text-xs text-muted-foreground mt-3 font-medium">
              {atsFeedback}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Resumes Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resumes.length}</div>
            <p className="text-xs text-muted-foreground mt-3">
              Total created so far
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Cover Letters</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.coverLetters}</div>
            <p className="text-xs text-muted-foreground mt-3">
              Total generated so far
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Recent Resumes</h2>
            <p className="text-muted-foreground text-sm">Your most recently edited resumes.</p>
          </div>
          {resumes.length > 0 && (
            <Link href="/dashboard/resumes">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          )}
        </div>
        
        {!contextLoading ? (
          recentResumes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentResumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onEdit={handleEdit}
                  onRename={openRenameDialog}
                  onDuplicate={handleDuplicate}
                  onDelete={openDeleteDialog}
                  onExport={handleExport}
                  onSaveVersion={openNewVersionDialog}
                  onViewVersions={openVersionsDrawer}
                  isExporting={isExportingPDF === resume.id}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl bg-card/50">
              <FileText className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">No resumes yet</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Create your first resume to start matching with jobs and generating cover letters.
              </p>
              <CreateResumeDialog />
            </div>
          )
        ) : (
          <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center min-h-[200px]">
            <Loader2 className="animate-spin h-8 w-8 text-primary mb-2" />
            <span>Loading recent resumes...</span>
          </div>
        )}
      </div>

      {/* Career Platform Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        {/* Job Matcher Overview Card */}
        <Card className="rounded-2xl border-border flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> Job Matcher
            </CardTitle>
            <CardDescription>Evaluate alignment with target job descriptions.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            {matchReports.length > 0 ? (
              matchReports.slice(0, 2).map((r) => (
                <div key={r.id} className="p-3 border rounded-xl flex justify-between items-center text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-foreground block truncate">{r.jobTitle}</span>
                    <span className="text-muted-foreground block truncate">{r.companyName}</span>
                  </div>
                  <span className="bg-primary/10 text-primary font-black px-2 py-0.5 rounded-full shrink-0 ml-2">{r.matchScore}%</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic py-4">No recent job matches run.</p>
            )}
          </CardContent>
          <CardFooter className="pt-2 border-t bg-secondary/10 rounded-b-2xl">
            <Link href="/dashboard/matcher" className="w-full">
              <Button variant="ghost" size="sm" className="w-full text-xs font-semibold">
                Go to Job Matcher
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* ATS Reports Overview Card */}
        <Card className="rounded-2xl border-border flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> ATS Audits
            </CardTitle>
            <CardDescription>Analyze keyword density and formatting.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            {atsReports.length > 0 ? (
              atsReports.slice(0, 2).map((r) => (
                <div key={r.id} className="p-3 border rounded-xl flex justify-between items-center text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-foreground block truncate">{r.resumeTitle}</span>
                    <span className="text-muted-foreground block truncate">Scanned {new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className="bg-primary/10 text-primary font-black px-2 py-0.5 rounded-full shrink-0 ml-2">{r.overallScore}%</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic py-4">No recent ATS compatibility scans.</p>
            )}
          </CardContent>
          <CardFooter className="pt-2 border-t bg-secondary/10 rounded-b-2xl">
            <Link href="/dashboard/ats" className="w-full">
              <Button variant="ghost" size="sm" className="w-full text-xs font-semibold">
                Go to ATS Analyzer
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Cover Letters Overview Card */}
        <Card className="rounded-2xl border-border flex flex-col h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" /> Cover Letters
            </CardTitle>
            <CardDescription>Draft customized cover letters with AI.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 space-y-3">
            {coverLetters.length > 0 ? (
              coverLetters.slice(0, 2).map((l) => (
                <div key={l.id} className="p-3 border rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-foreground block truncate">{l.title}</span>
                  </div>
                  <span className="text-muted-foreground block truncate">{l.companyName} • {l.tone} Tone</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground italic py-4">No cover letters generated yet.</p>
            )}
          </CardContent>
          <CardFooter className="pt-2 border-t bg-secondary/10 rounded-b-2xl">
            <Link href="/dashboard/cover-letters" className="w-full">
              <Button variant="ghost" size="sm" className="w-full text-xs font-semibold">
                Manage Cover Letters
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Hidden Resume Preview for PDF Generation */}
      {exportingResume && (
        <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none opacity-0 -z-50">
          <div id={`resume-pdf-render-${exportingResume.id}`}>
            <ResumePreview resume={exportingResume} />
          </div>
        </div>
      )}

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
                <Loader2 className="animate-spin h-8 w-8 text-primary mb-2" />
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
