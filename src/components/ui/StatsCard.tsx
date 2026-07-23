import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function StatsCard({ icon, title, value, subtitle, className }: StatsCardProps) {
  return (
    <Card className={cn("p-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300", className)}>
      <CardContent className="p-6 flex items-center gap-5">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "h-6 w-6" }) : icon}
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
          <h3 className="text-3xl font-extrabold tracking-tight mt-1">{value}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
