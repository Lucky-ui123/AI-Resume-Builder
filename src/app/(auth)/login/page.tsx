'use client'

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileText, Loader2 } from 'lucide-react';
import { login } from '../actions';
import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from '@/components/layout/Navbar';

function LoginForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(searchParams.get('error'));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Link href="/" className="flex items-center gap-2.5 mb-8">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">HireCraft AI</span>
          </Link>
        </div>
        
        <Card className="shadow-md">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-heading">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your email and password to sign in
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              {error && (
                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="m@example.com"
                    defaultValue="user@example.com"
                    required 
                  />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
                  <Link href="#" className="text-sm font-medium text-primary hover:text-primary/80 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    defaultValue="password123"
                    required 
                  />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                className="w-full font-semibold shadow-sm" 
                size="lg"
                type="submit" 
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-semibold text-primary hover:text-primary/80 hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <LoginForm />
    </Suspense>
  );
}
