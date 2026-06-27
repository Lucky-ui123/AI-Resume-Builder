import React, { forwardRef } from 'react';
import { Resume } from '@/types';

export type LayoutType = 'classic-ats' | 'modern-professional' | 'product-designer';

interface ResumePreviewProps {
  resume: Resume;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ resume }, ref) => {
    // Dynamic styling based on theme
    const themeStyle = {
      '--theme-primary': resume.theme?.primaryColor || '#0f172a',
      '--theme-font': resume.theme?.fontFamily || 'Inter, sans-serif',
      width: '800px', // Fixed width for consistent PDF output
      minHeight: '1131px', // A4 aspect ratio (approx)
      boxSizing: 'border-box' as const,
      fontFamily: 'var(--theme-font)',
    } as React.CSSProperties;

    return (
      <div 
        ref={ref} 
        className="bg-white text-slate-900 mx-auto relative break-words"
        style={themeStyle}
      >
        {(!resume.templateId || resume.templateId === 'classic-ats') && <ClassicATS resume={resume} />}
        {resume.templateId === 'modern-professional' && <ModernProfessional resume={resume} />}
        {resume.templateId === 'product-designer' && <ProductDesigner resume={resume} />}
        {resume.templateId === 'executive' && <ExecutiveProfessional resume={resume} />}
        {resume.templateId === 'startup' && <StartupHustleModern resume={resume} />}
      </div>
    );
  }
);
ResumePreview.displayName = 'ResumePreview';

// --- Shared Components ---

const DateBadge = ({ startDate, endDate, current }: { startDate: string; endDate: string; current?: boolean }) => (
  <span className="relative inline-block px-2 py-1 text-xs font-semibold rounded-md overflow-hidden">
    <span className="absolute inset-0 opacity-10" style={{ backgroundColor: 'var(--theme-primary)' }}></span>
    <span className="relative z-10" style={{ color: 'var(--theme-primary)' }}>
      {startDate} – {current ? 'Present' : endDate}
    </span>
  </span>
);

const SkillBadge = ({ name }: { name: string }) => (
  <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-md border border-slate-200">
    {name}
  </span>
);

const DarkSkillBadge = ({ name }: { name: string }) => (
  <span className="bg-black/20 text-white/90 text-xs font-medium px-2.5 py-1 rounded-md border border-white/10">
    {name}
  </span>
);

const BulletPoint = () => (
  <span className="mr-2 mt-[0.3em] shrink-0" style={{ color: 'var(--theme-primary)', opacity: 0.8 }}>•</span>
);

// --- Layout Components ---

