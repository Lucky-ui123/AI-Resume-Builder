'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 bg-background rounded-lg border border-border shadow-sm min-h-[400px]">
      <div className="flex max-w-[400px] flex-col items-center text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-500" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Failed to load dashboard component</h2>
        <p className="text-muted-foreground text-sm">
          An unexpected error occurred while loading this section.
        </p>
        <div className="flex gap-4 mt-2">
          <Button onClick={() => reset()} variant="default" size="sm">
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
