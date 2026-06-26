import AtsReportClient from './AtsReportClient';
import { getUserSubscription, getResume, getAllResumes } from '@/lib/db-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { buttonVariants, Button } from '@/components/ui/button';
import { Lock, FileText, Plus } from 'lucide-react';
import { Resume } from '@/types';

export default async function AtsReportPage({ searchParams }: { searchParams: { id?: string } }) {
  const { limits } = await getUserSubscription();

  if (!limits.hasPriorityFeatures) {
    return (
      <div className="p-4 md:p-8 w-full space-y-8 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm border border-primary/10">
              <Lock className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">ATS Match Report</h1>
              <p className="text-muted-foreground mt-1 text-lg">Analyze how your resume passes through Applicant Tracking Systems.</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mt-12">
          <Card className="border-border shadow-sm">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold">Premium Feature</CardTitle>
              <CardDescription className="text-base mt-2">
                ATS Match Reports are available on our Pro and Premium plans.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground pt-4 pb-8">
              <p>Upgrade your account to get deep insights into how Applicant Tracking Systems read your resume, including keyword optimization and format compliance.</p>
            </CardContent>
            <CardFooter className="flex justify-center bg-secondary/50 border-t p-6">
              <Link href="/dashboard/settings" className={`${buttonVariants({ variant: "default", size: "lg" })} text-white`}>
                Upgrade to Pro
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const id = searchParams.id;
  
  if (id) {
    const resume = await getResume(id);
    if (!resume) {
      return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
          <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Resume Not Found</h2>
          <p className="text-muted-foreground mb-6">The resume you are looking for does not exist or you don't have access to it.</p>
          <Link href="/dashboard/resumes">
            <Button className="text-white">Go to My Resumes</Button>
          </Link>
        </div>
      );
    }
    return <AtsReportClient resume={resume} />;
  }

  const resumes = await getAllResumes();
  
  if (resumes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
        <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Resumes Found</h2>
        <p className="text-muted-foreground mb-6 max-w-md">You need to create a resume first before you can run an ATS Match Report.</p>
        <Link href="/dashboard/builder?id=new">
          <Button className="text-white"><Plus className="h-4 w-4 mr-2" /> Create Your First Resume</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Select a Resume for ATS Report</h1>
        <p className="text-muted-foreground">Choose which resume you want to analyze.</p>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {resumes.map((r: Resume) => (
          <Link href={`/dashboard/ats-report?id=${r.id}`} key={r.id} className="block group">
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
