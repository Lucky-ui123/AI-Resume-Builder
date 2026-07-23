import React from 'react';
import { cn } from '@/lib/utils';

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("p-4 md:p-6 w-full space-y-6 font-sans animate-in fade-in duration-300", className)}>
      {children}
    </div>
  );
}
