import React, { forwardRef } from 'react';
import { Resume } from '@/types';

export type LayoutType = 'classic-ats' | 'modern-professional' | 'product-designer';

interface ResumePreviewProps {
  resume: Resume;
  layout?: LayoutType;
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ resume, layout = 'classic-ats' }, ref) => {
    return (
      <div 
        ref={ref} 
        className="bg-white mx-auto relative"
        style={{ 
          width: '800px', // Fixed width for consistent PDF output
          minHeight: '1131px', // A4 aspect ratio (approx)
          boxSizing: 'border-box'
        }}
      >
        {layout === 'classic-ats' && <ClassicATS resume={resume} />}
        {layout === 'modern-professional' && <ModernProfessional resume={resume} />}
        {layout === 'product-designer' && <ProductDesigner resume={resume} />}
      </div>
    );
  }
);
ResumePreview.displayName = 'ResumePreview';

// --- Layout Components ---

const ClassicATS = ({ resume }: { resume: Resume }) => (
  <div className="p-10 text-black font-serif">
    {/* Header */}
    <header className="text-center mb-6 border-b-2 border-black pb-4">
      <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">
        {resume.personalInfo.firstName} {resume.personalInfo.lastName}
      </h1>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-gray-800">
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
        <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-400 mb-2 pb-1">Professional Summary</h2>
        <p className="text-[14px] leading-relaxed text-justify">{resume.summary}</p>
      </section>
    )}

    {/* Experience */}
    {resume.experience && resume.experience.length > 0 && (
      <section className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-400 mb-3 pb-1">Professional Experience</h2>
        <div className="space-y-4">
          {resume.experience.map((exp) => (
            <div key={exp.id} className="break-inside-avoid">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="font-bold text-[15px]">{exp.role}</h3>
                <span className="text-sm font-semibold">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-[14px] italic font-semibold">{exp.company}</span>
                <span className="text-[14px]">{exp.location}</span>
              </div>
              <ul className="list-disc pl-5 text-[14px] leading-relaxed space-y-1">
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
        <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-400 mb-3 pb-1">Education</h2>
        <div className="space-y-3">
          {resume.education.map((edu) => (
            <div key={edu.id} className="break-inside-avoid">
              <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-[15px]">{edu.institution}</h3>
                <span className="text-sm font-semibold">{edu.startDate} – {edu.current ? 'Present' : edu.endDate}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[14px]">{edu.degree} in {edu.fieldOfStudy}</span>
                {edu.score && <span className="text-[14px]">{edu.score}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    )}

    {/* Skills */}
    {resume.skills && resume.skills.length > 0 && (
      <section className="mb-6 break-inside-avoid">
        <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-400 mb-2 pb-1">Technical Skills</h2>
        <div className="text-[14px]">
          <span className="font-bold">Core Competencies: </span>
          {resume.skills.map((s) => s.name).join(', ')}
        </div>
      </section>
    )}

    {/* Projects */}
    {resume.projects && resume.projects.length > 0 && (
      <section className="mb-6">
        <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-400 mb-3 pb-1">Projects</h2>
        <div className="space-y-3">
          {resume.projects.map((proj) => (
            <div key={proj.id} className="break-inside-avoid">
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="font-bold text-[15px]">{proj.name}</h3>
                {proj.url && <span className="text-[14px] italic text-gray-700">| {proj.url}</span>}
              </div>
              <p className="text-[14px] leading-relaxed">{proj.description}</p>
            </div>
          ))}
        </div>
      </section>
    )}

    {/* Certifications */}
    {resume.certifications && resume.certifications.length > 0 && (
      <section className="mb-6 break-inside-avoid">
        <h2 className="text-lg font-bold uppercase tracking-wider border-b border-gray-400 mb-3 pb-1">Certifications</h2>
        <div className="space-y-2">
          {resume.certifications.map((cert) => (
            <div key={cert.id} className="flex justify-between items-baseline">
              <div>
                <span className="font-bold text-[14px]">{cert.name}</span>
                <span className="text-[14px] text-gray-800"> – {cert.issuer}</span>
              </div>
              <span className="text-[14px] font-semibold">{cert.date}</span>
            </div>
          ))}
        </div>
      </section>
    )}
  </div>
);

const ModernProfessional = ({ resume }: { resume: Resume }) => (
  <div className="p-10 text-gray-900 font-sans">
    {/* Header */}
    <header className="mb-8 flex flex-col items-start border-l-4 border-primary pl-4">
      <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-1">
        {resume.personalInfo.firstName} <span className="text-primary">{resume.personalInfo.lastName}</span>
      </h1>
      <div className="text-primary font-medium text-lg mb-3 tracking-wide">{resume.targetRole}</div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-gray-600 font-medium">
        {resume.personalInfo.email && <span className="flex items-center gap-1">✉ {resume.personalInfo.email}</span>}
        {resume.personalInfo.phone && <span className="flex items-center gap-1">☎ {resume.personalInfo.phone}</span>}
        {resume.personalInfo.location && <span className="flex items-center gap-1">📍 {resume.personalInfo.location}</span>}
        {resume.personalInfo.linkedin && <span>in/ {resume.personalInfo.linkedin.split('/').pop()}</span>}
        {resume.personalInfo.github && <span>git/ {resume.personalInfo.github.split('/').pop()}</span>}
      </div>
    </header>

    {/* Summary */}
    {resume.summary && (
      <section className="mb-7 break-inside-avoid">
        <p className="text-[14px] leading-relaxed text-gray-700">{resume.summary}</p>
      </section>
    )}

    {/* Experience */}
    {resume.experience && resume.experience.length > 0 && (
      <section className="mb-7">
        <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 mb-4 pb-2 uppercase tracking-wider text-sm flex items-center">
          <span className="text-primary mr-2">■</span> Experience
        </h2>
        <div className="space-y-5">
          {resume.experience.map((exp) => (
            <div key={exp.id} className="break-inside-avoid">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <h3 className="font-bold text-[16px] text-gray-900">{exp.role}</h3>
                  <div className="text-[14px] text-primary font-semibold">{exp.company} <span className="text-gray-500 font-normal ml-1">• {exp.location}</span></div>
                </div>
                <div className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded">
                  {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                </div>
              </div>
              <ul className="mt-2 list-none space-y-1.5 text-[14px] text-gray-700">
                {exp.description.split('\n').filter(Boolean).map((line, i) => (
                  <li key={i} className="flex items-start">
                    <span className="text-primary/70 mr-2 mt-0.5">•</span>
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
      <section className="mb-7">
        <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 mb-4 pb-2 uppercase tracking-wider text-sm flex items-center">
          <span className="text-primary mr-2">■</span> Education
        </h2>
        <div className="space-y-4">
          {resume.education.map((edu) => (
            <div key={edu.id} className="break-inside-avoid">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-[15px]">{edu.institution}</h3>
                  <div className="text-[14px] text-gray-600">{edu.degree} in {edu.fieldOfStudy}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-gray-500">{edu.startDate} – {edu.current ? 'Present' : edu.endDate}</div>
                  {edu.score && <div className="text-xs text-primary font-semibold mt-0.5">{edu.score}</div>}
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
          <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 mb-4 pb-2 uppercase tracking-wider text-sm flex items-center">
            <span className="text-primary mr-2">■</span> Skills
          </h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((s) => (
              <span key={s.id} className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded">
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {resume.projects && resume.projects.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-200 mb-4 pb-2 uppercase tracking-wider text-sm flex items-center">
            <span className="text-primary mr-2">■</span> Projects
          </h2>
          <div className="space-y-3">
            {resume.projects.map((proj) => (
              <div key={proj.id} className="break-inside-avoid">
                <h3 className="font-bold text-[14px]">{proj.name}</h3>
                <p className="text-[13px] text-gray-600 leading-snug mt-0.5">{proj.description}</p>
                {proj.url && <div className="text-[12px] text-primary mt-1">{proj.url}</div>}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  </div>
);

const ProductDesigner = ({ resume }: { resume: Resume }) => (
  <div className="flex h-full min-h-[1131px] font-sans bg-white text-slate-800">
    {/* Left Sidebar */}
    <aside className="w-[30%] bg-slate-900 text-slate-100 p-8 flex flex-col break-inside-avoid">
      <div className="mb-10">
        <h1 className="text-3xl font-bold leading-tight mb-2 tracking-tight text-white">
          {resume.personalInfo.firstName} <br /> {resume.personalInfo.lastName}
        </h1>
        <div className="text-primary/80 font-medium tracking-wide text-sm">{resume.targetRole}</div>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Contact</h2>
          <ul className="space-y-3 text-[13px] text-slate-300">
            {resume.personalInfo.phone && <li>{resume.personalInfo.phone}</li>}
            {resume.personalInfo.email && <li className="break-all">{resume.personalInfo.email}</li>}
            {resume.personalInfo.location && <li>{resume.personalInfo.location}</li>}
            {resume.personalInfo.linkedin && <li className="break-all">{resume.personalInfo.linkedin.replace('https://', '')}</li>}
            {resume.personalInfo.website && <li className="break-all text-primary/60">{resume.personalInfo.website.replace('https://', '')}</li>}
          </ul>
        </section>

        {resume.skills && resume.skills.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Skills</h2>
            <div className="flex flex-wrap gap-1.5">
              {resume.skills.map(s => (
                <span key={s.id} className="bg-slate-800 border border-slate-700 text-slate-200 text-xs px-2 py-1 rounded-sm">
                  {s.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {resume.education && resume.education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Education</h2>
            <div className="space-y-4">
              {resume.education.map(edu => (
                <div key={edu.id}>
                  <div className="font-bold text-[13px] text-white leading-snug">{edu.degree}</div>
                  <div className="text-primary/60 text-[12px] my-0.5">{edu.fieldOfStudy}</div>
                  <div className="text-[12px] text-slate-400">{edu.institution}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{edu.startDate} - {edu.endDate}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </aside>

    {/* Right Main Content */}
    <main className="w-[70%] p-10 pr-12">
      {resume.summary && (
        <section className="mb-10 break-inside-avoid">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
            <span className="w-8 h-1 bg-primary mr-4 rounded-full"></span> Profile
          </h2>
          <p className="text-[14px] leading-relaxed text-slate-600">{resume.summary}</p>
        </section>
      )}

      {resume.experience && resume.experience.length > 0 && (
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
            <span className="w-8 h-1 bg-primary mr-4 rounded-full"></span> Experience
          </h2>
          <div className="space-y-6">
            {resume.experience.map(exp => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-[16px] text-slate-900">{exp.role}</h3>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>
                <div className="text-[14px] font-medium text-slate-700 mb-2">{exp.company} <span className="text-slate-400 font-normal ml-1">• {exp.location}</span></div>
                <ul className="list-disc pl-4 text-[14px] leading-relaxed text-slate-600 space-y-1.5 marker:text-primary/80">
                  {exp.description.split('\n').filter(Boolean).map((line, i) => (
                    <li key={i}>{line.replace(/^•\s*/, '')}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {resume.projects && resume.projects.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-5 flex items-center">
            <span className="w-8 h-1 bg-primary mr-4 rounded-full"></span> Selected Work
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {resume.projects.map(proj => (
              <div key={proj.id} className="break-inside-avoid border border-slate-200 p-4 rounded-xl shadow-sm bg-slate-50/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-[15px] text-slate-900">{proj.name}</h3>
                  {proj.url && <a href={`https://${proj.url}`} className="text-[12px] text-primary hover:underline">{proj.url}</a>}
                </div>
                <p className="text-[13px] leading-relaxed text-slate-600">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  </div>
);
