'use client';

import { Resume } from '@/types';
import { 
  Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup 
} from '@/components/ui/dropdown-menu';
import { 
  FileText, MoreVertical, Edit3, Copy, Trash2, Download, 
  History, Plus, FileEdit, Clock, Target, User, Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ResumeCardProps {
  resume: Resume;
  onEdit: (resume: Resume) => void;
  onRename: (resume: Resume) => void;
  onDuplicate: (resume: Resume) => void;
  onDelete: (resume: Resume) => void;
  onExport: (resume: Resume) => void;
  onSaveVersion?: (resume: Resume) => void;
  onViewVersions?: (resume: Resume) => void;
  isExporting?: boolean;
}

const getTemplateName = (id?: string) => {
  if (!id) return 'Classic ATS';
  if (id === 'classic-ats') return 'Classic ATS';
  if (id === 'modern-professional') return 'Modern Professional';
  if (id === 'product-designer') return 'Product Designer';
  if (id === 'executive') return 'Executive';
  if (id === 'startup') return 'Startup';
  return id.replace('tpl_', '').replace('-', ' ');
};

export function ResumeCard({
  resume,
  onEdit,
  onRename,
  onDuplicate,
  onDelete,
  onExport,
  onSaveVersion,
  onViewVersions,
  isExporting = false
}: ResumeCardProps) {
  const candidateName = [resume.personalInfo?.firstName, resume.personalInfo?.lastName]
    .filter(Boolean)
    .join(' ') || 'No name specified';

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group border-border rounded-2xl">
      <CardHeader className="pb-4 bg-secondary border-b relative">
        <div className="absolute top-4 right-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground h-8 w-8 bg-background/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" disabled={isExporting}>
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onEdit(resume)} className="cursor-pointer">
                  <Edit3 className="mr-2 h-4 w-4 text-primary" /> Edit content
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRename(resume)} className="cursor-pointer">
                  <FileEdit className="mr-2 h-4 w-4 text-primary" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDuplicate(resume)} className="cursor-pointer">
                  <Copy className="mr-2 h-4 w-4 text-success" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport(resume)} className="cursor-pointer">
                  <Download className="mr-2 h-4 w-4 text-primary" /> Export PDF
                </DropdownMenuItem>
                {onSaveVersion && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onSaveVersion(resume)} className="cursor-pointer">
                      <Plus className="mr-2 h-4 w-4" /> Save Version
                    </DropdownMenuItem>
                  </>
                )}
                {onViewVersions && (
                  <DropdownMenuItem onClick={() => onViewVersions(resume)} className="cursor-pointer">
                    <History className="mr-2 h-4 w-4" /> View Versions
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onDelete(resume)} className="text-destructive focus:text-destructive cursor-pointer">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-background border border-border flex items-center justify-center mb-3 text-foreground">
          <FileText className="h-5 w-5" />
        </div>
        <CardTitle className="text-lg truncate pr-8 flex items-center gap-2" title={resume.title || 'Untitled'}>
          <span className="truncate">{resume.title || 'Untitled'}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${resume.isDraft ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
            {resume.isDraft ? 'Draft' : 'Saved'}
          </span>
        </CardTitle>
        <CardDescription className="flex items-center mt-1 text-xs truncate">
          <Target className="h-3.5 w-3.5 mr-1 flex-shrink-0 text-muted-foreground" />
          <span className="truncate">{resume.targetRole || 'General Resume'}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="py-4 flex-1 space-y-3">
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Candidate</span>
            <span className="font-semibold truncate flex items-center gap-1 mt-0.5">
              <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{candidateName}</span>
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Template</span>
            <span className="font-semibold truncate mt-0.5">{getTemplateName(resume.templateId)}</span>
          </div>
          <div className="flex flex-col col-span-2">
            <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Last Updated</span>
            <span className="font-semibold truncate flex items-center gap-1 mt-0.5 text-xs text-foreground/80">
              <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              <span>{resume.lastModified ? formatDistanceToNow(new Date(resume.lastModified), { addSuffix: true }) : 'Unknown'}</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-border/40">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Theme Color:</span>
          <span 
            className="h-3 w-3 rounded-full border border-border shadow-sm inline-block" 
            style={{ backgroundColor: resume.theme?.primaryColor || '#0f172a' }}
            title={resume.theme?.primaryColor || '#0f172a'}
          />
          <span className="text-xs font-semibold text-muted-foreground/80 font-mono text-[10px]">{resume.theme?.primaryColor || '#0f172a'}</span>
        </div>
      </CardContent>
      <CardFooter className="pb-4 border-t mt-auto flex gap-2 pt-4 bg-secondary/10">
        <Button className="w-full font-semibold" variant="default" size="sm" onClick={() => onEdit(resume)} disabled={isExporting}>
          Edit Resume
        </Button>
        <Button className="w-full font-semibold" variant="outline" size="sm" onClick={() => onExport(resume)} disabled={isExporting}>
          {isExporting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Download className="mr-1 h-3.5 w-3.5" />}
          Export PDF
        </Button>
      </CardFooter>
    </Card>
  );
}
