import React from 'react';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 px-6 text-center border border-dashed border-border rounded-2xl bg-card/40 shadow-sm">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4 shrink-0">
        {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-8 w-8" }) : icon}
      </div>
      <h3 className="text-xl font-bold tracking-tight text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md text-sm md:text-base leading-relaxed">{description}</p>
      {action && <div className="flex gap-3">{action}</div>}
    </Card>
  );
}
