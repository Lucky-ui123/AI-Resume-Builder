import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingState({ message = "Loading content..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground gap-3">
      <Loader2 className="animate-spin h-10 w-10 text-primary" />
      <span className="text-sm font-medium tracking-wide">{message}</span>
    </div>
  );
}
