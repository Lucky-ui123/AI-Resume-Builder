import React from 'react';
import { Resume } from '@/types';
import { DateBadge, BulletPoint, SkillBadge, RenderCertifications, RenderAwards, RenderLanguages, RenderCustomSections } from './shared';

export const TimelineModern = ({ resume }: { resume: Resume }) => (
  <div className="p-12 resume-main text-slate-800 bg-white font-sans">
    {/* Left-Aligned modern Header */}
    <header className="mb-12">
      <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-2">
        {resume.personalInfo.firstName} <span style={{ color: 'var(--theme-primary)' }}>{resume.personalInfo.lastName}</span>
      </h1>
      <div className="flex justify-between items-center mt-3 border-t border-slate-200 pt-4">
        {resume.targetRole && (
          <div className="text-sm font-bold tracking-wider uppercase text-slate-500">
            {resume.targetRole}
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 text-xs text-slate-500 font-medium justify-end">
          {resume.personalInfo.email && <span>{resume.personalInfo.email}</span>}
          {resume.personalInfo.phone && <span>• {resume.personalInfo.phone}</span>}
          {resume.personalInfo.location && <span>• {resume.personalInfo.location}</span>}
        </div>
      </div>
    </header>

    {/* Summary */}
    {resume.summary && (
      <section className="mb-10 break-inside-avoid">
        <p className="text-sm leading-relaxed text-slate-600 font-medium text-justify">{resume.summary}</p>
      </section>
    )}

    {/* Timeline Connected Experience */}
    {resume.experience && resume.experience.length > 0 && (
      <section className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-8">Career Progression</h2>
        <div className="relative border-l border-slate-200 ml-4 space-y-8 pb-4">
          {resume.experience.map((exp) => (
            <div key={exp.id} className="relative pl-8 break-inside-avoid">
              {/* Timeline bubble */}
              <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2" style={{ borderColor: 'var(--theme-primary)' }}></div>
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="font-bold text-base text-slate-900">{exp.role}</h3>
                <DateBadge startDate={exp.startDate} endDate={exp.endDate} current={exp.current} />
              </div>
              <div className="text-xs font-bold mb-3" style={{ color: 'var(--theme-primary)' }}>
                {exp.company} <span className="text-slate-400 font-medium">| {exp.location}</span>
              </div>
              <ul className="list-none space-y-1.5 text-xs text-slate-600 pl-0.5">
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

    {/* Grid of Other Sections */}
    <div className="grid grid-cols-2 gap-8 mb-6">
      {/* Education */}
      {resume.education && resume.education.length > 0 && (
        <section className="break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-5">Education</h2>
          <div className="space-y-4">
            {resume.education.map((edu) => (
              <div key={edu.id} className="break-inside-avoid">
                <h3 className="font-bold text-xs text-slate-900 leading-snug">{edu.degree}</h3>
                <div className="text-xs text-slate-500 my-0.5">{edu.fieldOfStudy}</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wide">{edu.institution}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{edu.startDate} - {edu.endDate}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {resume.skills && resume.skills.length > 0 && (
        <section className="break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-5">Areas of Focus</h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((s) => (
              <SkillBadge key={s.id} name={s.name} />
            ))}
          </div>
        </section>
      )}
    </div>

    {/* Projects */}
    {resume.projects && resume.projects.length > 0 && (
      <section className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Selected Projects</h2>
        <div className="grid grid-cols-2 gap-5">
          {resume.projects.map((proj) => (
            <div key={proj.id} className="break-inside-avoid border border-slate-100 p-4 rounded-lg bg-slate-50/50">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-xs text-slate-900">{proj.name}</h3>
                {proj.url && <a href={`https://${proj.url}`} className="text-[9px] hover:underline font-bold" style={{ color: 'var(--theme-primary)' }}>{proj.url}</a>}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{proj.description}</p>
            </div>
          ))}
        </div>
      </section>
    )}

    <RenderCertifications certifications={resume.certifications} />
    <RenderAwards awards={resume.awards} />
    <RenderLanguages languages={resume.languages} />
    <RenderCustomSections customSections={resume.customSections} />
  </div>
);
