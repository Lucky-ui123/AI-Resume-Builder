'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FileSignature, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Resume } from '@/types';

import { UpgradeModal } from '@/components/ui/UpgradeModal';

export default function CoverLetterClient({ resume }: { resume: Resume }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobPosting, setJobPosting] = useState('');

  const handleGenerate = async () => {
    if (!jobPosting.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume, jobDescription: jobPosting })
      });
      const data = await res.json();
      if (res.status === 403 && data.error === 'AI_LIMIT_REACHED') {
        setError('AI_LIMIT_REACHED');
      } else if (data.letter) {
        setGeneratedLetter(data.letter);
      } else {
        setError(data.error || 'Failed to generate cover letter');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while communicating with the AI service.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <UpgradeModal 
        isOpen={error === 'AI_LIMIT_REACHED'} 
        onClose={() => setError(null)} 
      />
      <div className="p-4 md:p-8 w-full space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm border border-primary/10">
            <FileSignature className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Cover Letter Generator</h1>
            <p className="text-muted-foreground mt-1 text-lg">Create a highly tailored cover letter in seconds.</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-12 gap-8">
        <div className="md:col-span-4 space-y-6">
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-border rounded-2xl">
            <CardHeader className="bg-secondary rounded-t-2xl border-b">
              <CardTitle className="text-lg font-bold">Generation Settings</CardTitle>
              <CardDescription>Provide details to guide the AI.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Job Posting</Label>
                <Textarea 
                  className="min-h-[180px] shadow-sm text-sm leading-relaxed p-4" 
                  value={jobPosting}
                  onChange={(e) => setJobPosting(e.target.value)}
                  placeholder="Paste the job description here..."
                />
              </div>
              
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <Button 
                className="w-full h-12 text-base font-bold shadow-sm hover:shadow-md transition-all mt-4" 
                onClick={handleGenerate} 
                disabled={isGenerating || !jobPosting.trim()}
              >
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-5 w-5" /> Generate Cover Letter</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8">
          <Card className="h-full flex flex-col shadow-sm border-border relative overflow-hidden rounded-2xl">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
            <CardHeader className="bg-secondary rounded-t-2xl border-b flex flex-row items-center justify-between relative z-10">
              <div>
                <CardTitle className="text-lg font-bold">Your Cover Letter</CardTitle>
                <CardDescription>Edit manually or re-generate.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative bg-muted/10">
              {generatedLetter ? (
                <div className="p-6 md:p-8 h-full custom-scrollbar overflow-auto">
                  <div className="w-full max-w-[700px] mx-auto bg-background p-8 md:p-12 shadow-sm border border-border rounded-2xl min-h-[600px]">
                    <Textarea 
                      className="w-full h-full min-h-[500px] border-0 rounded-none p-0 text-[15px] leading-loose resize-none focus-visible:ring-0 shadow-none bg-transparent"
                      value={generatedLetter}
                      onChange={(e) => setGeneratedLetter(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-8 text-center min-h-[500px]">
                  <div className="bg-background p-4 rounded-full shadow-sm mb-5 border border-border/50">
                    <FileSignature className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <p className="font-medium text-lg text-foreground/70 mb-2">Ready to write</p>
                  <p className="text-sm max-w-[350px] leading-relaxed">Fill out the settings on the left and click Generate to create a custom cover letter based on your resume and the job description.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}
