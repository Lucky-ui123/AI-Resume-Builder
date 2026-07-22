import React from 'react';
import { Resume } from '@/types';
import { DateBadge, BulletPoint, SkillBadge, RenderCertifications, RenderAwards, RenderLanguages, RenderCustomSections } from './shared';

export const ModernProfessional = ({ resume }: { resume: Resume }) => (
  <div className="p-10 resume-main text-slate-800 h-full">
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
    <RenderCertifications certifications={resume.certifications} />
    <RenderAwards awards={resume.awards} />
    <RenderLanguages languages={resume.languages} />
    <RenderCustomSections customSections={resume.customSections} />
  </div>
);
