import React from 'react';
import { Certification, Project, Language, Award, CustomSection } from '@/types';

export const DateBadge = ({ startDate, endDate, current }: { startDate: string; endDate: string; current?: boolean }) => (
  <span className="relative inline-block px-2 py-1 text-xs font-semibold rounded-md overflow-hidden">
    <span className="absolute inset-0 opacity-10" style={{ backgroundColor: 'var(--theme-primary)' }}></span>
    <span className="relative z-10" style={{ color: 'var(--theme-primary)' }}>
      {startDate} – {current ? 'Present' : endDate}
    </span>
  </span>
);

export const SkillBadge = ({ name }: { name: string }) => (
  <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200">
    {name}
  </span>
);

export const DarkSkillBadge = ({ name }: { name: string }) => (
  <span className="bg-black/20 text-white/90 text-xs font-medium px-2.5 py-1 rounded-md border border-white/10">
    {name}
  </span>
);

export const RenderCertifications = ({ certifications }: { certifications?: Certification[] }) => {
  if (!certifications || certifications.length === 0) return null;
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="text-lg font-bold uppercase tracking-wider border-b mb-3 pb-1 resume-section-title" style={{ borderColor: 'var(--theme-primary)' }}>Certifications</h2>
      <div className="space-y-2">
        {certifications.map((cert) => (
          <div key={cert.id} className="flex justify-between items-baseline text-sm">
            <div>
              <span className="font-bold">{cert.name}</span>
              <span className="text-slate-600"> – {cert.issuer}</span>
            </div>
            <span className="text-xs font-semibold text-slate-500">{cert.date}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export const RenderProjects = ({ projects }: { projects?: Project[] }) => {
  if (!projects || projects.length === 0) return null;
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="text-lg font-bold uppercase tracking-wider border-b mb-3 pb-1 resume-section-title" style={{ borderColor: 'var(--theme-primary)' }}>Projects</h2>
      <div className="space-y-4">
        {projects.map((proj) => (
          <div key={proj.id} className="break-inside-avoid">
            <div className="flex justify-between items-baseline mb-0.5">
              <h3 className="font-bold text-sm">{proj.name}</h3>
              {proj.startDate && <span className="text-xs font-semibold text-slate-500">{proj.startDate} – {proj.endDate || 'Present'}</span>}
            </div>
            <p className="text-sm leading-relaxed text-slate-600">{proj.description}</p>
            {proj.url && <a href={`https://${proj.url}`} className="text-xs hover:underline mt-1 block" style={{ color: 'var(--theme-primary)' }}>{proj.url}</a>}
          </div>
        ))}
      </div>
    </section>
  );
};

export const RenderLanguages = ({ languages, isAside = false }: { languages?: Language[]; isAside?: boolean }) => {
  if (!languages || languages.length === 0) return null;
  const titleClass = isAside ? "text-xs font-bold uppercase tracking-widest mb-4" : "text-lg font-bold uppercase tracking-wider border-b mb-3 pb-1 resume-section-title";
  const titleStyle = isAside ? { color: 'var(--theme-aside-text)', opacity: 0.7 } : { borderColor: 'var(--theme-primary)' };
  
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className={titleClass} style={titleStyle}>Languages</h2>
      <div className="flex flex-wrap gap-2">
        {languages.map((lang) => (
          <span 
            key={lang.id} 
            className="text-xs font-medium px-2.5 py-1 rounded-md border"
            style={{
              backgroundColor: isAside ? 'rgba(255, 255, 255, 0.1)' : 'var(--theme-divider)',
              borderColor: isAside ? 'rgba(255, 255, 255, 0.2)' : 'var(--theme-divider)',
              color: isAside ? 'var(--theme-aside-text)' : 'var(--theme-body)'
            }}
          >
            {lang.name} ({lang.proficiency})
          </span>
        ))}
      </div>
    </section>
  );
};

export const RenderAwards = ({ awards }: { awards?: Award[] }) => {
  if (!awards || awards.length === 0) return null;
  return (
    <section className="mb-6 break-inside-avoid">
      <h2 className="text-lg font-bold uppercase tracking-wider border-b mb-3 pb-1 resume-section-title" style={{ borderColor: 'var(--theme-primary)' }}>Awards & Honors</h2>
      <div className="space-y-3">
        {awards.map((award) => (
          <div key={award.id} className="break-inside-avoid">
            <div className="flex justify-between items-baseline mb-0.5">
              <h3 className="font-bold text-sm">{award.title}</h3>
              <span className="text-xs font-semibold text-slate-500">{award.date}</span>
            </div>
            <div className="text-xs text-slate-500 font-medium">{award.issuer}</div>
            {award.description && <p className="text-sm leading-relaxed text-slate-600 mt-1">{award.description}</p>}
          </div>
        ))}
      </div>
    </section>
  );
};

export const RenderCustomSections = ({ customSections }: { customSections?: CustomSection[] }) => {
  if (!customSections || customSections.length === 0) return null;
  return (
    <>
      {customSections.map((section) => (
        <section key={section.id} className="mb-6 break-inside-avoid">
          <h2 className="text-lg font-bold uppercase tracking-wider border-b mb-3 pb-1 resume-section-title" style={{ borderColor: 'var(--theme-primary)' }}>{section.title}</h2>
          <div className="space-y-4">
            {section.items.map((item) => (
              <div key={item.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className="font-bold text-sm">{item.title}</h3>
                  {item.date && <span className="text-xs font-semibold text-slate-500">{item.date}</span>}
                </div>
                {item.subtitle && <div className="text-xs text-slate-500 font-medium mb-1">{item.subtitle}</div>}
                {item.description && <p className="text-sm leading-relaxed text-slate-600">{item.description}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </>
  );
};

export const BulletPoint = () => (
  <span className="mr-2 mt-[0.3em] shrink-0" style={{ color: 'var(--theme-primary)', opacity: 0.8 }}>•</span>
);