const ClassicATS = ({ resume }: { resume: Resume }) => (
  <div className="p-10 text-black font-serif">
    {/* Header */}
    <header className="text-center mb-8 border-b-2 pb-6" style={{ borderColor: 'var(--theme-primary)' }}>
      <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">
        {resume.personalInfo.firstName} {resume.personalInfo.lastName}
      </h1>
      {resume.targetRole && (
        <div className="text-lg font-medium uppercase tracking-widest text-gray-800 mb-4">
          {resume.targetRole}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-700">
        {resume.personalInfo.email && <span>{resume.personalInfo.email}</span>}
        {resume.personalInfo.phone && <span>• {resume.personalInfo.phone}</span>}
        {resume.personalInfo.location && <span>• {resume.personalInfo.location}</span>}
        {resume.personalInfo.linkedin && <span>• {resume.personalInfo.linkedin}</span>}
        {resume.personalInfo.github && <span>• {resume.personalInfo.github}</span>}
        {resume.personalInfo.website && <span>• {resume.personalInfo.website}</span>}
      </div>
    </header>

    {/* Summary */}
    {resume.summary && (
      <section className="mb-6 break-inside-avoid">
        <h2 className="text-lg font-bold uppercase tracking-wider border-b mb-3 pb-1" style={{ borderColor: 'var(--theme-primary)' }}>Professional Summary</h2>
        <p className="text-sm leading-relaxed text-justify">{resume.summary}</p>
      </section>
    )}

    {/* Experience */}
    {resume.experience && resume.experience.length > 0 && (
      <section className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wider border-b mb-4 pb-1" style={{ borderColor: 'var(--theme-primary)' }}>Professional Experience</h2>
        <div className="space-y-5">
          {resume.experience.map((exp) => (
            <div key={exp.id} className="break-inside-avoid">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="font-bold text-base">{exp.role}</h3>
                <span className="text-sm font-semibold">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-sm italic font-medium">{exp.company}</span>
                <span className="text-sm">{exp.location}</span>
              </div>
              <ul className="list-disc pl-5 text-sm leading-relaxed space-y-1">
                {exp.description.split('\n').filter(Boolean).map((line, i) => (
                  <li key={i}>{line.replace(/^•\s*/, '')}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    )}

    {/* Education */}
    {resume.education && resume.education.length > 0 && (
      <section className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wider border-b mb-4 pb-1" style={{ borderColor: 'var(--theme-primary)' }}>Education</h2>
        <div className="space-y-4">
          {resume.education.map((edu) => (
            <div key={edu.id} className="break-inside-avoid">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-base">{edu.institution}</h3>
                <span className="text-sm font-semibold">{edu.startDate} – {edu.current ? 'Present' : edu.endDate}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-sm">{edu.degree} in {edu.fieldOfStudy}</span>
                {edu.score && <span className="text-sm">{edu.score}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    )}

    {/* Skills */}
    {resume.skills && resume.skills.length > 0 && (
      <section className="mb-6 break-inside-avoid">
        <h2 className="text-lg font-bold uppercase tracking-wider border-b mb-3 pb-1" style={{ borderColor: 'var(--theme-primary)' }}>Technical Skills</h2>
        <div className="text-sm leading-relaxed">
          <span className="font-bold">Core Competencies: </span>
          {resume.skills.map((s) => s.name).join(', ')}
        </div>
      </section>
    )}

    {/* Projects */}
    {resume.projects && resume.projects.length > 0 && (
      <section className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wider border-b mb-4 pb-1" style={{ borderColor: 'var(--theme-primary)' }}>Projects</h2>
        <div className="space-y-4">
          {resume.projects.map((proj) => (
            <div key={proj.id} className="break-inside-avoid">
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="font-bold text-base">{proj.name}</h3>
                {proj.url && <span className="text-sm italic text-gray-700">| {proj.url}</span>}
              </div>
              <p className="text-sm leading-relaxed">{proj.description}</p>
            </div>
          ))}
        </div>
      </section>
    )}

    {/* Certifications */}
    {resume.certifications && resume.certifications.length > 0 && (
      <section className="mb-6 break-inside-avoid">
        <h2 className="text-lg font-bold uppercase tracking-wider border-b mb-4 pb-1" style={{ borderColor: 'var(--theme-primary)' }}>Certifications</h2>
        <div className="space-y-3">
          {resume.certifications.map((cert) => (
            <div key={cert.id} className="flex justify-between items-baseline">
              <div>
                <span className="font-bold text-sm">{cert.name}</span>
                <span className="text-sm text-gray-800"> – {cert.issuer}</span>
              </div>
              <span className="text-sm font-semibold">{cert.date}</span>
            </div>
          ))}
        </div>
      </section>
    )}
  </div>
);

const ModernProfessional = ({ resume }: { resume: Resume }) => (
  <div className="p-10 text-slate-800 h-full">
    {/* Header */}
    <header className="mb-8 flex flex-col items-start border-l-4 pl-5" style={{ borderColor: 'var(--theme-primary)' }}>
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
        {resume.personalInfo.firstName} <span style={{ color: 'var(--theme-primary)' }}>{resume.personalInfo.lastName}</span>
      </h1>
      <div className="font-medium text-lg mb-4 tracking-wide" style={{ color: 'var(--theme-primary)' }}>{resume.targetRole}</div>
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600 font-medium">
        {resume.personalInfo.email && <span className="flex items-center gap-1">✉ {resume.personalInfo.email}</span>}
        {resume.personalInfo.phone && <span className="flex items-center gap-1">☎ {resume.personalInfo.phone}</span>}
        {resume.personalInfo.location && <span className="flex items-center gap-1">📍 {resume.personalInfo.location}</span>}
        {resume.personalInfo.linkedin && <span>in/ {resume.personalInfo.linkedin.split('/').pop()}</span>}
        {resume.personalInfo.github && <span>git/ {resume.personalInfo.github.split('/').pop()}</span>}
      </div>
    </header>

    {/* Summary */}
    {resume.summary && (
      <section className="mb-8 break-inside-avoid">
        <p className="text-sm leading-relaxed text-slate-700">{resume.summary}</p>
      </section>
    )}

    {/* Experience */}
    {resume.experience && resume.experience.length > 0 && (
      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-200 mb-5 pb-2 uppercase tracking-wider flex items-center">
          <span style={{ color: 'var(--theme-primary)' }} className="mr-2">■</span> Experience
        </h2>
        <div className="space-y-6">
          {resume.experience.map((exp) => (
            <div key={exp.id} className="break-inside-avoid">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{exp.role}</h3>
                  <div className="text-sm font-semibold" style={{ color: 'var(--theme-primary)' }}>{exp.company} <span className="text-slate-500 font-normal ml-1">• {exp.location}</span></div>
                </div>
                <DateBadge startDate={exp.startDate} endDate={exp.endDate} current={exp.current} />
              </div>
              <ul className="mt-3 list-none space-y-1.5 text-sm text-slate-700">
                {exp.description.split('\n').filter(Boolean).map((line, i) => (
                  <li key={i} className="flex items-start">
                    <BulletPoint />
                    <span>{line.replace(/^•\s*/, '')}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    )}

    {/* Education */}
    {resume.education && resume.education.length > 0 && (
      <section className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-200 mb-5 pb-2 uppercase tracking-wider flex items-center">
          <span style={{ color: 'var(--theme-primary)' }} className="mr-2">■</span> Education
        </h2>
        <div className="space-y-5">
          {resume.education.map((edu) => (
            <div key={edu.id} className="break-inside-avoid">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base text-slate-900">{edu.institution}</h3>
                  <div className="text-sm text-slate-600">{edu.degree} in {edu.fieldOfStudy}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-500">{edu.startDate} – {edu.current ? 'Present' : edu.endDate}</div>
                  {edu.score && <div className="text-xs font-semibold mt-1" style={{ color: 'var(--theme-primary)' }}>{edu.score}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )}

    {/* Skills & Projects Grid */}
    <div className="grid grid-cols-2 gap-8">
      {resume.skills && resume.skills.length > 0 && (
        <section className="mb-6 break-inside-avoid">
          <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-200 mb-5 pb-2 uppercase tracking-wider flex items-center">
            <span style={{ color: 'var(--theme-primary)' }} className="mr-2">■</span> Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((s) => (
              <SkillBadge key={s.id} name={s.name} />
            ))}
          </div>
        </section>
      )}

      {resume.projects && resume.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-slate-900 border-b-2 border-slate-200 mb-5 pb-2 uppercase tracking-wider flex items-center">
            <span style={{ color: 'var(--theme-primary)' }} className="mr-2">■</span> Projects
          </h2>
          <div className="space-y-5">
            {resume.projects.map((proj) => (
              <div key={proj.id} className="break-inside-avoid">
                <h3 className="font-bold text-sm text-slate-900">{proj.name}</h3>
                <p className="text-sm text-slate-600 leading-snug mt-1">{proj.description}</p>
                {proj.url && <div className="text-xs font-medium mt-1.5" style={{ color: 'var(--theme-primary)' }}>{proj.url}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  </div>
);

const ProductDesigner = ({ resume }: { resume: Resume }) => (
  <div className="flex h-full min-h-[1131px] text-slate-800">
    {/* Left Sidebar */}
    <aside className="w-[32%] bg-slate-900 text-white p-8 flex flex-col break-inside-avoid" style={{ backgroundColor: 'var(--theme-primary)' }}>
      <div className="mb-10">
        <h1 className="text-3xl font-bold leading-tight mb-3 tracking-tight">
          {resume.personalInfo.firstName} <br /> {resume.personalInfo.lastName}
        </h1>
        <div className="font-medium tracking-wide text-sm text-white/90">{resume.targetRole}</div>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Contact</h2>
          <ul className="space-y-3 text-sm text-white/90">
            {resume.personalInfo.phone && <li>{resume.personalInfo.phone}</li>}
            {resume.personalInfo.email && <li className="truncate">{resume.personalInfo.email}</li>}
            {resume.personalInfo.location && <li>{resume.personalInfo.location}</li>}
            {resume.personalInfo.linkedin && <li className="truncate">{resume.personalInfo.linkedin.replace('https://', '')}</li>}
            {resume.personalInfo.website && <li className="truncate text-white/70">{resume.personalInfo.website.replace('https://', '')}</li>}
          </ul>
        </section>

        {resume.skills && resume.skills.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map(s => (
                <DarkSkillBadge key={s.id} name={s.name} />
              ))}
            </div>
          </section>
        )}

        {resume.education && resume.education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Education</h2>
            <div className="space-y-5">
              {resume.education.map(edu => (
                <div key={edu.id}>
                  <div className="font-bold text-sm leading-snug">{edu.degree}</div>
                  <div className="text-sm text-white/70 my-1">{edu.fieldOfStudy}</div>
                  <div className="text-xs text-white/60">{edu.institution}</div>
                  <div className="text-xs text-white/50 mt-1">{edu.startDate} - {edu.endDate}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>

    {/* Right Main Content */}
    <main className="w-[68%] p-10 pr-12">
      {resume.summary && (
        <section className="mb-10 break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center uppercase tracking-wide">
            <span className="w-8 h-1 mr-4 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }}></span> Profile
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">{resume.summary}</p>
        </section>
      )}

      {resume.experience && resume.experience.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center uppercase tracking-wide">
            <span className="w-8 h-1 mr-4 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }}></span> Experience
          </h2>
          <div className="space-y-8">
            {resume.experience.map(exp => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-base text-slate-900">{exp.role}</h3>
                  <DateBadge startDate={exp.startDate} endDate={exp.endDate} current={exp.current} />
                </div>
                <div className="text-sm font-medium text-slate-700 mb-3">{exp.company} <span className="text-slate-400 font-normal ml-1">• {exp.location}</span></div>
                <ul className="list-none pl-1 text-sm leading-relaxed text-slate-600 space-y-1.5">
                  {exp.description.split('\n').filter(Boolean).map((line, i) => (
                    <li key={i} className="flex items-start">
                      <BulletPoint />
                      <span>{line.replace(/^•\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.projects && resume.projects.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center uppercase tracking-wide">
            <span className="w-8 h-1 mr-4 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }}></span> Selected Work
          </h2>
          <div className="grid grid-cols-1 gap-5">
            {resume.projects.map(proj => (
              <div key={proj.id} className="break-inside-avoid border border-slate-200 p-5 rounded-xl shadow-sm" style={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-base text-slate-900">{proj.name}</h3>
                  {proj.url && <a href={`https://${proj.url}`} className="text-xs hover:underline truncate ml-4" style={{ color: 'var(--theme-primary)' }}>{proj.url}</a>}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  </div>
);

// --- New Premium Templates ---

const ExecutiveProfessional = ({ resume }: { resume: Resume }) => (
  <div className="text-slate-900 bg-white min-h-[1056px] h-full flex flex-col">
    {/* Sophisticated Header */}
    <header className="px-10 pt-12 pb-8 border-b-2 border-slate-900 relative">
      <div className="absolute top-0 right-10 w-24 h-1.5" style={{ backgroundColor: 'var(--theme-primary)' }}></div>
      <h1 className="text-5xl font-light tracking-tight text-slate-900 mb-2 uppercase">
        <span className="font-bold">{resume.personalInfo.firstName}</span> {resume.personalInfo.lastName}
      </h1>
      {resume.targetRole && (
        <div className="text-lg font-medium tracking-[0.1em] uppercase text-slate-500 mt-3" style={{ color: 'var(--theme-primary)' }}>
          {resume.targetRole}
        </div>
      )}
    </header>

    <div className="flex flex-1">
      {/* Left Column - 1/3 */}
      <div className="w-1/3 bg-slate-50 p-10 border-r border-slate-200 flex flex-col gap-10">
        
        {/* Contact Info */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 mb-5 pb-2 border-b border-slate-300">Contact</h2>
          <div className="space-y-4 text-sm font-medium text-slate-600">
            {resume.personalInfo.email && (
              <div className="break-all">{resume.personalInfo.email}</div>
            )}
            {resume.personalInfo.phone && (
              <div>{resume.personalInfo.phone}</div>
            )}
            {resume.personalInfo.location && (
              <div>{resume.personalInfo.location}</div>
            )}
            {resume.personalInfo.linkedin && (
              <div className="break-all">{resume.personalInfo.linkedin.replace('https://', '')}</div>
            )}
            {resume.personalInfo.website && (
              <div className="break-all">{resume.personalInfo.website.replace('https://', '')}</div>
            )}
          </div>
        </section>

        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 mb-5 pb-2 border-b border-slate-300">Core Expertise</h2>
            <ul className="space-y-3">
              {resume.skills.map(s => (
                <li key={s.id} className="text-sm font-semibold text-slate-700 flex items-center">
                  <span className="w-2 h-[1px] mr-3" style={{ backgroundColor: 'var(--theme-primary)' }}></span>
                  {s.name}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 mb-5 pb-2 border-b border-slate-300">Education</h2>
            <div className="space-y-6">
              {resume.education.map(edu => (
                <div key={edu.id} className="break-inside-avoid">
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">{edu.degree}</h3>
                  <div className="text-sm text-slate-600 mt-1 mb-2 font-medium">{edu.fieldOfStudy}</div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">{edu.institution}</div>
                  <div className="text-xs text-slate-400 mt-1">{edu.startDate} – {edu.current ? 'Present' : edu.endDate}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Right Column - 2/3 */}
      <div className="w-2/3 p-10 flex flex-col gap-10">
        
        {/* Executive Summary */}
        {resume.summary && (
          <section className="break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 mb-5 flex items-center">
              <span className="mr-4 w-6 h-[1px]" style={{ backgroundColor: 'var(--theme-primary)' }}></span>
              Executive Profile
            </h2>
            <p className="text-sm leading-relaxed text-slate-700 font-medium text-justify">{resume.summary}</p>
          </section>
        )}

        {/* Professional Experience - Timeline Style */}
        {resume.experience && resume.experience.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 mb-8 flex items-center">
              <span className="mr-4 w-6 h-[1px]" style={{ backgroundColor: 'var(--theme-primary)' }}></span>
              Professional Experience
            </h2>
            <div className="relative border-l border-slate-200 ml-3 space-y-10 pb-4">
              {resume.experience.map((exp) => (
                <div key={exp.id} className="relative pl-8 break-inside-avoid">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2" style={{ borderColor: 'var(--theme-primary)' }}></div>
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-lg text-slate-900">{exp.role}</h3>
                    <span className="text-xs font-bold tracking-wider text-slate-500 bg-slate-50 px-2 py-1 rounded">
                      {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">
                    {exp.company} <span className="text-slate-400 font-medium ml-1">| {exp.location}</span>
                  </div>
                  <ul className="list-none text-sm leading-relaxed text-slate-600 space-y-2">
                    {exp.description.split('\n').filter(Boolean).map((line, j) => (
                      <li key={j} className="flex items-start">
                        <span className="mr-3 mt-2 shrink-0 w-[3px] h-[3px] rounded-full bg-slate-400"></span>
                        <span>{line.replace(/^•\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Custom Sections / Projects (Optional for Exec, rendered if present) */}
        {resume.projects && resume.projects.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-900 mb-6 flex items-center">
              <span className="mr-4 w-6 h-[1px]" style={{ backgroundColor: 'var(--theme-primary)' }}></span>
              Key Initiatives
            </h2>
            <div className="space-y-6">
              {resume.projects.map((proj) => (
                <div key={proj.id} className="break-inside-avoid border border-slate-100 p-5 rounded-sm" style={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}>
                   <h3 className="font-bold text-sm text-slate-900 mb-2">{proj.name}</h3>
                   <p className="text-sm text-slate-600 leading-relaxed">{proj.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  </div>
);

const StartupHustleModern = ({ resume }: { resume: Resume }) => (
  <div className="bg-white min-h-[1056px] h-full flex">
    {/* Left Sidebar - Bold & Colorful */}
    <div className="w-[38%] text-white p-10 flex flex-col gap-10" style={{ backgroundColor: 'var(--theme-primary)' }}>
      {/* Profile Header (Name in Sidebar or Main? Let's put contact and skills here) */}
      <div className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest text-white opacity-70 mb-4">Contact</h2>
        <div className="space-y-4 text-sm font-medium">
          {resume.personalInfo.email && (
            <div className="flex items-start">
              <span className="w-5 flex-shrink-0 text-white opacity-50">@</span>
              <span className="break-all">{resume.personalInfo.email}</span>
            </div>
          )}
          {resume.personalInfo.phone && (
            <div className="flex items-start">
              <span className="w-5 flex-shrink-0 text-white opacity-50">#</span>
              <span>{resume.personalInfo.phone}</span>
            </div>
          )}
          {resume.personalInfo.location && (
            <div className="flex items-start">
              <span className="w-5 flex-shrink-0 text-white opacity-50">📍</span>
              <span>{resume.personalInfo.location}</span>
            </div>
          )}
          {resume.personalInfo.linkedin && (
            <div className="flex items-start">
              <span className="w-5 flex-shrink-0 text-white opacity-50">in</span>
              <span className="break-all">{resume.personalInfo.linkedin.replace('https://', '')}</span>
            </div>
          )}
          {resume.personalInfo.website && (
            <div className="flex items-start">
              <span className="w-5 flex-shrink-0 text-white opacity-50">🔗</span>
              <span className="break-all">{resume.personalInfo.website.replace('https://', '')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tech Stack / Skills */}
      {resume.skills && resume.skills.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white opacity-70 mb-5">Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map(s => (
              <span key={s.id} className="text-xs font-bold px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white opacity-70 mb-5">Projects</h2>
          <div className="space-y-6">
            {resume.projects.map((proj) => (
              <div key={proj.id} className="break-inside-avoid">
                <h3 className="font-bold text-base mb-1 text-white">{proj.name}</h3>
                {proj.url && (
                  <a href={`https://${proj.url}`} className="text-xs font-semibold text-white opacity-70 underline mb-2 block">
                    {proj.url}
                  </a>
                )}
                <p className="text-sm text-white opacity-80 leading-relaxed">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education (moved here to save space in main if needed, or leave in main. Let's put it here) */}
      {resume.education && resume.education.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest text-white opacity-70 mb-5">Education</h2>
          <div className="space-y-5">
            {resume.education.map(edu => (
              <div key={edu.id} className="break-inside-avoid">
                <h3 className="font-bold text-sm text-white">{edu.degree}</h3>
                <div className="text-sm text-white opacity-80 my-0.5">{edu.fieldOfStudy}</div>
                <div className="text-xs font-medium text-white opacity-60 mt-1">{edu.institution}</div>
                <div className="text-xs text-white opacity-50">{edu.startDate} – {edu.current ? 'Present' : edu.endDate}</div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>

    {/* Right Main Content */}
    <div className="w-[62%] bg-white p-10 flex flex-col gap-10">
      
      {/* Header */}
      <header className="mt-4">
        <h1 className="text-6xl font-black tracking-tighter text-slate-900 leading-none mb-3">
          {resume.personalInfo.firstName} <br />
          <span style={{ color: 'var(--theme-primary)' }}>{resume.personalInfo.lastName}</span>
        </h1>
        <div className="text-xl font-bold text-slate-500 tracking-tight border-l-4 pl-3 mt-4" style={{ borderColor: 'var(--theme-primary)' }}>
          {resume.targetRole}
        </div>
      </header>

      {/* Summary */}
      {resume.summary && (
        <section className="break-inside-avoid">
          <p className="text-sm font-medium leading-relaxed text-slate-700">{resume.summary}</p>
        </section>
      )}

      {/* Experience */}
      {resume.experience && resume.experience.length > 0 && (
        <section>
          <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight flex items-center">
            Experience
            <div className="ml-4 h-1 flex-1 bg-slate-100 rounded-full"></div>
          </h2>
          <div className="space-y-8">
            {resume.experience.map(exp => (
              <div key={exp.id} className="break-inside-avoid relative">
                {/* Modern Card look without border */}
                <div className="mb-2 flex flex-col">
                  <h3 className="font-black text-xl text-slate-900">{exp.role}</h3>
                  <div className="flex items-center mt-1 text-sm font-bold text-slate-600">
                    <span style={{ color: 'var(--theme-primary)' }}>{exp.company}</span>
                    <span className="mx-2 text-slate-300">•</span>
                    <span>{exp.location}</span>
                  </div>
                </div>
                <div className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md inline-block mb-4">
                  {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                </div>
                <ul className="list-none space-y-2 text-sm text-slate-600 font-medium">
                  {exp.description.split('\n').filter(Boolean).map((line, i) => (
                    <li key={i} className="flex items-start">
                      <span className="mr-3 mt-1.5 shrink-0 w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: 'var(--theme-primary)' }}></span>
                      <span className="leading-relaxed">{line.replace(/^•\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
      
      {/* Custom Sections (if any) */}
      {resume.customSections && resume.customSections.length > 0 && (
        <section>
          {resume.customSections.map(section => (
             <div key={section.id} className="mb-8 break-inside-avoid">
                <h2 className="text-2xl font-black text-slate-900 mb-6 tracking-tight flex items-center">
                  {section.title}
                  <div className="ml-4 h-1 flex-1 bg-slate-100 rounded-full"></div>
                </h2>
                <div className="space-y-6">
                  {section.items.map(item => (
                    <div key={item.id} className="break-inside-avoid">
                       <h3 className="font-black text-lg text-slate-900">{item.title}</h3>
                       {item.subtitle && <div className="text-sm font-bold text-slate-600 mt-1" style={{ color: 'var(--theme-primary)' }}>{item.subtitle}</div>}
                       {item.date && <div className="text-xs font-bold text-slate-400 mt-1">{item.date}</div>}
                       {item.description && <p className="text-sm text-slate-600 font-medium mt-2 leading-relaxed">{item.description}</p>}
                    </div>
                  ))}
                </div>
             </div>
          ))}
        </section>
      )}
    </div>
  </div>
);
