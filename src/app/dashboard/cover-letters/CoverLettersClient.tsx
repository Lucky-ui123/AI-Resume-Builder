'use client';

import { useState, useEffect, useRef } from 'react';
import { useResumes } from '@/context/ResumeContext';
import { Resume, CoverLetter } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  FileSignature, Loader2, Sparkles, Download, Save, Copy, 
  Trash2, FileEdit, Plus, Wand2, Minimize2, Maximize2 
} from 'lucide-react';
import { 
  saveCoverLetterAction, 
  getCoverLettersAction, 
  deleteCoverLetterAction, 
  renameCoverLetterAction, 
  duplicateCoverLetterAction,
  generateCoverLetterAiAction,
  rewriteCoverLetterAiAction
} from '../career-actions';
import { 
  lsSaveCoverLetter, 
  lsGetCoverLetters, 
  lsDeleteCoverLetter, 
  lsRenameCoverLetter, 
  lsDuplicateCoverLetter 
} from '@/lib/local-storage-service';
import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toast';

export default function CoverLettersClient() {
  const { resumes, isLoading: resumesLoading } = useResumes();
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [hiringManager, setHiringManager] = useState('');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('Medium');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [letterContent, setLetterContent] = useState('');
  const [activeLetter, setActiveLetter] = useState<CoverLetter | null>(null);
  const [lettersList, setLettersList] = useState<CoverLetter[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);

  useEffect(() => {
    if (resumes.length > 0 && !selectedResumeId) {
      setSelectedResumeId(resumes[0].id);
    }
  }, [resumes, selectedResumeId]);

  // Load saved letters
  const loadLetters = async () => {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const data = await getCoverLettersAction();
      setLettersList(data);
    } else {
      setLettersList(lsGetCoverLetters());
    }
  };

  useEffect(() => {
    loadLetters();
  }, []);

  const handleGenerate = async () => {
    const resume = resumes.find(r => r.id === selectedResumeId);
    if (!resume) {
      showError('Please select a resume.');
      return;
    }
    if (!companyName.trim() || !jobTitle.trim()) {
      showError('Please specify target job title and company.');
      return;
    }

    setIsGenerating(true);
    const toastId = showLoading('Drafting cover letter...');
    try {
      const content = await generateCoverLetterAiAction({
        resume,
        jobDescription,
        companyName,
        hiringManager,
        tone,
        length
      });
      setLetterContent(content);
      
      const newLetter: CoverLetter = {
        id: 'new',
        title: `Cover Letter - ${jobTitle} at ${companyName}`,
        resumeId: selectedResumeId,
        jobTitle,
        companyName,
        jobDescription,
        hiringManager,
        tone,
        length,
        content,
        lastModified: new Date().toISOString()
      };
      setActiveLetter(newLetter);
      showSuccess('Cover letter drafted!');
    } catch (err) {
      console.error(err);
      showError('Failed to generate cover letter.');
    } finally {
      dismissToast(toastId);
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!activeLetter || !letterContent.trim()) return;
    setIsSaving(true);
    const toastId = showLoading('Saving cover letter...');
    try {
      const payload = { ...activeLetter, content: letterContent };
      let savedId = '';
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const res = await saveCoverLetterAction(payload);
        if (res.error) throw new Error(res.error);
        savedId = res.id;
      } else {
        const saved = lsSaveCoverLetter(payload);
        savedId = saved.id;
      }
      showSuccess('Saved successfully!');
      setActiveLetter({ ...payload, id: savedId });
      loadLetters();
    } catch (err) {
      console.error(err);
      showError('Failed to save cover letter.');
    } finally {
      dismissToast(toastId);
      setIsSaving(false);
    }
  };

  const handleRewrite = async (instruction: string) => {
    if (!letterContent.trim()) return;
    setIsRewriting(true);
    const toastId = showLoading('Rewriting with AI...');
    try {
      const rewritten = await rewriteCoverLetterAiAction(letterContent, instruction);
      setLetterContent(rewritten);
      showSuccess('Cover letter updated!');
    } catch (err) {
      console.error(err);
      showError('Failed to rewrite.');
    } finally {
      dismissToast(toastId);
      setIsRewriting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const toastId = showLoading('Deleting cover letter...');
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const res = await deleteCoverLetterAction(id);
        if (res.error) throw new Error(res.error);
      } else {
        lsDeleteCoverLetter(id);
      }
      if (activeLetter?.id === id) {
        setActiveLetter(null);
        setLetterContent('');
      }
      showSuccess('Deleted successfully');
      loadLetters();
    } catch (err) {
      console.error(err);
      showError('Failed to delete.');
    } finally {
      dismissToast(toastId);
    }
  };

  const handleDuplicate = async (id: string) => {
    const toastId = showLoading('Duplicating cover letter...');
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const res = await duplicateCoverLetterAction(id);
        if (res.error) throw new Error(res.error);
      } else {
        lsDuplicateCoverLetter(id);
      }
      showSuccess('Duplicated successfully');
      loadLetters();
    } catch (err) {
      console.error(err);
      showError('Failed to duplicate.');
    } finally {
      dismissToast(toastId);
    }
  };

  const handleExportPDF = async () => {
    if (!letterContent.trim() || !activeLetter) return;
    const toastId = showLoading('Generating PDF...');
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const { generatePDF } = await import('@/lib/export-utils');
      await generatePDF(`cover-letter-pdf-render`, `CoverLetter_${activeLetter.companyName.replace(/\s+/g, '_')}.pdf`);
      showSuccess('PDF exported successfully!');
    } catch (err) {
      console.error(err);
      showError('Failed to export PDF.');
    } finally {
      dismissToast(toastId);
    }
  };

  if (resumesLoading) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary mb-2" />
        <span>Loading Cover Letters...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 font-sans">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/10">
          <FileSignature className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">AI Cover Letters</h1>
          <p className="text-muted-foreground mt-0.5 text-lg">Generate customized, professional cover letters tailored to your resumes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="text-xl">Letter Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resume-select">Select Resume</Label>
                <select
                  id="resume-select"
                  value={selectedResumeId}
                  onChange={(e) => setSelectedResumeId(e.target.value)}
                  className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {resumes.map(r => (
                    <option key={r.id} value={r.id}>{r.title || 'Untitled Resume'}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="job-title">Job Title</Label>
                  <Input 
                    id="job-title" 
                    value={jobTitle} 
                    onChange={(e) => setJobTitle(e.target.value)} 
                    placeholder="e.g. React Developer" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input 
                    id="company-name" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)} 
                    placeholder="e.g. Google" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hiring-manager">Hiring Manager (Optional)</Label>
                <Input 
                  id="hiring-manager" 
                  value={hiringManager} 
                  onChange={(e) => setHiringManager(e.target.value)} 
                  placeholder="e.g. Jane Doe" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tone-select">Tone</Label>
                  <select
                    id="tone-select"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Conversational">Conversational</option>
                    <option value="Bold">Bold & Enthusiastic</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="length-select">Length</Label>
                  <select
                    id="length-select"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="Short">Short (1-2 Paragraphs)</option>
                    <option value="Medium">Medium (3 Paragraphs)</option>
                    <option value="Long">Detailed (4+ Paragraphs)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="job-desc">Job Description (Optional)</Label>
                <Textarea 
                  id="job-desc" 
                  value={jobDescription} 
                  onChange={(e) => setJobDescription(e.target.value)} 
                  placeholder="Paste details to match letter content..." 
                  className="min-h-[100px] rounded-xl text-sm"
                />
              </div>

              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || !companyName.trim() || !jobTitle.trim()}
                className="w-full font-bold text-white py-6"
              >
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Drafting...</>
                ) : (
                  <><Sparkles className="mr-2 h-5 w-5" /> Generate Letter</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* History */}
          {lettersList.length > 0 && (
            <Card className="rounded-2xl border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Saved Letters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {lettersList.map(l => (
                  <div key={l.id} className="p-3 border rounded-xl flex justify-between items-center group">
                    <div 
                      onClick={() => {
                        setActiveLetter(l);
                        setLetterContent(l.content);
                      }}
                      className="min-w-0 flex-1 cursor-pointer"
                    >
                      <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{l.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">Modified {new Date(l.lastModified).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDuplicate(l.id)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(l.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Editor Panel */}
        <div className="lg:col-span-2 space-y-6">
          {activeLetter ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center gap-2">
                <Input 
                  value={activeLetter.title}
                  onChange={(e) => setActiveLetter({ ...activeLetter, title: e.target.value })}
                  className="text-xl font-bold tracking-tight bg-transparent border-b border-transparent hover:border-input focus:border-input focus:bg-background transition-all px-0 py-1 max-w-sm rounded-none"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                    <Save className="h-4 w-4 mr-2" /> Save
                  </Button>
                  <Button variant="default" size="sm" className="text-white" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-2" /> Export PDF
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Editor area */}
                <div className="md:col-span-3">
                  <Textarea
                    value={letterContent}
                    onChange={(e) => setLetterContent(e.target.value)}
                    className="min-h-[450px] font-sans text-base leading-relaxed p-6 rounded-2xl shadow-inner resize-none focus-visible:ring-1"
                  />
                </div>

                {/* Quick AI Refinement Actions */}
                <div className="md:col-span-1 space-y-4">
                  <Card className="rounded-2xl border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-primary" /> AI Refine
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-2">
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleRewrite('Shorten the letter')}>
                        <Minimize2 className="h-3.5 w-3.5 mr-1" /> Shorten
                      </Button>
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleRewrite('Expand the letter with more details')}>
                        <Maximize2 className="h-3.5 w-3.5 mr-1" /> Expand
                      </Button>
                      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => handleRewrite('Make the tone more enthusiastic')}>
                        Make Enthusiastic
                      </Button>

                      <div className="border-t pt-3 space-y-2">
                        <Label htmlFor="ai-instructions" className="text-xs">Custom Instruction</Label>
                        <Input 
                          id="ai-instructions" 
                          value={rewriteInstruction} 
                          onChange={(e) => setRewriteInstruction(e.target.value)} 
                          placeholder="e.g. Focus on React experience..." 
                          className="h-8 text-xs"
                        />
                        <Button 
                          size="sm" 
                          className="w-full text-xs text-white" 
                          onClick={() => {
                            handleRewrite(rewriteInstruction);
                            setRewriteInstruction('');
                          }}
                          disabled={!rewriteInstruction.trim() || isRewriting}
                        >
                          {isRewriting ? <Loader2 className="animate-spin h-3 w-3" /> : 'Apply Rewrite'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed border-border rounded-2xl bg-card min-h-[400px]">
              <FileSignature className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No Letter Drafted</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Input your target job details on the left, then click Generate to draft a customized cover letter.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden printable A4 Cover Letter for PDF Export */}
      {activeLetter && (
        <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none opacity-0 -z-50">
          <div id="cover-letter-pdf-render" className="p-16 bg-white text-slate-800 space-y-6 w-[21cm] font-serif text-[15px] leading-relaxed">
            <div className="border-b pb-6 font-sans">
              <h1 className="text-2xl font-black text-slate-900">COVER LETTER</h1>
              <p className="text-sm text-slate-500 mt-1">Generated by HireCraft AI</p>
            </div>
            
            {/* Split the content by double newlines to render clean paragraphs */}
            <div className="space-y-4 whitespace-pre-line text-slate-700">
              {letterContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
