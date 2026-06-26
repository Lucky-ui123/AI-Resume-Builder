'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Download, FileText, FileIcon, FileOutput, CheckCircle2, AlertCircle, LayoutTemplate } from 'lucide-react';
import { generatePDF, generateDOCX, generateTXT } from '@/lib/export-utils';
import { ResumePreview, LayoutType } from '@/components/resume/ResumePreview';
import { Resume } from '@/types';

import { UpgradeModal } from '@/components/ui/UpgradeModal';

export default function ExportClient({ hasAdvancedTemplates, resume }: { hasAdvancedTemplates: boolean, resume: Resume }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [format, setFormat] = useState('pdf');
  const [layout, setLayout] = useState<LayoutType>('classic-ats');

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    setExportError(null);
    
    try {
      // Check export limit
      const limitRes = await fetch('/api/export-limit', { method: 'POST' });
      if (!limitRes.ok) {
        if (limitRes.status === 403) {
          setExportError('EXPORT_LIMIT_REACHED');
          setIsExporting(false);
          return;
        }
        throw new Error('Failed to check export limit');
      }

      const filename = `resume_${resume.personalInfo.firstName.toLowerCase()}_${resume.personalInfo.lastName.toLowerCase()}_${layout}.${format}`;
      
      if (format === 'pdf') {
        await generatePDF('resume-export-preview', filename);
      } else if (format === 'docx') {
        // DOCX always uses its own robust layout generator
        await generateDOCX(resume, filename);
      } else if (format === 'txt') {
        // TXT is plain text
        generateTXT(resume, filename);
      }
      
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Export failed:', err);
      setExportError('Failed to generate export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const getLayoutName = () => {
    if (layout === 'classic-ats') return 'Classic ATS';
    if (layout === 'modern-professional') return 'Modern Professional';
    return 'Product Designer';
  };

  return (
    <>
      <UpgradeModal 
        isOpen={exportError === 'EXPORT_LIMIT_REACHED'} 
        onClose={() => setExportError(null)} 
        title="Export Limit Reached"
        description="You've reached your monthly export limit. Upgrade to Pro for unlimited exports."
      />
      <div className="p-4 md:p-8 w-full space-y-8 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm border border-primary/10">
              <FileOutput className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Export Resume</h1>
              <p className="text-muted-foreground mt-1 text-lg">Download your tailored resume in multiple formats.</p>
            </div>
          </div>
        </div>

      <div className="grid md:grid-cols-2 gap-8">
        <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-border rounded-2xl">
          <CardHeader className="bg-secondary rounded-t-2xl border-b">
            <CardTitle className="text-lg font-bold">Export Settings</CardTitle>
            <CardDescription>Configure how your resume will be downloaded.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Design Template (PDF Only)</Label>
              <Select value={layout} onValueChange={(val) => val && setLayout(val as LayoutType)}>
                <SelectTrigger className="h-11 shadow-sm font-medium">
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="classic-ats">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="h-4 w-4 text-muted-foreground" /> Classic ATS
                    </div>
                  </SelectItem>
                  <SelectItem value="modern-professional" disabled={!hasAdvancedTemplates}>
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="h-4 w-4 text-primary" /> Modern Professional {!hasAdvancedTemplates && '(Pro)'}
                    </div>
                  </SelectItem>
                  <SelectItem value="product-designer" disabled={!hasAdvancedTemplates}>
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="h-4 w-4 text-primary" /> Product Designer {!hasAdvancedTemplates && '(Pro)'}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Format</Label>
              <Select value={format} onValueChange={(val) => val && setFormat(val)}>
                <SelectTrigger className="h-11 shadow-sm font-medium">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2 font-semibold">
                      <div className="bg-destructive/10 p-1 rounded">
                        <FileIcon className="h-4 w-4 text-destructive" /> 
                      </div>
                      PDF Document (.pdf)
                    </div>
                  </SelectItem>
                  <SelectItem value="docx">
                    <div className="flex items-center gap-2 font-semibold">
                      <div className="bg-primary/20 p-1 rounded">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      MS Word (.docx)
                    </div>
                  </SelectItem>
                  <SelectItem value="txt">
                    <div className="flex items-center gap-2 font-semibold">
                      <div className="bg-muted p-1 rounded">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      Plain Text (.txt)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {format === 'pdf' && (
              <div className="p-5 bg-accent/5 rounded-[16px] text-[14px] text-foreground/80 border border-accent/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-xl pointer-events-none" />
                <p className="font-bold text-accent mb-2 tracking-tight flex items-center gap-2">
                  <FileIcon className="h-4 w-4" />
                  PDF Export Options
                </p>
                PDFs are generated using the exact layout selected above, ensuring ATS compatibility and perfect styling.
              </div>
            )}
            {format !== 'pdf' && (
              <div className="p-5 bg-warning-muted rounded-[16px] text-[14px] text-warning font-medium border border-warning/20 shadow-sm">
                <p className="font-bold mb-1 tracking-tight flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Note on Formatting
                </p>
                DOCX and TXT exports use standard structural parsing. Visual design templates only apply to PDF format.
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-secondary rounded-b-2xl border-t flex-col items-stretch gap-3">
            {exportError && exportError !== 'EXPORT_LIMIT_REACHED' && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-2 rounded-md border border-destructive/20">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{exportError}</p>
              </div>
            )}
            
            {exportSuccess && (
              <div className="flex items-center gap-2 text-sm text-success bg-success-muted p-2 rounded-md border border-success/20">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <p>Export successful! Check your downloads.</p>
              </div>
            )}
            
            <Button className="w-full h-12 text-base font-bold shadow-sm hover:shadow-md transition-all" size="lg" onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <><Download className="mr-2 h-5 w-5 animate-pulse" /> Preparing Export...</>
              ) : (
                <><Download className="mr-2 h-5 w-5" /> Download {format.toUpperCase()}</>
              )}
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/50 to-secondary/20 border-dashed border border-border rounded-2xl shadow-sm flex flex-col justify-center items-center p-8 text-center min-h-[400px]">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
            <div className={`h-48 w-36 bg-background border shadow-premium mb-8 flex flex-col relative z-10 rounded-sm transform transition-all duration-300 ${
              layout === 'classic-ats' ? 'p-3 items-center rotate-1 hover:rotate-0' :
              layout === 'modern-professional' ? 'p-3 items-start -rotate-1 hover:rotate-0 border-l-4 border-l-primary' :
              'p-0 flex-row rotate-2 hover:rotate-0 overflow-hidden'
            }`}>
              {layout === 'product-designer' ? (
                <>
                  <div className="w-1/3 bg-slate-900 h-full p-2 space-y-2">
                    <div className="h-2 w-full bg-slate-700 rounded" />
                    <div className="h-1 w-full bg-slate-700 rounded" />
                    <div className="h-1 w-3/4 bg-slate-700 rounded" />
                  </div>
                  <div className="w-2/3 p-2 space-y-2">
                    <div className="h-1.5 w-1/2 bg-primary/40 rounded mb-2" />
                    <div className="h-1 w-full bg-slate-200 rounded" />
                    <div className="h-1 w-full bg-slate-200 rounded" />
                    <div className="h-1 w-3/4 bg-slate-200 rounded" />
                  </div>
                </>
              ) : (
                <>
                  <div className={`h-3 w-1/2 mb-5 rounded ${layout === 'classic-ats' ? 'bg-primary/20 mx-auto' : 'bg-primary/30'}`} />
                  <div className="space-y-1.5 w-full">
                    <div className="h-1.5 w-full bg-muted-foreground/20 rounded" />
                    <div className="h-1.5 w-full bg-muted-foreground/20 rounded" />
                    <div className="h-1.5 w-5/6 bg-muted-foreground/20 rounded" />
                  </div>
                  <div className="mt-6 space-y-1.5 w-full">
                    <div className="h-1.5 w-full bg-muted-foreground/20 rounded" />
                    <div className="h-1.5 w-3/4 bg-muted-foreground/20 rounded" />
                  </div>
                </>
              )}
            </div>
          </div>
          <h3 className="font-bold text-lg tracking-tight mb-2">Preview Ready</h3>
          <p className="text-[15px] text-muted-foreground max-w-[280px] leading-relaxed">
            Your resume using the <span className="font-semibold text-foreground">&apos;{getLayoutName()}&apos;</span> template is ready for export.
          </p>
        </Card>
      </div>
    
      {/* Hidden Resume Preview for PDF Generation */}
      <div className="absolute top-0 left-0 w-0 h-0 overflow-hidden pointer-events-none opacity-0 -z-50">
        <div id="resume-export-preview">
          <ResumePreview resume={resume} layout={layout} />
        </div>
      </div>
      </div>
    </>
  );
}
