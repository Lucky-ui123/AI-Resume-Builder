'use client';

import { useState, useEffect } from 'react';
import { useResumes } from '@/context/ResumeContext';
import { AtsReport } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, AlertCircle, AlertTriangle, FileSearch, Sparkles, 
  Download, FileCheck, Loader2, Info 
} from 'lucide-react';
import { saveAtsReportAction, analyzeAtsAction } from '../career-actions';
import { lsSaveAtsReport } from '@/lib/local-storage-service';
import { showSuccess, showError, showLoading, dismissToast } from '@/lib/toast';

export default function AtsClient() {
  const { resumes, isLoading: resumesLoading } = useResumes();
  const [selectedResumeIdState, setSelectedResumeId] = useState('');
  const selectedResumeId = selectedResumeIdState || (resumes.length > 0 ? resumes[0].id : '');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<AtsReport | null>(null);
  const [reportsList, setReportsList] = useState<AtsReport[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved ATS reports on mount
  useEffect(() => {
    const loadReports = async () => {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { getAtsReportsAction } = await import('../career-actions');
        const data = await getAtsReportsAction();
        setReportsList(data);
      } else {
        const { lsGetAtsReports } = await import('@/lib/local-storage-service');
        setReportsList(lsGetAtsReports());
      }
    };
    loadReports();
  }, []);

  const handleAnalyze = async () => {
    const resume = resumes.find(r => r.id === selectedResumeId);
    if (!resume) {
      showError('Please select a resume.');
      return;
    }

    setIsAnalyzing(true);
    const toastId = showLoading('Analyzing ATS compatibility...');
    try {
      const analysis = await analyzeAtsAction(resume);
      const newReport: AtsReport = {
        ...analysis,
        id: `ats_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString()
      };
      setReport(newReport);
      showSuccess('ATS Scan completed successfully!');
    } catch (err) {
      console.error(err);
      showError('Failed to run ATS scan.');
    } finally {
      dismissToast(toastId);
      setIsAnalyzing(false);
    }
  };

  const handleSaveReport = async () => {
    if (!report) return;
    setIsSaving(true);
    const toastId = showLoading('Saving ATS Report...');
    try {
      let savedId = '';
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const res = await saveAtsReportAction(report);
        if (res.error) throw new Error(res.error);
        savedId = res.id;
      } else {
        const saved = lsSaveAtsReport(report);
        savedId = saved.id;
      }
      
      const updatedReport = { ...report, id: savedId };
      setReport(updatedReport);
      setReportsList(prev => [updatedReport, ...prev]);
      showSuccess('ATS report saved successfully!');
    } catch (err) {
      console.error(err);
      showError('Failed to save ATS report.');
    } finally {
      dismissToast(toastId);
      setIsSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!report) return;
    const toastId = showLoading('Generating PDF report...');
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const { generatePDF } = await import('@/lib/export-utils');
      await generatePDF(`ats-report-pdf-render`, `ATS_Report_${report.resumeTitle.replace(/\s+/g, '_')}.pdf`);
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
        <span>Loading ATS Analyzer...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 font-sans">
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/10">
          <FileSearch className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">ATS Resume Analyzer</h1>
          <p className="text-muted-foreground mt-0.5 text-lg">Score and optimize your resume for applicant tracking systems.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="text-xl">Scan Settings</CardTitle>
              <CardDescription>Select a resume to evaluate.</CardDescription>
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

              <Button 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                className="w-full font-bold text-white py-6"
              >
                {isAnalyzing ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Scanning...</>
                ) : (
                  <><Sparkles className="mr-2 h-5 w-5" /> Run ATS Scan</>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* History list */}
          {reportsList.length > 0 && (
            <Card className="rounded-2xl border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Scans</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {reportsList.map(r => (
                  <div 
                    key={r.id} 
                    onClick={() => setReport(r)}
                    className="p-3 border rounded-xl hover:border-primary hover:bg-secondary/20 transition-all cursor-pointer flex justify-between items-center group"
                  >
                    <div className="min-w-0">
                      <h4 className="font-semibold text-sm truncate">{r.resumeTitle}</h4>
                      <p className="text-xs text-muted-foreground truncate">Scanned {new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className="bg-primary/10 text-primary font-bold text-xs px-2 py-1 rounded-full group-hover:scale-105 transition-transform">
                      {r.overallScore}%
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
                <h2 className="text-2xl font-bold tracking-tight">ATS Audit Report</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSaveReport} disabled={isSaving}>
                    <FileCheck className="h-4 w-4 mr-2" /> Save Report
                  </Button>
                  <Button variant="default" size="sm" className="text-white" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 mr-2" /> Export PDF
                  </Button>
                </div>
              </div>

              {/* Overall Score */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center border p-6 rounded-2xl bg-card shadow-sm">
                <div className="md:col-span-1 flex flex-col items-center justify-center text-center">
                  <div className="relative w-28 h-28 flex items-center justify-center rounded-full bg-primary/5 border border-primary/10 mb-2">
                    <span className="text-4xl font-extrabold text-primary">{report.overallScore}%</span>
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ATS Score</span>
                </div>
                <div className="md:col-span-3 space-y-2">
                  <div className="flex items-center gap-2 text-lg font-bold">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    Overall Health: {report.overallScore >= 80 ? 'Excellent' : report.overallScore >= 60 ? 'Good' : 'Needs Optimization'}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    This score measures layout scan-readiness, heading parsing, keyword density, and section structure.
                  </p>
                </div>
              </div>

              {/* Section-by-section breakdown */}
              <Card className="rounded-2xl border-border">
                <CardHeader>
                  <CardTitle className="text-lg">ATS Parameters Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Contact Info completeness</span>
                      <span className="font-bold">{report.contactInfoScore}%</span>
                    </div>
                    <Progress value={report.contactInfoScore} className="h-1.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Section Structure</span>
                      <span className="font-bold">{report.structureScore}%</span>
                    </div>
                    <Progress value={report.structureScore} className="h-1.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Keyword Optimization</span>
                      <span className="font-bold">{report.keywordScore}%</span>
                    </div>
                    <Progress value={report.keywordScore} className="h-1.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Formatting Issues</span>
                      <span className="font-bold">{report.formattingScore}%</span>
                    </div>
                    <Progress value={report.formattingScore} className="h-1.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Readability</span>
                      <span className="font-bold">{report.readabilityScore}%</span>
                    </div>
                    <Progress value={report.readabilityScore} className="h-1.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Completeness</span>
                      <span className="font-bold">{report.completenessScore}%</span>
                    </div>
                    <Progress value={report.completenessScore} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>

              {/* Actionable recommendations */}
              <Card className="rounded-2xl border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Actionable Suggestions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {report.suggestions.map((sug, i) => (
                    <div key={i} className="flex gap-3 items-start border-b pb-3 last:border-0 last:pb-0">
                      {sug.priority === 'High' ? (
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                      ) : sug.priority === 'Medium' ? (
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-foreground">{sug.section}</span>
                          <Badge variant={sug.priority === 'High' ? 'destructive' : sug.priority === 'Medium' ? 'warning' : 'secondary'} className="text-[10px] px-1.5 py-0">
                            {sug.priority} Priority
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{sug.message}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed border-border rounded-2xl bg-card">
              <FileSearch className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No ATS Scan Run</h3>
              <p className="text-muted-foreground max-w-sm mb-6">
                Select your resume and run a scan on the left to see the compatibility audit reports.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Hidden printable A4 ATS Report for PDF Export */}
      {report && (
        <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none opacity-0 -z-50">
          <div id="ats-report-pdf-render" className="p-10 bg-white text-slate-800 space-y-8 w-[21cm]">
            <div className="flex justify-between items-center border-b pb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">ATS Audit Report</h1>
                <p className="text-sm text-slate-500 mt-1">Generated by HireCraft AI</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-slate-900">{report.overallScore}%</div>
                <div className="text-xs uppercase tracking-wider font-bold text-slate-400">ATS Score</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900 border-b pb-1">Compatibility Metrics</h3>
              <div className="grid grid-cols-2 gap-4 text-sm text-slate-700">
                <div>Contact Information: {report.contactInfoScore}%</div>
                <div>Formatting Audit: {report.formattingScore}%</div>
                <div>Section Layout: {report.structureScore}%</div>
                <div>Readability Level: {report.readabilityScore}%</div>
                <div>Keyword Density: {report.keywordScore}%</div>
                <div>Overall Completeness: {report.completenessScore}%</div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900 border-b pb-1">Optimization Recommendations</h3>
              <div className="space-y-4">
                {report.suggestions.map((sug, i) => (
                  <div key={i} className="text-sm border-b pb-2 last:border-0">
                    <div className="font-bold text-slate-900 flex items-center gap-2">
                      <span>[{sug.priority} Priority] {sug.section}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{sug.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
