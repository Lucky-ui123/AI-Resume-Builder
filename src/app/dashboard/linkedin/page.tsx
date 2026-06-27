import LinkedinClient from './LinkedinClient';
import { getUserSubscription, getResume, getAllResumes } from '@/lib/db-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { buttonVariants, Button } from '@/components/ui/button';
import { Lock, FileText, Plus } from 'lucide-react';
import { Resume } from '@/types';

export default async function LinkedinPage({ searchParams }: { searchParams: { id?: string } }) {
  const { limits } = await getUserSubscription();

  if (!limits.hasLinkedin) {
    return (
      <div className="p-4 md:p-8 w-full space-y-8 font-sans">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-[#0A66C2]/10 p-2.5 rounded-xl shadow-sm border border-[#0A66C2]/10">
              <Lock className="h-7 w-7 text-[#0A66C2]" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">LinkedIn Optimizer</h1>
              <p className="text-muted-foreground mt-1 text-lg">Transform your resume into a compelling LinkedIn profile.</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto mt-12">
          <Card className="border-border shadow-sm">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 bg-[#0A66C2]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-[#0A66C2]" />
              </div>
              <CardTitle className="text-2xl font-bold">Premium Feature</CardTitle>
              <CardDescription className="text-base mt-2">
                LinkedIn Optimization is only available on Professional and Executive plans.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground pt-4 pb-8">
              <p>Upgrade your account to access our AI-powered LinkedIn profile generator. Get tailored headlines, about sections, and experience descriptions that attract recruiters.</p>
            </CardContent>
            <CardFooter className="flex justify-center bg-secondary/50 border-t p-6">
              <Link href="/dashboard/settings" className={buttonVariants({ variant: "default", size: "lg" })}>
                Upgrade to Pro
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  const id = searchParams.id;
  
  return <LinkedinClient initialId={id} />;
}
