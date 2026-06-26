import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Target, Plus, ArrowRight, TrendingUp, Briefcase, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats, getUserSubscription } from '@/lib/db-service';

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const { userName } = await getUserSubscription();
  
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {userName.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Here is what is happening with your job search today.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/matcher">
            <Button variant="outline">Match Job</Button>
          </Link>
          <Link href="/dashboard/builder">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Create Resume
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Profile Strength</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <Progress value={85} className="mt-3 h-1.5" />
            <p className="text-xs text-muted-foreground mt-3">
              +15% since last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Avg ATS Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.latestAtsScore}/100</div>
            <p className="text-xs text-muted-foreground mt-3 font-medium">
              Excellent fit for recent roles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Resumes Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResumes}</div>
            <p className="text-xs text-muted-foreground mt-3">
              3 active applications
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Cover Letters</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.coverLetters}</div>
            <p className="text-xs text-muted-foreground mt-3">
              Generated this month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Resumes</CardTitle>
            <CardDescription>
              Your most recently edited resumes and their performance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: 'Senior Frontend Developer', updated: '2 hours ago', score: 92 },
                { name: 'React Developer', updated: '3 days ago', score: 85 },
                { name: 'Fullstack Engineer', updated: '1 week ago', score: 78 },
              ].map((resume, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-secondary rounded-xl">
                      <FileText className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none mb-1">{resume.name}</p>
                      <p className="text-sm text-muted-foreground">Updated {resume.updated}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium leading-none mb-1">{resume.score}% Match</p>
                      <p className="text-xs text-muted-foreground">ATS Score</p>
                    </div>
                    <Button type="button" variant="ghost" className="h-10 w-10 p-0">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Suggested Actions</CardTitle>
            <CardDescription>
              Improve your chances of landing an interview.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-2xl bg-card shadow-sm flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-secondary text-foreground rounded-md mt-0.5">
                    <Target className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Missing Keywords Detected</h4>
                    <p className="text-sm text-muted-foreground mt-1">Your &apos;React Developer&apos; resume is missing &quot;Jest&quot; and &quot;Cypress&quot; from a recent job match.</p>
                  </div>
                </div>
                <Button variant="secondary" size="sm" className="w-full">Review Suggestions</Button>
              </div>
              
              <div className="p-4 border border-border rounded-2xl bg-card shadow-sm flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-accent text-accent-foreground rounded-md mt-0.5">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">Enhance Summary with AI</h4>
                    <p className="text-sm text-muted-foreground mt-1">Make your professional summary more impactful using our AI rewriter.</p>
                  </div>
                </div>
                <Button variant="ai" size="sm" className="w-full">Enhance Now</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
