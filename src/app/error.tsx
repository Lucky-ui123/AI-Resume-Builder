'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App level error:', error);
  }, [error]);

  return (
    <div className="flex h-[100vh] w-full flex-col items-center justify-center p-4 bg-background">
      <div className="flex max-w-[400px] flex-col items-center text-center space-y-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Something went wrong!</h2>
        <p className="text-muted-foreground text-sm">
          An unexpected error occurred. Our team has been notified.
        </p>
        <div className="flex gap-4 mt-4">
          <Button onClick={() => reset()} variant="default">
            Try again
          </Button>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Go to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
