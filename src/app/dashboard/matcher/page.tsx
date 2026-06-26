import MatcherClient from './MatcherClient';
import { getResume, getAllResumes } from '@/lib/db-service';
import { Resume } from '@/types';
import Link from 'next/link';
import { FileText, Plus, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function MatcherPage({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams.id;
  
  if (id) {
    const resume = await getResume(id);
    if (!resume) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Resume Not Found</h2>
          <p className="text-muted-foreground mb-6">The resume you are looking for does not exist or you don&apos;t have access to it.</p>
          <Link href="/dashboard/resumes">
            <Button>Go to My Resumes</Button>
          </Link>
        </div>
      );
    }
    return <MatcherClient resume={resume} />;
  }

  const resumes = await getAllResumes();
  
  if (resumes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <Target className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Resumes Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">You need to create a resume first before you can use the Job Matcher.</p>
        <Link href="/dashboard/builder?id=new">
          <Button><Plus className="h-4 w-4 mr-2" /> Create Your First Resume</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Select a Resume to Match</h1>
        <p className="text-muted-foreground">Choose which resume you want to match against a job description.</p>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {resumes.map((r: Resume) => (
          <Link href={`/dashboard/matcher?id=${r.id}`} key={r.id} className="block group">
            <div className="border rounded-xl p-5 hover:border-primary hover:shadow-md transition-all h-full bg-card">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-lg truncate mb-1">{r.title || 'Untitled'}</h3>
              <p className="text-sm text-muted-foreground truncate">{r.targetRole || 'General Resume'}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
