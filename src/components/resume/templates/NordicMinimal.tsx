import React from 'react';
import { Resume } from '@/types';
import { RenderLanguages, RenderCertifications, RenderAwards, RenderCustomSections } from './shared';

export const NordicMinimal = ({ resume }: { resume: Resume }) => (
  <div className="p-12 resume-main text-slate-800 bg-white font-sans">
    {/* Minimal Header */}
    <header className="mb-10 flex justify-between items-baseline border-b border-slate-100 pb-8">
      <div>
        <h1 className="text-4xl font-light tracking-tight text-slate-900 mb-1">
          {resume.personalInfo.firstName} <span className="font-semibold" style={{ color: 'var(--theme-primary)' }}>{resume.personalInfo.lastName}</span>
        </h1>
        {resume.targetRole && (
          <div className="text-sm font-semibold tracking-wider uppercase text-slate-400 mt-1">
            {resume.targetRole}
          </div>
        )}
      </div>
      <div className="text-right text-xs space-y-1 text-slate-500 font-medium">
        {resume.personalInfo.email && <div>{resume.personalInfo.email}</div>}
        {resume.personalInfo.phone && <div>{resume.personalInfo.phone}</div>}
        {resume.personalInfo.location && <div>{resume.personalInfo.location}</div>}
      </div>
    </header>

    {/* Summary */}
    {resume.summary && (
      <section className="mb-8 break-inside-avoid">
        <p className="text-sm leading-relaxed text-slate-600 font-light text-justify">{resume.summary}</p>
      </section>
    )}

    {/* Two Column Layout for Main Section */}
    <div className="grid grid-cols-3 gap-10">
      {/* Left 2 Columns: Experience & Projects */}
      <div className="col-span-2 space-y-8">
        {/* Experience */}
        {resume.experience && resume.experience.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Work Experience</h2>
            <div className="space-y-6">
              {resume.experience.map((exp) => (
                <div key={exp.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-sm text-slate-900">{exp.role}</h3>
                    <span className="text-xs text-slate-400 font-medium">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                  </div>
                  <div className="text-xs font-medium text-slate-500 mb-2">{exp.company} <span className="text-slate-300">•</span> {exp.location}</div>
                  <ul className="list-none text-xs leading-relaxed text-slate-600 space-y-1.5 pl-0.5">
                    {exp.description.split('\n').filter(Boolean).map((line, i) => (
                      <li key={i} className="flex items-start">
                        <span className="mr-2.5 mt-2 shrink-0 w-1 h-1 rounded-full bg-slate-300"></span>
                        <span>{line.replace(/^•\s*/, '')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {resume.projects && resume.projects.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Featured Projects</h2>
            <div className="space-y-4">
              {resume.projects.map((proj) => (
                <div key={proj.id} className="break-inside-avoid">
                  <div className="flex justify-between items-baseline">
                    <h3 className="font-semibold text-sm text-slate-900">{proj.name}</h3>
                    {proj.url && <a href={`https://${proj.url}`} className="text-[10px] hover:underline font-semibold" style={{ color: 'var(--theme-primary)' }}>{proj.url}</a>}
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 mt-1">{proj.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Right Column: Education & Skills */}
      <div className="space-y-8">
        {/* Skills */}
        {resume.skills && resume.skills.length > 0 && (
          <section className="break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Competencies</h2>
            <div className="flex flex-wrap gap-1.5">
              {resume.skills.map((s) => (
                <span key={s.id} className="text-xs font-medium px-2 py-0.5 rounded border border-slate-100 bg-slate-50 text-slate-600">
                  {s.name}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <section className="break-inside-avoid">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Education</h2>
            <div className="space-y-4">
              {resume.education.map((edu) => (
                <div key={edu.id}>
                  <h3 className="font-semibold text-xs text-slate-900 leading-snug">{edu.degree}</h3>
                  <div className="text-[11px] text-slate-500 my-0.5">{edu.fieldOfStudy}</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wide">{edu.institution}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{edu.startDate} - {edu.endDate}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <RenderLanguages languages={resume.languages} isAside={false} />
      </div>
    </div>

    <RenderCertifications certifications={resume.certifications} />
    <RenderAwards awards={resume.awards} />
    <RenderCustomSections customSections={resume.customSections} />
  </div>
);
