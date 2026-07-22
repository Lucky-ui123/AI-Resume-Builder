'use client';

import { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { Resume } from '@/types';
import { saveResumeAction } from '../builder/actions';
import { useRouter } from 'next/navigation';

interface Suggestion {
  id: string;
  section: string;
  originalText: string;
  improvedText: string;
}

export default function AiSuggestionsClient({ resume }: { resume: Resume }) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState<string | null>(null);

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    setSuggestions([]);
    
    try {
      // Fetch summary improvements
      const summaryRes = await fetch('/api/ai/improve-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: resume.summary })
      });
      const summaryData = await summaryRes.json();
      
      const newSuggestions: Suggestion[] = [];
      
      if (summaryData.result) {
        newSuggestions.push({
          id: 'summary-1',
          section: 'Professional Summary',
          originalText: resume.summary,
          improvedText: summaryData.result
        });
      }

      // Fetch experience improvements (up to 3)
      const expsToScan = resume.experience.slice(0, 3);
      const expPromises = expsToScan.map(expItem => 
        fetch('/api/ai/improve-experience', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: expItem.role, company: expItem.company, description: expItem.description })
        }).then(res => res.json().then(data => ({ expItem, data })))
      );
      
      const expResults = await Promise.all(expPromises);
      
      expResults.forEach(({ expItem, data }) => {
        if (data.result) {
          newSuggestions.push({
            id: `exp-${expItem.id}`,
            section: `Experience: ${expItem.role}`,
            originalText: expItem.description,
            improvedText: data.result
          });
        }
      });

      setSuggestions(newSuggestions);
      setHasScanned(true);
    } catch (err) {
      console.error(err);
      setError('An error occurred while generating suggestions.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = async (id: string) => {
    setIsApplying(id);
    const suggestion = suggestions.find(s => s.id === id);
    if (!suggestion) {
      setIsApplying(null);
      return;
    }

    try {
      const updatedResume = { ...resume };
      if (id === 'summary-1') {
        updatedResume.summary = suggestion.improvedText;
      } else if (id.startsWith('exp-')) {
        const expId = id.replace('exp-', '');
        updatedResume.experience = updatedResume.experience.map(exp => 
          exp.id === expId ? { ...exp, description: suggestion.improvedText } : exp
        );
      }

      const saveResult = await saveResumeAction(updatedResume);
      if (saveResult.error) {
        throw new Error(saveResult.error);
      }

      setSuggestions(suggestions.filter(s => s.id !== id));
      router.refresh();
    } catch (err) {
      console.error(err);
      setError('Failed to apply suggestion. Please try again.');
    } finally {
      setIsApplying(null);
    }
  };

  const handleReject = (id: string) => {
    setSuggestions(suggestions.filter(s => s.id !== id));
  };

  return (
    <div className="p-2 md:p-4 w-full space-y-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm border border-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Smart Suggestions</h1>
            <p className="text-muted-foreground mt-1 text-lg">Review AI-powered improvements for your resume content.</p>
          </div>
        </div>
        <Button onClick={handleScan} disabled={isScanning} className="font-bold shadow-sm text-white">
          {isScanning ? (
            <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Scanning Resume...</>
          ) : (
            <><Sparkles className="mr-2 h-5 w-5" /> Scan for Improvements</>
          )}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-4 rounded-md border border-destructive/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {isScanning && (
        <Card className="border-dashed border border-border bg-card shadow-sm min-h-[400px] flex items-center justify-center rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <h3 className="text-xl font-bold tracking-tight mb-2 text-heading/80">Analyzing your resume</h3>
            <p className="text-muted-foreground max-w-[300px] leading-relaxed">The AI is reviewing your summary and experience to suggest impactful changes...</p>
          </CardContent>
        </Card>
      )}

      {!isScanning && hasScanned && suggestions.length === 0 && !error && (
        <Card className="border-dashed border border-border bg-card shadow-sm min-h-[400px] flex items-center justify-center rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="bg-background p-4 rounded-full shadow-sm mb-5 border border-border/50">
              <Sparkles className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2 text-heading/80">You&apos;re all caught up!</h3>
            <p className="text-muted-foreground max-w-[300px] leading-relaxed">Your resume content looks solid. Check back later after making more edits.</p>
          </CardContent>
        </Card>
      )}

      {!isScanning && !hasScanned && !error && (
        <Card className="border-dashed border border-border bg-card shadow-sm min-h-[400px] flex items-center justify-center rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="bg-background p-4 rounded-full shadow-sm mb-5 border border-border/50">
              <Sparkles className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-2 text-heading/80">Ready to review</h3>
            <p className="text-muted-foreground max-w-[300px] leading-relaxed">Click &quot;Scan for Improvements&quot; to have the AI analyze your resume content.</p>
          </CardContent>
        </Card>
      )}

      {!isScanning && suggestions.length > 0 && (
        <div className="grid gap-8">
          {suggestions.map((sug) => (
            <Card key={sug.id} className="overflow-hidden shadow-sm hover:shadow-md transition-all border-border group rounded-2xl">
              <div className="bg-secondary px-6 py-4 border-b flex justify-between items-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 relative z-10">
                  <Badge variant="outline" className="font-bold tracking-wider text-[10px] uppercase bg-background shadow-sm px-2.5 py-1">
                    {sug.section}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground font-semibold flex items-center gap-2 relative z-10">
                  Impact: <span className="text-success bg-success-muted px-2 py-0.5 rounded-sm uppercase tracking-wider text-[10px] font-bold">High</span>
                </div>
              </div>
              <CardContent className="p-0">
                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                  <div className="p-6 md:p-8 bg-background">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                      Original Text
                    </h4>
                    <p className="text-[15px] text-foreground/70 leading-relaxed bg-destructive/5 p-5 rounded-xl border border-destructive/10 whitespace-pre-wrap">
                      {sug.originalText}
                    </p>
                  </div>
                  <div className="p-6 md:p-8 bg-accent/5 relative">
                    <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5" />
                      AI Improved
                    </h4>
                    <p className="text-[15px] font-medium leading-relaxed bg-background p-5 rounded-xl border border-accent/20 shadow-sm relative z-10 text-foreground/90 whitespace-pre-wrap">
                      {sug.improvedText}
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/10 flex justify-end gap-3 border-t">
                <Button variant="ghost" disabled={isApplying === sug.id} className="font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => handleReject(sug.id)}>
                  <X className="mr-2 h-4 w-4" /> Ignore
                </Button>
                <Button disabled={isApplying === sug.id} className="font-semibold shadow-sm hover:shadow-md transition-shadow text-white" onClick={() => handleApply(sug.id)}>
                  {isApplying === sug.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Apply to Resume
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
