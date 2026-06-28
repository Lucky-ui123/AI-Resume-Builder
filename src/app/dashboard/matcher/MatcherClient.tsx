'use client';

import { useState, useEffect, useRef } from 'react';
import { useResumes } from '@/context/ResumeContext';
import { MatchReport } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Target, Upload, Sparkles, 
  Download, Brain, FileCheck, Loader2 
} from 'lucide-react';
import { saveMatchReportAction, analyzeMatchAction } from '../career-actions';
import { lsSaveMatchReport } from '@/lib/local-storage-service';
import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toast';
import Link from 'next/link';

export default function MatcherClient() {
  const { resumes, isLoading: resumesLoading } = useResumes();
  const [selectedResumeIdState, setSelectedResumeId] = useState('');
  const selectedResumeId = selectedResumeIdState || (resumes.length > 0 ? resumes[0].id : '');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<MatchReport | null>(null);
  const [reportsList, setReportsList] = useState<MatchReport[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Load saved match reports on mount
  useEffect(() => {
    const loadReports = async () => {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { getMatchReportsAction } = await import('../career-actions');
        const data = await getMatchReportsAction();
        setReportsList(data);
      } else {
        const { lsGetMatchReports } = await import('@/lib/local-storage-service');
        setReportsList(lsGetMatchReports());
      }
    };
    loadReports();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['.txt', '.md', '.pdf', '.docx'];
    const isAllowed = allowed.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!isAllowed) {
      showError('Please upload a PDF, DOCX, TXT, or MD file.');
      return;
    }

    const toastId = showLoading(`Parsing ${file.name}...`);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/ai/parse-file', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setJobDescription(data.text || '');
      showSuccess(`Loaded job description from ${file.name}`);
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Error occurred';
      showError(`Failed to parse file: ${errorMessage}`);
    } finally {
      dismissToast(toastId);
    }
  };

  const handleCompare = async () => {
    const resume = resumes.find(r => r.id === selectedResumeId);
    if (!resume) {
      showError('Please select a resume.');
      return;
    }
    if (!jobDescription.trim()) {
      showError('Please paste or upload a job description.');
      return;
    }

    setIsAnalyzing(true);
    const toastId = showLoading('Analyzing match...');
    try {
      const analysis = await analyzeMatchAction(resume, jobDescription);
      
      const newReport: MatchReport = {
        ...analysis,
        id: `mr_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString()
      };
      setReport(newReport);
      showSuccess('Match analysis completed!');
    } catch (err) {
      console.error(err);
      showError('Failed to analyze match.');
    } finally {
      dismissToast(toastId);
      setIsAnalyzing(false);
    }
  };

  const handleSaveReport = async () => {
    if (!report) return;
    setIsSaving(true);
    const toastId = showLoading('Saving report...');
    try {
      let updatedReport = report;
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const res = await saveMatchReportAction(report);
        if (res.error) throw new Error(res.error);
        if (res.id) updatedReport = { ...report, id: res.id };
      } else {
        const saved = lsSaveMatchReport(report);
        updatedReport = { ...report, id: saved.id };
      }
      setReport(updatedReport);
      setReportsList(prev => [updatedReport, ...prev]);
      showSuccess('Report saved successfully!');
    } catch (err) {
      console.error(err);
      showError('Failed to save report.');
    } finally {
      dismissToast(toastId);
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!report) return;
    const toastId = showLoading('Generating PDF report...');
    try {
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 300));
      const { generatePDF } = await import('@/lib/export-utils');
      await generatePDF(`match-report-pdf-render`, `JobMatch_Report_${report.jobTitle.replace(/\s+/g, '_')}.pdf`);
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
        <span>Loading Job Matcher...</span>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Target className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Resumes Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">You need to create a resume first before you can use the Job Matcher.</p>
        <Link href="/dashboard/builder?id=new">
          <Button><Sparkles className="h-4 w-4 mr-2" /> Create Resume</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 font-sans">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/10">
          <Target className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">AI Job Matcher</h1>
          <p className="text-muted-foreground mt-0.5 text-lg">Evaluate how well your resume matches any specific job description.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="text-xl">Match Settings</CardTitle>
              <CardDescription>Select a resume and input the job parameters.</CardDescription>
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

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="job-desc">Job Description</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" /> Upload document
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".pdf,.docx,.txt,.md" 
                    className="hidden" 
                  />
                </div>
                <Textarea
                  id="job-desc"
                  placeholder="Paste the job description or requirements here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="min-h-[220px] rounded-xl text-sm"
                />
              </div>

              <Button 
                onClick={handleCompare} 
                disabled={isAnalyzing || !jobDescription.trim()}
                className="w-full font-bold text-white py-6"
              >
                {isAnalyzing ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles className="mr-2 h-5 w-5" /> Compare Resume</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* History list */}
          {reportsList.length > 0 && (
            <Card className="rounded-2xl border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Matches</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reportsList.map(r => (
                  <div 
                    key={r.id} 
                    onClick={() => setReport(r)}
                    className="p-3 border rounded-xl hover:border-primary hover:bg-secondary/20 transition-all cursor-pointer flex justify-between items-center group"
                  >
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm truncate">{r.jobTitle}</h4>
                      <p className="text-xs text-muted-foreground truncate">{r.companyName} • {r.resumeTitle}</p>
                    </div>
                    <span className="bg-primary/10 text-primary font-bold text-xs px-2 py-1 rounded-full group-hover:scale-105 transition-transform">
                      {r.matchScore}%
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {report ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">Match Results</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSaveReport} disabled={isSaving}>
                    <FileCheck className="h-4 w-4 mr-2" /> Save Report
                  </Button>
                  <Button variant="default" size="sm" className="text-white" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-2" /> Export PDF
                  </Button>
                </div>
              </div>

              {/* Match Score Card */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center border p-6 rounded-2xl bg-card shadow-sm">
                <div className="md:col-span-1 flex flex-col items-center justify-center text-center">
                  <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-primary/5 border border-primary/10 mb-2">
                    <span className="text-4xl font-extrabold text-primary">{report.matchScore}%</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Match Score</span>
                </div>
                <div className="md:col-span-3 space-y-3">
                  <div className="flex items-center gap-2 text-lg font-bold">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Career Assessment
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Based on keyword correlation and skills parsing, your resume has a <strong>{report.matchScore}%</strong> alignment with the job description.
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground mt-2">
                    <div className="border rounded-lg p-2.5">
                      <span className="font-semibold block mb-0.5 text-foreground">Matched Keywords</span>
                      {report.keywords.matched.length} keywords found
                    </div>
                    <div className="border rounded-lg p-2.5">
                      <span className="font-semibold block mb-0.5 text-foreground">Missing Keywords</span>
                      {report.keywords.missing.length} keywords absent
                    </div>
                  </div>
                </div>
              </div>

              {/* Experience and Education Match */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-2xl border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4.5 w-4.5 text-primary" /> Experience Match
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-relaxed text-muted-foreground">
                    {report.experienceMatch}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileCheck className="h-4.5 w-4.5 text-primary" /> Education Match
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm leading-relaxed text-muted-foreground">
                    {report.educationMatch}
                  </CardContent>
                </Card>
              </div>

              {/* Keywords highlights */}
              <Card className="rounded-2xl border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Keywords Highlights</CardTitle>
                  <CardDescription>Essential terms detected or absent from your resume.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-sm font-semibold block text-emerald-600 dark:text-emerald-400">Matched Keywords ({report.keywords.matched.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {report.keywords.matched.length > 0 ? (
                        report.keywords.matched.map((kw, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 rounded-full font-medium">
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No keywords matched.</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-sm font-semibold block text-destructive">Missing Keywords ({report.keywords.missing.length})</span>
                    <div className="flex flex-wrap gap-1.5">
                      {report.keywords.missing.length > 0 ? (
                        report.keywords.missing.map((kw, i) => (
                          <span key={i} className="text-xs px-2.5 py-1 bg-destructive/5 text-destructive border border-destructive/10 rounded-full font-medium">
                            {kw}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground italic">None missing! Great job.</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Strengths / Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rounded-2xl border-border border-l-4 border-l-emerald-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-emerald-600 dark:text-emerald-400">Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                      {report.strengths.map((str, i) => <li key={i}>{str}</li>)}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border border-l-4 border-l-destructive">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-destructive">Weaknesses</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                      {report.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Recommendations */}
              <Card className="rounded-2xl border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Recommended Improvements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                    {report.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                  </ul>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed border-border rounded-2xl bg-card">
              <Brain className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No Match Analysis Run</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Select your resume and enter a job description on the left to see the match report.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden printable A4 Match Report for PDF Export */}
      {report && (
        <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none opacity-0 -z-50">
          <div id="match-report-pdf-render" className="p-10 bg-white text-slate-800 space-y-8 w-[21cm]">
            <div className="flex justify-between items-center border-b pb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">AI Job Match Report</h1>
                <p className="text-sm text-slate-500 mt-1">Generated by HireCraft AI</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-blue-600">{report.matchScore}%</div>
                <div className="text-xs uppercase tracking-wider font-bold text-slate-400">Match score</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <span className="font-semibold text-slate-400 block text-xs uppercase">Target Role</span>
                <span className="font-bold text-slate-700 text-base">{report.jobTitle}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-400 block text-xs uppercase">Target Company</span>
                <span className="font-bold text-slate-700 text-base">{report.companyName}</span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-extrabold text-lg text-slate-900 border-b pb-1">Experience Alignment</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{report.experienceMatch}</p>
            </div>

            <div className="space-y-3">
              <h3 className="font-extrabold text-lg text-slate-900 border-b pb-1">Education Alignment</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{report.educationMatch}</p>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-base border-b pb-1">Strengths</h3>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                  {report.strengths.map((str, i) => <li key={i}>{str}</li>)}
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="font-bold text-slate-900 text-base border-b pb-1">Weaknesses</h3>
                <ul className="list-disc list-inside text-sm text-slate-600 space-y-2">
                  {report.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-extrabold text-lg text-slate-900 border-b pb-1">Recommended Adjustments</h3>
              <ul className="list-decimal list-inside text-sm text-slate-600 space-y-2">
                {report.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
