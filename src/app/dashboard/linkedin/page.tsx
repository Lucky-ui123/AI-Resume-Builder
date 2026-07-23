import LinkedinClient from './LinkedinClient';
import { getUserSubscription } from '@/lib/db-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Lock, Network } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageContainer } from '@/components/ui/PageContainer';
import { PageContent } from '@/components/ui/PageContent';

export default async function LinkedinPage({ searchParams }: { searchParams: { id?: string } }) {
  const { limits } = await getUserSubscription();

  if (!limits.hasLinkedin) {
    return (
      <div className="flex h-full flex-col overflow-y-auto bg-muted/10 font-sans">
        <div className="sticky top-0 z-20 px-4 md:px-6 bg-card border-b border-border/40 shrink-0">
          <PageHeader
            icon={<Network className="text-[#0A66C2]" />}
            title="LinkedIn Optimizer"
            description="Transform your resume into a compelling LinkedIn profile."
          />
        </div>

        <PageContainer>
          <PageContent>

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
        </PageContent>
      </PageContainer>
      </div>
    );
  }

  const id = searchParams.id;
  
  return <LinkedinClient initialId={id} />;
}
