'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Network, Sparkles, Copy, CheckCircle2, Loader2, AlertCircle, FileText, Plus } from 'lucide-react';
import { Resume } from '@/types';
import { UpgradeModal } from '@/components/ui/UpgradeModal';
import { useResumes } from '@/context/ResumeContext';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageContent } from '@/components/ui/PageContent';
import { LoadingState } from '@/components/ui/LoadingState';

export default function LinkedinClient({ initialId }: { initialId?: string }) {
  const { resumes, isLoading } = useResumes();
  const resume = initialId ? resumes.find(r => r.id === initialId) : null;
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copied, setCopied] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const [generated, setGenerated] = useState({
    headline: '',
    about: '',
    skills: ''
  });

  const handleGenerate = async () => {
    if (!resume) return;
    setIsGenerating(true);
    setError(null);
    try {
      // Run the three API calls in parallel
      const [headlineRes, aboutRes, skillsRes] = await Promise.all([
        fetch('/api/ai/linkedin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume, type: 'headline' })
        }),
        fetch('/api/ai/linkedin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resume, type: 'about' })
        }),
        fetch('/api/ai/suggest-skills', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetRole: resume.title || 'Software Engineer' })
        })
      ]);

      const headlineData = await headlineRes.json();
      const aboutData = await aboutRes.json();
      const skillsData = await skillsRes.json();

      if (headlineData.error === 'AI_LIMIT_REACHED' || aboutData.error === 'AI_LIMIT_REACHED' || skillsData.error === 'AI_LIMIT_REACHED') {
        setError('AI_LIMIT_REACHED');
      } else if (headlineData.error || aboutData.error || skillsData.error) {
        setError(headlineData.error || aboutData.error || skillsData.error);
      } else {
        setGenerated({
          headline: headlineData.result || '',
          about: aboutData.result || '',
          skills: Array.isArray(skillsData.result) ? skillsData.result.join(' • ') : (skillsData.result || '')
        });
        setHasGenerated(true);
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred while generating LinkedIn content.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!resume) {
    if (resumes.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <div className="bg-[#0A66C2]/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Network className="h-8 w-8 text-[#0A66C2]" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Resumes Found</h2>
          <p className="text-muted-foreground mb-6 max-w-md">You need to create a resume first before you can use the LinkedIn Optimizer.</p>
          <Link href="/dashboard/builder?id=new">
            <Button><Plus className="h-4 w-4 mr-2" /> Create Your First Resume</Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col overflow-y-auto bg-muted/10 font-sans">
        <div className="sticky top-0 z-20 px-4 md:px-6 bg-card border-b border-border/40 shrink-0">
          <PageHeader
            icon={<Network className="text-[#0A66C2]" />}
            title="Select a Resume to Optimize"
            description="Choose which resume you want to use for generating a LinkedIn profile."
          />
        </div>
        <PageContainer>
          <PageContent>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {resumes.map((r: Resume) => (
                <Link href={`/dashboard/linkedin?id=${r.id}`} key={r.id} className="block group">
                  <div className="border rounded-xl p-5 hover:border-[#0A66C2] hover:shadow-md transition-all h-full bg-card">
                    <div className="w-10 h-10 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center mb-3">
                      <FileText className="h-5 w-5 text-[#0A66C2]" />
                    </div>
                    <h3 className="font-semibold text-lg truncate mb-1">{r.title || 'Untitled'}</h3>
                    <p className="text-sm text-muted-foreground truncate">{r.targetRole || 'General Resume'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </PageContent>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-muted/10 font-sans">
      <UpgradeModal 
        isOpen={error === 'AI_LIMIT_REACHED'} 
        onClose={() => setError(null)} 
      />
      <div className="sticky top-0 z-20 px-4 md:px-6 bg-card border-b border-border/40 shrink-0">
        <PageHeader
          icon={<Network className="text-[#0A66C2]" />}
          title="LinkedIn Optimizer"
          description="Transform your resume into a compelling LinkedIn profile."
        />
      </div>
      <PageContainer>
        <PageContent>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-4 rounded-md border border-destructive/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {!hasGenerated && !error ? (
        <Card className="border-dashed border border-border bg-card min-h-[500px] flex items-center justify-center relative overflow-hidden rounded-2xl shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#0A66C2]/5 rounded-full blur-3xl pointer-events-none" />
          <CardContent className="flex flex-col items-center justify-center text-center max-w-md mx-auto relative z-10">
            <div className="bg-background p-5 rounded-2xl shadow-sm mb-6 border border-border/50">
              <Network className="h-12 w-12 text-[#0A66C2]/50" />
            </div>
            <h3 className="text-xl font-bold tracking-tight mb-3">Optimize for LinkedIn&apos;s Algorithm</h3>
            <p className="text-muted-foreground mb-8 leading-relaxed font-medium">
              We&apos;ll analyze your <span className="text-foreground font-semibold">&apos;{resume.title}&apos;</span> and generate a tailored headline, about section, and skills list designed to attract recruiters.
            </p>
            <Button size="lg" className="w-full h-12 text-base font-bold shadow-sm hover:shadow-md transition-all bg-[#0A66C2] hover:bg-[#0A66C2]/90" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Optimizing Profile...</>
              ) : (
                <><Sparkles className="mr-2 h-5 w-5" /> Generate Content</>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8 relative">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0A66C2]/5 to-transparent rounded-2xl blur-3xl -z-10 pointer-events-none" />
          
          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-border rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-secondary rounded-t-2xl border-b">
              <div>
                <CardTitle className="text-lg font-bold">Profile Headline</CardTitle>
                <CardDescription>The most important 220 characters on your profile.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow font-semibold" onClick={() => handleCopy(generated.headline, 'headline')}>
                {copied === 'headline' ? <><CheckCircle2 className="h-4 w-4 text-success mr-2" /> Copied</> : <><Copy className="h-4 w-4 mr-2" /> Copy</>}
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <Input value={generated.headline} readOnly className="font-semibold text-base h-12 shadow-sm bg-muted/20 border-border/50 focus-visible:ring-[#0A66C2]/50" />
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-border rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-secondary rounded-t-2xl border-b">
              <div>
                <CardTitle className="text-lg font-bold">About Section</CardTitle>
                <CardDescription>Tell your story and highlight your impact.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow font-semibold" onClick={() => handleCopy(generated.about, 'about')}>
                {copied === 'about' ? <><CheckCircle2 className="h-4 w-4 text-success mr-2" /> Copied</> : <><Copy className="h-4 w-4 mr-2" /> Copy</>}
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <Textarea 
                value={generated.about} 
                readOnly 
                className="min-h-[220px] text-[15px] leading-relaxed shadow-sm bg-muted/20 border-border/50 focus-visible:ring-[#0A66C2]/50 resize-none whitespace-pre-wrap" 
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-all duration-300 border-border rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-secondary rounded-t-2xl border-b">
              <div>
                <CardTitle className="text-lg font-bold">Top Skills</CardTitle>
                <CardDescription>Add these to your skills section for better searchability.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="shadow-sm hover:shadow-md transition-shadow font-semibold" onClick={() => handleCopy(generated.skills, 'skills')}>
                {copied === 'skills' ? <><CheckCircle2 className="h-4 w-4 text-success mr-2" /> Copied</> : <><Copy className="h-4 w-4 mr-2" /> Copy</>}
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <Textarea 
                value={generated.skills} 
                readOnly 
                className="min-h-[100px] text-[15px] font-medium leading-relaxed shadow-sm bg-muted/20 border-border/50 focus-visible:ring-[#0A66C2]/50 resize-none whitespace-pre-wrap" 
              />
            </CardContent>
          </Card>
        </div>
      )}
      </PageContent>
    </PageContainer>
    </div>
  );
}
