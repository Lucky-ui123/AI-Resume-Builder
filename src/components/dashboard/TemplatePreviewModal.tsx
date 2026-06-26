import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize, Check } from 'lucide-react';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { Resume } from '@/types';
import { mockResume } from '@/lib/mock-data';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string | null;
  onApply: (templateId: string) => void;
  customResume?: Resume; // If provided, uses this resume instead of mock
}

export function TemplatePreviewModal({ isOpen, onClose, templateId, onApply, customResume }: TemplatePreviewModalProps) {
  const [scale, setScale] = useState(0.8);

  if (!templateId) return null;

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
      <DialogContent className="max-w-[90vw] w-[1200px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-100">
        <DialogHeader className="p-4 bg-white border-b flex-row justify-between items-center space-y-0">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-xl">Template Preview</DialogTitle>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomOut} title="Zoom Out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleZoomIn} title="Zoom In">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-2" onClick={handleFitPage} title="Fit Page">
                <Maximize className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleApply} className="gap-2">
              <Check className="h-4 w-4" /> Apply Template
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-8 flex justify-center custom-scrollbar">
          <div 
            className="transition-transform duration-200 origin-top bg-white shadow-2xl"
            style={{ 
              transform: `scale(${scale})`,
              width: '800px', // ResumePreview width
              height: '1131px', // ResumePreview height
              marginBottom: `${1131 * (scale - 1)}px` // Prevent extra scroll space when scaling down
            }}
          >
            <ResumePreview resume={previewResume} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
