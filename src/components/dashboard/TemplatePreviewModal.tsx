import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ZoomIn, ZoomOut, Maximize, Check, X } from 'lucide-react';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { Resume } from '@/types';
import { mockResume } from '@/lib/mock-data';
import { templates } from '@/lib/templates';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string | null;
  onApply: (templateId: string) => void;
  customResume?: Resume;
}

export function TemplatePreviewModal({ isOpen, onClose, templateId, onApply, customResume }: TemplatePreviewModalProps) {
  const [scale, setScale] = useState(1);

  // Auto-scale based on window height initially
  useEffect(() => {
    if (isOpen) {
      const vh = window.innerHeight;
      const vw = window.innerWidth;

      // On mobile, scale down significantly
      if (vw < 768) {
        setScale(0.4);
      } else if (vh < 900) {
        setScale(0.65);
      } else {
        setScale(0.85);
      }
    }
  }, [isOpen]);

  if (!templateId) return null;

  const template = templates.find(t => t.id === templateId);
  const previewResume = {
    ...(customResume || mockResume),
    templateId,
  };

  const handleZoomIn = () => setScale(s => Math.min(s + 0.1, 1.5));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.1, 0.3));
  const handleFitPage = () => setScale(0.8);

  const handleApply = () => {
    onApply(templateId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-[80vw] sm:max-w-[90vw] md:max-w-[90vw] xl:max-w-[1400px] w-full h-[95vh] md:h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-100/50 backdrop-blur-sm border-border/50 shadow-2xl rounded-2xl"
      >
        {/* Header - Fixed */}
        <DialogHeader className="p-4 bg-white/80 backdrop-blur-md border-b border-border/50 flex-row justify-between items-center space-y-0 z-20 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <DialogTitle className="text-xl font-bold tracking-tight flex items-center gap-3">
              {template?.name || 'Template Preview'}
              {template?.isPremium && (
                <Badge variant="secondary" className="bg-warning-muted text-warning border-warning/20 font-semibold h-6 text-xs">Premium</Badge>
              )}
            </DialogTitle>
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground font-medium">
              <span>{template?.category[0]}</span>
              {template?.atsScore && template.atsScore >= 90 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-green-600 font-semibold">{template.atsScore}% ATS Friendly</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-md shadow-sm border border-border/50">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white" onClick={handleZoomOut} title="Zoom Out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium w-12 text-center text-muted-foreground">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white" onClick={handleZoomIn} title="Zoom In">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-2 hover:bg-white" onClick={handleFitPage} title="Fit Page">
                <Maximize className="h-4 w-4" />
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-200" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Preview Container - Scrollable */}
        <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start custom-scrollbar z-10 relative">
          <div
            className="transition-transform duration-200 origin-top bg-white shadow-2xl rounded-sm border border-border/10"
            style={{
              transform: `scale(${scale})`,
              width: '800px', // ResumePreview fixed width (A4 ratio width)
              height: '1131px', // ResumePreview fixed height (A4 ratio height)
              marginBottom: scale < 1 ? `-${1131 * (1 - scale)}px` : `${1131 * (scale - 1)}px`,
              marginLeft: scale < 1 ? `-${(800 * (1 - scale)) / 2}px` : `${(800 * (scale - 1)) / 2}px`,
              marginRight: scale < 1 ? `-${(800 * (1 - scale)) / 2}px` : `${(800 * (scale - 1)) / 2}px`,
              flexShrink: 0,
            }}
          >
            <ResumePreview resume={previewResume} />
          </div>
        </div>

        {/* Footer - Fixed */}
        <div className="p-4 bg-white/80 backdrop-blur-md border-t border-border/50 flex flex-row items-center justify-end gap-3 z-20 shrink-0">
          <Button variant="outline" onClick={onClose} className="font-semibold shadow-sm">
            Cancel
          </Button>
          <Button onClick={handleApply} className="gap-2 font-bold shadow-sm">
            <Check className="h-4 w-4" /> Use {template?.name || 'Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
