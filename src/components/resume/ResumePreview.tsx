import React, { forwardRef, memo } from 'react';
import { Resume, ThemeConfig } from '@/types';
import { ClassicATS } from './templates/ClassicATS';
import { ModernProfessional } from './templates/ModernProfessional';
import { ProductDesigner } from './templates/ProductDesigner';
import { Executive } from './templates/Executive';
import { Startup } from './templates/Startup';
import { NordicMinimal } from './templates/NordicMinimal';
import { SiliconValley } from './templates/SiliconValley';
import { HarvardAcademic } from './templates/HarvardAcademic';
import { CreativeSidebar } from './templates/CreativeSidebar';
import { TimelineModern } from './templates/TimelineModern';

export type LayoutType = 'classic-ats' | 'modern-professional' | 'product-designer';

interface ResumePreviewProps {
  resume: Resume;
}

const isLightColor = (color: string): boolean => {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
};

export const ResumePreview = memo(forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ resume }, ref) => {
    const theme = resume.theme || {} as Partial<ThemeConfig>;
    
    // Resolve spacing and densities
    const densityMap = {
      compact: { padding: 16, spacing: 10 },
      normal: { padding: 24, spacing: 16 },
      comfortable: { padding: 32, spacing: 24 }
    };
    const defaultDensity = (theme.density || 'normal') as 'compact' | 'normal' | 'comfortable';
    const paddingVal = theme.contentPadding !== undefined ? theme.contentPadding : densityMap[defaultDensity].padding;
    const spacingVal = theme.sectionSpacing !== undefined ? theme.sectionSpacing : densityMap[defaultDensity].spacing;
    
    // Load font dynamically from Google Fonts if it's not a standard system font
    const fontName = theme.fontFamily ? theme.fontFamily.split(',')[0].trim().replace(/['"]/g, '') : 'Inter';
    const isSystemFont = ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'].includes(fontName);
    
    const isPrimaryLight = isLightColor(theme.primaryColor || '#0f172a');
    const asideTextColor = isPrimaryLight ? '#0f172a' : '#ffffff';
    const asideMutedTextColor = isPrimaryLight ? '#334155' : 'rgba(255, 255, 255, 0.75)';
    const asideSubtleTextColor = isPrimaryLight ? '#475569' : 'rgba(255, 255, 255, 0.5)';

    // Dynamic styling based on theme
    const themeStyle = {
      '--theme-primary': theme.primaryColor || '#0f172a',
      '--theme-secondary': theme.secondaryColor || '#475569',
      '--theme-accent': theme.accentColor || '#3b82f6',
      '--theme-heading': theme.headingColor || theme.primaryColor || '#0f172a',
      '--theme-body': theme.bodyColor || '#1e293b',
      '--theme-link': theme.linkColor || '#2563eb',
      '--theme-divider': theme.dividerColor || '#e2e8f0',
      '--theme-font': theme.fontFamily || 'Inter, sans-serif',
      
      // Sidebar contrast
      '--theme-aside-background': theme.primaryColor || '#0f172a',
      '--theme-aside-text': asideTextColor,
      '--theme-aside-muted': asideMutedTextColor,
      '--theme-aside-subtle': asideSubtleTextColor,

      // Chips theme values
      '--theme-chip-background': 'rgba(128, 128, 128, 0.08)',
      '--theme-chip-text': theme.bodyColor || '#1e293b',
      '--theme-chip-border': 'rgba(128, 128, 128, 0.15)',
      '--theme-aside-chip-background': isPrimaryLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.15)',
      '--theme-aside-chip-text': asideTextColor,
      '--theme-aside-chip-border': isPrimaryLight ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.25)',

      // Typography
      '--theme-font-size-heading': `${theme.fontSizeHeading || 20}px`,
      '--theme-font-size-body': `${theme.fontSizeBody || 12}px`,
      '--theme-font-size-name': `${theme.fontSizeName || 32}px`,
      '--theme-font-weight-body': theme.fontWeightBody || '400',
      '--theme-line-height': theme.lineHeight || '1.4',
      '--theme-letter-spacing': `${theme.letterSpacing || 0}px`,
      
      // Spacing & Borders
      '--theme-padding': `${paddingVal}px`,
      '--theme-section-spacing': `${spacingVal}px`,
      '--theme-border-radius': `${theme.borderRadius !== undefined ? theme.borderRadius : 4}px`,
      
      width: theme.paperSize === 'letter' ? '816px' : theme.paperSize === 'legal' ? '816px' : '800px',
      minHeight: theme.paperSize === 'letter' ? '1056px' : theme.paperSize === 'legal' ? '1344px' : '1131px',
      boxSizing: 'border-box' as const,
      fontFamily: 'var(--theme-font)',
      background: theme.backgroundColor || '#ffffff',
      color: 'var(--theme-body)',
    } as React.CSSProperties;

    // Resolve the layout component based on templateId
    let TemplateComponent = ClassicATS;
    if (resume.templateId === 'modern-professional') TemplateComponent = ModernProfessional;
    else if (resume.templateId === 'product-designer') TemplateComponent = ProductDesigner;
    else if (resume.templateId === 'executive') TemplateComponent = Executive;
    else if (resume.templateId === 'startup') TemplateComponent = Startup;
    else if (resume.templateId === 'nordic-minimal') TemplateComponent = NordicMinimal;
    else if (resume.templateId === 'silicon-valley') TemplateComponent = SiliconValley;
    else if (resume.templateId === 'harvard-academic') TemplateComponent = HarvardAcademic;
    else if (resume.templateId === 'creative-sidebar') TemplateComponent = CreativeSidebar;
    else if (resume.templateId === 'timeline-modern') TemplateComponent = TimelineModern;

    return (
      <div 
        ref={ref} 
        id="resume-preview-root"
        className="text-slate-900 mx-auto relative break-words"
        style={themeStyle}
      >
        {!isSystemFont && (
          <link 
            href={`https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap`} 
            rel="stylesheet" 
          />
        )}
        <style dangerouslySetInnerHTML={{ __html: `
          #resume-preview-root,
          #resume-preview-root *,
          #resume-preview-root .font-sans,
          #resume-preview-root .font-serif,
          #resume-preview-root .font-mono {
            font-family: var(--theme-font) !important;
          }
          #resume-preview-root,
          #resume-preview-root .bg-white,
          #resume-preview-root .bg-background {
            background-color: var(--theme-background) !important;
          }
          #resume-preview-root .bg-slate-50 {
            background-color: rgba(128, 128, 128, 0.05) !important;
          }
          
          /* Main / Standard Page Content */
          #resume-preview-root main,
          #resume-preview-root main *,
          #resume-preview-root .resume-main,
          #resume-preview-root .resume-main *,
          #resume-preview-root:not(:has(aside)):not(:has(.resume-sidebar)),
          #resume-preview-root:not(:has(aside)):not(:has(.resume-sidebar)) * {
            color: var(--theme-body);
          }
          #resume-preview-root main .text-slate-900,
          #resume-preview-root main .text-slate-800,
          #resume-preview-root main .text-slate-700,
          #resume-preview-root main .text-slate-600,
          #resume-preview-root .resume-main .text-slate-900,
          #resume-preview-root .resume-main .text-slate-800,
          #resume-preview-root .resume-main .text-slate-700,
          #resume-preview-root .resume-main .text-slate-600 {
            color: var(--theme-body) !important;
          }
          #resume-preview-root main .text-slate-500,
          #resume-preview-root main .text-slate-400,
          #resume-preview-root .resume-main .text-slate-500,
          #resume-preview-root .resume-main .text-slate-400 {
            color: var(--theme-secondary) !important;
          }
          #resume-preview-root .resume-main span,
          #resume-preview-root main span {
            color: inherit;
          }

          /* Aside / Sidebar Specific Elements */
          #resume-preview-root .resume-sidebar,
          #resume-preview-root .resume-sidebar *,
          #resume-preview-root aside,
          #resume-preview-root aside * {
            color: var(--theme-aside-text) !important;
          }
          #resume-preview-root .resume-sidebar h2,
          #resume-preview-root .resume-sidebar h3,
          #resume-preview-root aside h2,
          #resume-preview-root aside h3 {
            color: var(--theme-aside-text) !important;
          }
          #resume-preview-root .resume-sidebar .text-slate-900,
          #resume-preview-root .resume-sidebar .text-slate-800,
          #resume-preview-root .resume-sidebar .text-slate-700,
          #resume-preview-root .resume-sidebar .text-slate-600,
          #resume-preview-root aside .text-slate-900,
          #resume-preview-root aside .text-slate-800,
          #resume-preview-root aside .text-slate-700,
          #resume-preview-root aside .text-slate-600,
          #resume-preview-root .resume-sidebar .opacity-70,
          #resume-preview-root .resume-sidebar .opacity-80,
          #resume-preview-root aside .opacity-70,
          #resume-preview-root aside .opacity-80 {
            color: var(--theme-aside-muted) !important;
          }
          #resume-preview-root .resume-sidebar .text-slate-500,
          #resume-preview-root .resume-sidebar .text-slate-400,
          #resume-preview-root .resume-sidebar .text-slate-300,
          #resume-preview-root aside .text-slate-500,
          #resume-preview-root aside .text-slate-400,
          #resume-preview-root aside .text-slate-300,
          #resume-preview-root .resume-sidebar .opacity-50,
          #resume-preview-root .resume-sidebar .opacity-60,
          #resume-preview-root aside .opacity-50,
          #resume-preview-root aside .opacity-60 {
            color: var(--theme-aside-subtle) !important;
          }
          #resume-preview-root .resume-sidebar svg,
          #resume-preview-root .resume-sidebar i,
          #resume-preview-root aside svg,
          #resume-preview-root aside i {
            color: var(--theme-aside-text) !important;
            fill: var(--theme-aside-text) !important;
          }

          /* Chips / Badges Styling */
          #resume-preview-root .resume-main .bg-slate-100,
          #resume-preview-root main .bg-slate-100,
          #resume-preview-root:not(:has(aside)):not(:has(.resume-sidebar)) .bg-slate-100 {
            background-color: var(--theme-chip-background) !important;
            color: var(--theme-chip-text) !important;
            border-color: var(--theme-chip-border) !important;
          }
          #resume-preview-root .resume-sidebar .bg-black\/20,
          #resume-preview-root aside .bg-black\/20,
          #resume-preview-root .resume-sidebar span[class*="Badge"],
          #resume-preview-root aside span[class*="Badge"] {
            background-color: var(--theme-aside-chip-background) !important;
            color: var(--theme-aside-chip-text) !important;
            border-color: var(--theme-aside-chip-border) !important;
          }

          #resume-preview-root {
            padding: var(--theme-padding) !important;
          }
          #resume-preview-root h1, 
          #resume-preview-root .resume-name {
            font-size: var(--theme-font-size-name) !important;
            color: var(--theme-heading) !important;
            letter-spacing: var(--theme-letter-spacing) !important;
          }
          #resume-preview-root h2,
          #resume-preview-root .resume-section-title {
            font-size: var(--theme-font-size-heading) !important;
            color: var(--theme-heading) !important;
            letter-spacing: var(--theme-letter-spacing) !important;
            margin-bottom: var(--theme-section-spacing) !important;
          }
          #resume-preview-root p,
          #resume-preview-root li,
          #resume-preview-root span:not(.date-badge-text),
          #resume-preview-root div:not(.ignore-body-style) {
            font-size: var(--theme-font-size-body);
            line-height: var(--theme-line-height);
            font-weight: var(--theme-font-weight-body);
          }
          #resume-preview-root section {
            margin-bottom: var(--theme-section-spacing) !important;
          }
          #resume-preview-root hr,
          #resume-preview-root .resume-divider {
            border-color: var(--theme-divider) !important;
            ${theme.dividerStyle === 'double' ? 'border-style: double !important; border-width: 3px 0 0 0 !important;' : ''}
            ${theme.dividerStyle === 'dotted' ? 'border-style: dotted !important; border-width: 2px 0 0 0 !important;' : ''}
            ${theme.dividerStyle === 'dashed' ? 'border-style: dashed !important; border-width: 1.5px 0 0 0 !important;' : ''}
            ${theme.dividerStyle === 'none' ? 'display: none !important;' : ''}
          }
          /* Profile Photo rendering */
          #resume-preview-root .profile-photo {
            display: ${theme.photoEnabled === false ? 'none' : 'block'};
            border-radius: ${theme.photoShape === 'circle' ? '50%' : theme.photoShape === 'rounded-square' ? '12px' : '0'} !important;
            width: ${theme.photoSize === 'small' ? '60px' : theme.photoSize === 'large' ? '120px' : '90px'} !important;
            height: ${theme.photoSize === 'small' ? '60px' : theme.photoSize === 'large' ? '120px' : '90px'} !important;
          }
          /* Headings Custom Styles */
          ${theme.headingStyle === 'style2' ? `
            #resume-preview-root h2, #resume-preview-root .resume-section-title {
              border-bottom: 2px solid var(--theme-primary) !important;
              padding-bottom: 4px !important;
            }
          ` : ''}
          ${theme.headingStyle === 'style3' ? `
            #resume-preview-root h2, #resume-preview-root .resume-section-title {
              border-left: 4px solid var(--theme-primary) !important;
              padding-left: 8px !important;
            }
          ` : ''}
          ${theme.headingStyle === 'style4' ? `
            #resume-preview-root h2::before, #resume-preview-root .resume-section-title::before {
              content: '■ ';
              color: var(--theme-primary);
              margin-right: 6px;
            }
          ` : ''}
          ${theme.headingStyle === 'style5' ? `
            #resume-preview-root h2, #resume-preview-root .resume-section-title {
              border-left: 3px solid var(--theme-primary) !important;
              padding-left: 8px !important;
              border-bottom: 1px solid var(--theme-divider) !important;
              padding-bottom: 4px !important;
            }
          ` : ''}
        ` }} />
        <TemplateComponent resume={resume} />
      </div>
    );
  }
));
ResumePreview.displayName = 'ResumePreview';
