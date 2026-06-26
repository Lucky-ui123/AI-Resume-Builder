import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FileText, Target, ArrowRight, TrendingUp, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { getDashboardStats, getUserSubscription, getAllResumes } from '@/lib/db-service';
import { CreateResumeDialog } from '@/components/dashboard/CreateResumeDialog';

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const { userName } = await getUserSubscription();
  const resumes = await getAllResumes();
  const recentResumes = resumes.slice(0, 3);
  
  const profileStrength = Math.min(100, 40 + (stats.totalResumes * 15));
  let atsFeedback = "Needs improvement";
  if (stats.latestAtsScore >= 80) atsFeedback = "Excellent fit for recent roles";
  else if (stats.latestAtsScore >= 60) atsFeedback = "Good fit for recent roles";
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
          <CreateResumeDialog />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Profile Strength</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profileStrength}%</div>
            <Progress value={profileStrength} className="mt-3 h-1.5" />
            <p className="text-xs text-muted-foreground mt-3">
              Based on your active resumes
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
              {atsFeedback}
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
              Total created so far
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
              Total generated so far
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Recent Resumes</CardTitle>
            <CardDescription>
              Your most recently edited resumes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentResumes.length > 0 ? recentResumes.map((resume) => (
                <div key={resume.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-secondary rounded-xl">
                      <FileText className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium leading-none">{resume.title || 'Untitled Resume'}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${resume.isDraft ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                          {resume.isDraft ? 'Draft' : 'Saved'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {resume.targetRole ? `${resume.targetRole} • ` : ''} 
                        Updated {resume.lastModified ? new Date(resume.lastModified).toLocaleDateString() : 'recently'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link href={`/dashboard/builder?id=${resume.id}`}>
                      <Button type="button" variant="ghost" className="h-10 w-10 p-0">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  No resumes found. Create your first resume to get started!
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
