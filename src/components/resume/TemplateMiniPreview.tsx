import React, { useMemo } from 'react';
import { ResumePreview } from '@/components/resume/ResumePreview';
import { mockResume } from '@/lib/mock-data';

interface TemplateMiniPreviewProps {
  templateId: string;
  scale?: number;
}

export function TemplateMiniPreview({ templateId, scale = 0.22 }: TemplateMiniPreviewProps) {
  const previewResume = useMemo(() => {
    return {
      ...mockResume,
      templateId,
    };
  }, [templateId]);

  return (
    <div className="w-full h-full relative overflow-hidden flex items-start justify-center pt-2">
      <div 
        className="pointer-events-none origin-top"
        style={{ 
          transform: `scale(${scale})`,
          width: '800px', // matches ResumePreview width
          height: '1131px', // matches ResumePreview height
        }}
      >
        <div className="shadow-2xl bg-white border border-slate-200">
          <ResumePreview resume={previewResume} />
        </div>
      </div>
    </div>
  );
}
