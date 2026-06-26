'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Target, Search, Sparkles, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Resume } from '@/types';

export default function MatcherClient({ resume }: { resume: Resume }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<{ score: number, missingKeywords: string[], suggestions: string[] } | null>(null);
  const [jobPosting, setJobPosting] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jobPosting.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResults(null);
    
    try {
      const res = await fetch('/api/ai/ats-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume: resume, jobDescription: jobPosting })
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while analyzing the resume.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-4 md:p-8 w-full space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm border border-primary/10">
            <Target className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Job Matcher</h1>
            <p className="text-muted-foreground mt-1 text-lg">Compare your resume against a specific job posting.</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-border rounded-2xl">
            <CardHeader className="bg-secondary rounded-t-2xl border-b">
              <CardTitle className="text-lg font-bold">1. Selected Resume</CardTitle>
              <CardDescription>The resume profile currently being analyzed.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 p-3 bg-accent/5 rounded-xl border border-accent/10">
                <div className="bg-background p-2 rounded-lg border shadow-sm">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{resume.title || 'Untitled Resume'}</h3>
                  <p className="text-xs text-muted-foreground">{resume.targetRole || 'No target role specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-border rounded-2xl">
            <CardHeader className="bg-secondary rounded-t-2xl border-b">
              <CardTitle className="text-lg font-bold">2. Paste Job Description</CardTitle>
              <CardDescription>Paste the full text of the job posting here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Job Description</Label>
                <Textarea 
                  className="min-h-[220px] shadow-sm leading-relaxed p-4" 
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
                className="w-full h-12 text-base font-bold shadow-sm hover:shadow-md transition-all mt-2" 
                onClick={handleAnalyze} 
                disabled={isAnalyzing || !jobPosting.trim()}
              >
                {isAnalyzing ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing Match...</>
                ) : (
                  <><Search className="mr-2 h-5 w-5" /> Analyze Match</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="h-full">
          {results ? (
            <Card className="h-full border-border shadow-sm rounded-2xl flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
              <CardHeader className="bg-secondary rounded-t-2xl border-b relative z-10">
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                  <Target className="h-6 w-6 text-primary" />
                  Match Results
                </CardTitle>
                <CardDescription>Here is how your resume stacks up against the requirements.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8 flex-1 flex flex-col relative z-10">
                <div className="flex flex-col items-center justify-center">
                  <div className="relative flex items-center justify-center w-36 h-36 rounded-full border-[12px] border-muted bg-background shadow-inner">
                    <div className="absolute inset-0 rounded-full border-[12px] border-accent border-t-transparent border-r-transparent transform -rotate-45" />
                    <div className="text-center">
                      <span className="text-5xl font-black tracking-tighter text-foreground">{results.score}%</span>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Match</p>
                    </div>
                  </div>
                  <p className="mt-6 text-lg font-bold text-foreground tracking-tight">
                    {results.score > 80 ? 'Strong Candidate' : results.score > 60 ? 'Good Match' : 'Needs Improvement'}
                  </p>
                </div>

                <Separator className="opacity-50" />

                <div className="flex-1">
                  <h3 className="font-bold mb-4 tracking-tight">Keyword Analysis</h3>
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-success" /> Current Skills vs JD
                      </p>
                      <p className="text-sm text-muted-foreground">The AI extracted the following missing keywords from the JD that are not explicitly present in your resume.</p>
                    </div>
                    {results.missingKeywords && results.missingKeywords.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-destructive" /> Missing from resume
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {results.missingKeywords.map(k => (
                            <Badge key={k} variant="destructive" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20 font-semibold px-2.5 py-1">
                              {k}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {results.suggestions && results.suggestions.length > 0 && (
                  <div className="bg-muted/40 p-5 rounded-xl border border-border/50">
                    <h3 className="font-bold text-sm mb-2 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI Recommendations
                    </h3>
                    <ul className="list-disc pl-5 text-sm text-muted-foreground leading-relaxed space-y-1.5 marker:text-primary/40">
                      {results.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full border border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-card shadow-sm min-h-[500px]">
              <div className="bg-background p-4 rounded-full shadow-sm mb-4 border border-border/50">
                <Target className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <p className="font-medium text-lg text-foreground/70 mb-2">Ready to analyze</p>
              <p className="text-sm max-w-[250px] leading-relaxed">Paste a job description and click analyze to see your match score and missing keywords.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
