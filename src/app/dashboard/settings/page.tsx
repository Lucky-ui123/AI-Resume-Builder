import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Settings, CreditCard, LogOut, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getUserSubscription, getDashboardStats } from '@/lib/db-service';
import { updateProfileAction } from './actions';
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
        <TabsList className="mb-8 w-fit">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="billing">Billing & Plan</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <form action={updateProfileAction}>
            <Card>
              <CardHeader className="bg-secondary border-b">
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal details visible to the system.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                      {userName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <Button variant="outline" size="sm" type="button">Change Avatar</Button>
                    <p className="text-xs text-muted-foreground">JPG, GIF or PNG. 1MB max.</p>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" name="firstName" defaultValue={userName.split(' ')[0] || ''} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" name="lastName" defaultValue={userName.split(' ').slice(1).join(' ') || ''} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" name="email" defaultValue={userEmail} type="email" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-secondary border-t">
                <Button type="submit">Save Changes</Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader className="bg-secondary border-b">
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Manage your subscription and billing cycle.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 rounded-xl border bg-muted/30">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold capitalize">{plan} Plan</h3>
                    <Badge variant="secondary" className="font-semibold">Active</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {plan === 'free' ? 'You are currently on the free plan.' : 'Next billing date is July 24, 2026.'}
                  </p>
                </div>
                <div className="flex gap-2">
                  {plan !== 'free' && <Button variant="outline" size="sm">Cancel Plan</Button>}
                  {plan !== 'premium' && (
                    <Link href="/pricing">
                      <Button size="sm">Upgrade Plan</Button>
                    </Link>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Current Usage
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Resumes</span>
                    <span className="text-muted-foreground">{totalResumes} / {limits.resumes === Infinity ? 'Unlimited' : limits.resumes}</span>
                  </div>
                  <Progress value={resumesPercent} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>AI Actions</span>
                    <span className="text-muted-foreground">{aiUsageCount} / {limits.aiActionsPerMonth === Infinity ? 'Unlimited' : limits.aiActionsPerMonth}</span>
                  </div>
                  <Progress value={aiPercent} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>Exports</span>
                    <span className="text-muted-foreground">{exportUsageCount} / {limits.exportsPerMonth === Infinity ? 'Unlimited' : limits.exportsPerMonth}</span>
                  </div>
                  <Progress value={exportPercent} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-secondary border-b">
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>Update your credit card details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30">
                <div className="bg-background p-3 rounded-lg border">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Visa ending in 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/28</p>
                </div>
                <Button variant="outline" size="sm">Edit</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader className="bg-secondary border-b">
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Choose what updates you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {['Weekly Job Matches', 'Product Updates', 'Resume Tips & Tricks', 'Account Alerts'].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="space-y-0.5">
                    <Label className="font-semibold cursor-pointer">{item}</Label>
                    <p className="text-sm text-muted-foreground">Receive emails about {item.toLowerCase()}.</p>
                  </div>
                  <div className={`h-6 w-11 rounded-full flex items-center p-0.5 cursor-pointer transition-colors ${i === 2 ? 'bg-muted justify-start' : 'bg-primary justify-end'}`}>
                    <div className="bg-background h-5 w-5 rounded-full shadow-md" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader className="bg-secondary border-b">
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and security settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" placeholder="••••••••" />
              </div>
            </CardContent>
            <CardFooter className="bg-secondary border-t flex flex-col sm:flex-row justify-between gap-4">
              <Button>Update Password</Button>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sign out everywhere
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
