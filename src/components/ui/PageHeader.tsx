import React from 'react';
import { cn } from '@/lib/utils';

export type PageHeaderVariant = 'default' | 'compact' | 'centered' | 'hero';

interface PageHeaderProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: PageHeaderVariant;
  className?: string;
}

export function PageHeader({ 
  icon, 
  title, 
  description, 
  actions, 
  variant = 'default',
  className 
}: PageHeaderProps) {
  
  // Custom design token classes based on variants
  const containerClasses = {
    default: "pt-[var(--header-pt)] pb-[var(--header-pb)]",
    compact: "pt-[calc(var(--header-pt)/1.6)] pb-[calc(var(--header-pb)/1.5)]",
    centered: "pt-[var(--header-pt)] pb-[var(--header-pb)] text-center",
    hero: "pt-[calc(var(--header-pt)*1.5)] pb-[calc(var(--header-pb)*1.5)] px-4 md:px-8 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent border-b border-border/40"
  }[variant];

  const layoutClasses = {
    default: "flex flex-col md:flex-row md:items-center justify-between gap-[var(--header-gap)]",
    compact: "flex flex-col md:flex-row md:items-center justify-between gap-[calc(var(--header-gap)*0.75)]",
    centered: "flex flex-col items-center justify-center gap-[var(--header-gap)]",
    hero: "flex flex-col md:flex-row md:items-start lg:items-center justify-between gap-[var(--header-gap)]"
  }[variant];

  const iconWrapperClasses = {
    default: "w-[var(--header-icon-size)] h-[var(--header-icon-size)] rounded-[var(--header-icon-radius)]",
    compact: "w-[calc(var(--header-icon-size)*0.75)] h-[calc(var(--header-icon-size)*0.75)] rounded-[calc(var(--header-icon-radius)*0.75)]",
    centered: "w-[var(--header-icon-size)] h-[var(--header-icon-size)] rounded-[var(--header-icon-radius)] mx-auto mb-2",
    hero: "w-[calc(var(--header-icon-size)*1.2)] h-[calc(var(--header-icon-size)*1.2)] rounded-[var(--header-icon-radius)]"
  }[variant];

  const titleClasses = {
    default: "text-[var(--header-title-size)] font-bold tracking-tight leading-snug text-foreground",
    compact: "text-[calc(var(--header-title-size)*0.7)] font-bold tracking-tight leading-snug text-foreground",
    centered: "text-[var(--header-title-size)] font-bold tracking-tight leading-snug text-foreground",
    hero: "text-[calc(var(--header-title-size)*1.2)] md:text-[calc(var(--header-title-size)*1.4)] font-black tracking-tight leading-none text-foreground bg-clip-text"
  }[variant];

  const descClasses = {
    default: "text-[var(--header-description-size)] text-muted-foreground mt-0.5 leading-normal",
    compact: "text-[calc(var(--header-description-size)*0.85)] text-muted-foreground mt-0.5 leading-normal",
    centered: "text-[var(--header-description-size)] text-muted-foreground mt-1 leading-normal max-w-2xl mx-auto",
    hero: "text-[calc(var(--header-description-size)*1.1)] text-muted-foreground mt-2 leading-relaxed max-w-3xl"
  }[variant];

  const actionsWrapperClasses = {
    default: "flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto justify-end",
    compact: "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0 w-full sm:w-auto justify-end",
    centered: "flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-center w-full sm:w-auto mt-4",
    hero: "flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full sm:w-auto justify-end"
  }[variant];

  // Adjust icon dimensions inside container
  const iconElement = icon && React.isValidElement(icon) ? (
    React.cloneElement(icon as React.ReactElement<{ className?: string }>, { 
      className: cn(
        variant === 'compact' ? "h-5 w-5" : variant === 'hero' ? "h-8 w-8" : "h-7 w-7", 
        (icon as React.ReactElement<{ className?: string }>).props.className
      )
    })
  ) : icon;

  return (
    <div className={cn("w-full shrink-0 font-sans", containerClasses, className)}>
      <div className={layoutClasses}>
        <div className={cn(
          "flex items-center gap-4",
          variant === 'centered' ? "flex-col text-center w-full" : "flex-row",
          variant === 'hero' ? "items-start md:items-center" : ""
        )}>
          {icon && (
            <div className={cn(
              "shrink-0 flex items-center justify-center bg-primary/10 border border-primary/10 shadow-sm text-primary",
              iconWrapperClasses
            )}>
              {iconElement}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className={titleClasses}>{title}</h1>
            {description && (
              <p className={descClasses}>{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className={actionsWrapperClasses}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
