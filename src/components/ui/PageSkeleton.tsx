import React from 'react';

// Builder Skeleton (Editor Panel + Preview Pane)
export function BuilderSkeleton() {
  return (
    <div className="flex flex-col h-full w-full animate-pulse bg-muted/10 font-sans">
      <div className="sticky top-0 z-20 px-4 md:px-6 bg-card border-b border-border/40 py-4 shrink-0 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-muted/60 shrink-0" />
          <div className="space-y-2">
            <div className="h-5 w-44 bg-muted/60 rounded-md" />
            <div className="h-3.5 w-64 bg-muted/40 rounded-md" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-muted/60 rounded-lg" />
          <div className="h-9 w-28 bg-muted/50 rounded-lg" />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-1/2 p-6 space-y-6 border-r border-border/50 bg-background">
          <div className="flex gap-2 border-b border-border/40 pb-3">
            <div className="h-8 w-24 bg-muted/70 rounded-md" />
            <div className="h-8 w-24 bg-muted/40 rounded-md" />
            <div className="h-8 w-24 bg-muted/40 rounded-md" />
          </div>
          <div className="space-y-4 pt-2">
            <div className="h-4 w-32 bg-muted/60 rounded" />
            <div className="h-10 w-full bg-muted/40 rounded-lg" />
            <div className="h-4 w-32 bg-muted/60 rounded" />
            <div className="h-10 w-full bg-muted/40 rounded-lg" />
            <div className="h-24 w-full bg-muted/30 rounded-lg" />
          </div>
        </div>
        <div className="w-1/2 p-8 bg-muted/20 flex items-center justify-center">
          <div className="w-[480px] h-[640px] bg-card border border-border/60 rounded-xl shadow-lg p-8 space-y-4">
            <div className="h-8 w-1/2 bg-muted/70 rounded mx-auto" />
            <div className="h-4 w-1/3 bg-muted/40 rounded mx-auto" />
            <div className="h-[1px] w-full bg-border my-6" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-muted/50 rounded" />
              <div className="h-4 w-5/6 bg-muted/40 rounded" />
              <div className="h-4 w-4/5 bg-muted/30 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Templates Skeleton (Grid of Template Cards)
export function TemplatesSkeleton() {
  return (
    <div className="flex flex-col h-full w-full animate-pulse bg-muted/10 font-sans">
      <div className="sticky top-0 z-20 px-4 md:px-6 bg-card border-b border-border/40 py-4 shrink-0 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-muted/60 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-40 bg-muted/60 rounded-md" />
          <div className="h-3.5 w-64 bg-muted/40 rounded-md" />
        </div>
      </div>
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-muted/70 rounded-full" />
            <div className="h-8 w-24 bg-muted/40 rounded-full" />
            <div className="h-8 w-20 bg-muted/40 rounded-full" />
          </div>
          <div className="h-9 w-64 bg-card border rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-80 bg-card border border-border/50 rounded-2xl p-4 flex flex-col justify-between shadow-sm">
              <div className="h-48 bg-muted/30 rounded-xl border border-dashed border-border/60" />
              <div className="space-y-2 pt-2">
                <div className="h-5 w-1/2 bg-muted/70 rounded" />
                <div className="h-3.5 w-3/4 bg-muted/40 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Settings Skeleton (Form Field Placeholders)
export function SettingsSkeleton() {
  return (
    <div className="flex flex-col h-full w-full animate-pulse bg-muted/10 font-sans">
      <div className="sticky top-0 z-20 px-4 md:px-6 bg-card border-b border-border/40 py-4 shrink-0 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-muted/60 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-40 bg-muted/60 rounded-md" />
          <div className="h-3.5 w-64 bg-muted/40 rounded-md" />
        </div>
      </div>
      <div className="p-4 md:p-6 max-w-4xl space-y-6">
        <div className="flex gap-4 border-b border-border/40 pb-3">
          <div className="h-8 w-24 bg-muted/70 rounded-lg" />
          <div className="h-8 w-24 bg-muted/40 rounded-lg" />
          <div className="h-8 w-24 bg-muted/40 rounded-lg" />
        </div>
        <div className="bg-card border rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="w-16 h-16 rounded-full bg-muted/60" />
            <div className="space-y-2">
              <div className="h-5 w-32 bg-muted/70 rounded" />
              <div className="h-3.5 w-48 bg-muted/40 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted/60 rounded" />
              <div className="h-10 w-full bg-muted/30 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-muted/60 rounded" />
              <div className="h-10 w-full bg-muted/30 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generic Page Skeleton
export function PageSkeleton({ cardsCount = 6 }: { cardsCount?: number }) {
  return (
    <div className="flex flex-col h-full w-full animate-pulse bg-muted/10 font-sans">
      <div className="sticky top-0 z-20 px-4 md:px-6 bg-card border-b border-border/40 py-4 shrink-0 flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-muted/60 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-5 w-48 bg-muted/60 rounded-md" />
          <div className="h-3.5 w-72 bg-muted/40 rounded-md" />
        </div>
      </div>
      <div className="p-4 md:p-6 w-full space-y-6 flex-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
          {Array.from({ length: cardsCount }).map((_, i) => (
            <div key={i} className="h-64 bg-card border border-border/50 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="space-y-3">
                <div className="h-6 w-3/4 bg-muted/70 rounded" />
                <div className="h-4 w-1/2 bg-muted/40 rounded" />
                <div className="h-20 w-full bg-muted/30 rounded-lg mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
