import React, { useMemo, memo } from 'react';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { mockResume } from '@/lib/mock-data';

interface TemplateMiniPreviewProps {
  templateId: string;
  scale?: number;
}

export const TemplateMiniPreview = memo(function TemplateMiniPreview({ templateId, scale = 0.22 }: TemplateMiniPreviewProps) {
  const previewResume = useMemo(() => {
    return {
      ...mockResume,
      templateId,
    };
  }, [templateId]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-50 rounded-lg">
      <div 
        className="pointer-events-none absolute top-1/2 left-1/2"
        style={{ 
          transform: `translate(-50%, -50%) scale(${scale})`,
          width: '800px', // matches ResumePreview width
          height: '1131px', // matches ResumePreview height
          transformOrigin: 'center center'
        }}
      >
        <div className="shadow-2xl bg-white border border-slate-200 w-full h-full">
          <ResumePreview resume={previewResume} />
        </div>
      </div>
    </div>
  );
});
