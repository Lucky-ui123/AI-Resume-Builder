import React from 'react';
import { cn } from '@/lib/utils';

export function PageContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-8", className)}>
      {children}
    </div>
  );
}
