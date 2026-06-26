import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { buttonVariants } from '@/components/ui/button';
import { Settings, CreditCard, LogOut, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getUserSubscription, getDashboardStats } from '@/lib/db-service';
import Link from 'next/link';

export default async function SettingsPage() {
  const { plan, aiUsageCount, exportUsageCount, limits, userEmail, userName } = await getUserSubscription();
  const { totalResumes } = await getDashboardStats();
  const resumesPercent = limits.resumes === Infinity ? 0 : Math.min(100, (totalResumes / limits.resumes) * 100);
  const aiPercent = limits.aiActionsPerMonth === Infinity ? 0 : Math.min(100, (aiUsageCount / limits.aiActionsPerMonth) * 100);
  const exportPercent = limits.exportsPerMonth === Infinity ? 0 : Math.min(100, (exportUsageCount / limits.exportsPerMonth) * 100);

  return (
    <div className="p-4 md:p-8 w-full space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-2.5 rounded-xl shadow-sm border border-primary/10">
            <Settings className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground mt-1 text-lg">Manage your account preferences and billing details.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-8 bg-muted/30 p-1 border border-border/50 rounded-xl h-auto flex flex-wrap shadow-sm">
          <TabsTrigger value="general" className="rounded-lg py-2.5 px-4 font-semibold data-[state=active]:shadow-sm data-[state=active]:bg-background transition-all">General</TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg py-2.5 px-4 font-semibold data-[state=active]:shadow-sm data-[state=active]:bg-background transition-all">Billing & Plan</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg py-2.5 px-4 font-semibold data-[state=active]:shadow-sm data-[state=active]:bg-background transition-all">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg py-2.5 px-4 font-semibold data-[state=active]:shadow-sm data-[state=active]:bg-background transition-all">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <Card className="shadow-sm hover:shadow-md transition-shadow border-border rounded-2xl">
            <CardHeader className="bg-secondary rounded-t-2xl border-b">
              <CardTitle className="text-lg font-bold">Profile Information</CardTitle>
              <CardDescription>Update your personal details visible to the system.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                    {userName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm" className="mb-2 shadow-sm font-semibold border-border/50">Change Avatar</Button>
                  <p className="text-xs font-medium text-muted-foreground">JPG, GIF or PNG. 1MB max.</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">First Name</Label>
                  <Input defaultValue={userName.split(' ')[0] || ''} className="h-11 shadow-sm font-medium" />
                </div>
                <div className="space-y-2.5">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Last Name</Label>
                  <Input defaultValue={userName.split(' ').slice(1).join(' ') || ''} className="h-11 shadow-sm font-medium" />
                </div>
                <div className="space-y-2.5 col-span-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                  <Input defaultValue={userEmail} type="email" className="h-11 shadow-sm font-medium" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-secondary rounded-b-2xl">
              <Button className="font-semibold shadow-sm">Save Changes</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <Card className="shadow-sm hover:shadow-md transition-shadow border-border rounded-2xl">
            <CardHeader className="bg-secondary rounded-t-2xl border-b">
              <CardTitle className="text-lg font-bold">Current Plan</CardTitle>
              <CardDescription>Manage your subscription and billing cycle.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="p-6 border border-accent/20 rounded-xl bg-gradient-to-r from-accent/10 to-transparent flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10 w-full md:w-auto">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-black tracking-tight capitalize">{plan} Plan</h3>
                    <Badge variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5">Active</Badge>
                  </div>
                  <p className="text-sm font-medium text-muted-foreground/80">
                    {plan === 'free' ? 'You are currently on the free plan.' : 'Next billing date is July 24, 2026.'}
                  </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto relative z-10">
                  {plan !== 'free' && <Button variant="outline" className="w-full md:w-auto font-semibold shadow-sm border-border/50">Cancel Plan</Button>}
                  {plan !== 'premium' && (
                    <Link href="/pricing" className={buttonVariants({ className: "w-full md:w-auto font-semibold shadow-sm" })}>
                      Upgrade Plan
                    </Link>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Current Usage
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Resumes</span>
                    <span>{totalResumes} / {limits.resumes === Infinity ? 'Unlimited' : limits.resumes}</span>
                  </div>
                  <Progress value={resumesPercent} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>AI Actions</span>
                    <span>{aiUsageCount} / {limits.aiActionsPerMonth === Infinity ? 'Unlimited' : limits.aiActionsPerMonth}</span>
                  </div>
                  <Progress value={aiPercent} className="h-2" />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Exports</span>
                    <span>{exportUsageCount} / {limits.exportsPerMonth === Infinity ? 'Unlimited' : limits.exportsPerMonth}</span>
                  </div>
                  <Progress value={exportPercent} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow border-border rounded-2xl">
            <CardHeader className="bg-secondary rounded-t-2xl border-b">
              <CardTitle className="text-lg font-bold">Payment Method</CardTitle>
              <CardDescription>Update your credit card details.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-center gap-5 p-5 border border-border/50 rounded-xl hover:border-primary/30 transition-colors bg-background">
                <div className="bg-muted p-3 rounded-lg border border-border/50 shadow-sm">
                  <CreditCard className="h-6 w-6 text-foreground/70" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[15px]">Visa ending in 4242</p>
                  <p className="text-sm font-medium text-muted-foreground">Expires 12/28</p>
                </div>
                <Button variant="outline" size="sm" className="font-semibold shadow-sm border-border/50">Edit</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <Card className="shadow-sm hover:shadow-md transition-shadow border-border rounded-2xl">
            <CardHeader className="bg-secondary rounded-t-2xl border-b">
              <CardTitle className="text-lg font-bold">Email Notifications</CardTitle>
              <CardDescription>Choose what updates you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['Weekly Job Matches', 'Product Updates', 'Resume Tips & Tricks', 'Account Alerts'].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-5 border border-border/50 rounded-xl hover:bg-muted/10 transition-colors">
                  <div className="space-y-1">
                    <Label className="text-[15px] font-bold cursor-pointer">{item}</Label>
                    <p className="text-sm text-muted-foreground font-medium">Receive emails about {item.toLowerCase()}.</p>
                  </div>
                  {/* Custom Toggle Switch UI (visual mock) */}
                  <div className={`h-6 w-11 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${i === 2 ? 'bg-muted justify-start' : 'bg-primary justify-end'}`}>
                    <div className="bg-background h-5 w-5 rounded-full shadow-md" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
          <Card className="shadow-sm hover:shadow-md transition-shadow border-border rounded-2xl">
            <CardHeader className="bg-secondary rounded-t-2xl border-b">
              <CardTitle className="text-lg font-bold">Security</CardTitle>
              <CardDescription>Manage your password and security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Password</Label>
                <Input type="password" placeholder="••••••••" className="h-11 shadow-sm font-medium" />
              </div>
              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">New Password</Label>
                <Input type="password" placeholder="••••••••" className="h-11 shadow-sm font-medium" />
              </div>
              <div className="space-y-2.5">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Confirm New Password</Label>
                <Input type="password" placeholder="••••••••" className="h-11 shadow-sm font-medium" />
              </div>
            </CardContent>
            <CardFooter className="border-t bg-secondary rounded-b-2xl flex flex-col sm:flex-row justify-between gap-4">
              <Button className="font-semibold shadow-sm">Update Password</Button>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold">
                <LogOut className="mr-2 h-4 w-4" /> Sign out everywhere
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
