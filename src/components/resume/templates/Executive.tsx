import React from 'react';
import { Resume } from '@/types';
import { RenderLanguages, RenderCertifications, RenderAwards, RenderCustomSections } from './shared';

export const Executive = ({ resume }: { resume: Resume }) => (
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
        <RenderLanguages languages={resume.languages} isAside={true} />
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

        <RenderCertifications certifications={resume.certifications} />
        <RenderAwards awards={resume.awards} />
        <RenderCustomSections customSections={resume.customSections} />
      </div>
    </div>
  </div>
);
