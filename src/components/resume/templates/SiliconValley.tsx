import React from 'react';
import { Resume } from '@/types';
import { RenderLanguages, RenderCertifications, RenderAwards, RenderCustomSections } from './shared';

export const SiliconValley = ({ resume }: { resume: Resume }) => (
  <div className="p-10 resume-main text-slate-800 bg-white font-mono text-xs">
    {/* Tech Banner Header */}
    <header className="border-b-2 border-slate-900 pb-5 mb-6">
      <div className="flex justify-between items-baseline">
        <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
          {resume.personalInfo.firstName} {resume.personalInfo.lastName}
        </h1>
        {resume.targetRole && (
          <div className="font-bold tracking-tight text-slate-700 uppercase">
            {`// ${resume.targetRole}`}
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-slate-500 font-medium font-sans">
        {resume.personalInfo.email && <span>email: {resume.personalInfo.email}</span>}
        {resume.personalInfo.phone && <span>phone: {resume.personalInfo.phone}</span>}
        {resume.personalInfo.location && <span>loc: {resume.personalInfo.location}</span>}
        {resume.personalInfo.linkedin && <span>linkedin: {resume.personalInfo.linkedin.replace('https://', '')}</span>}
        {resume.personalInfo.github && <span>github: {resume.personalInfo.github.replace('https://', '')}</span>}
        {resume.personalInfo.website && <span>web: {resume.personalInfo.website.replace('https://', '')}</span>}
      </div>
    </header>

    {/* Summary */}
    {resume.summary && (
      <section className="mb-5 break-inside-avoid">
        <h2 className="font-bold uppercase tracking-widest text-slate-900 border-b border-dashed border-slate-300 pb-1 mb-2">01. Profile Summary</h2>
        <p className="leading-relaxed font-sans text-slate-600">{resume.summary}</p>
      </section>
    )}

    {/* Skills */}
    {resume.skills && resume.skills.length > 0 && (
      <section className="mb-5 break-inside-avoid">
        <h2 className="font-bold uppercase tracking-widest text-slate-900 border-b border-dashed border-slate-300 pb-1 mb-2">02. Tech Competencies</h2>
        <div className="flex flex-wrap gap-1.5 font-sans">
          {resume.skills.map((s) => (
            <span key={s.id} className="bg-slate-100 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200">
              {s.name}
            </span>
          ))}
        </div>
      </section>
    )}

    {/* Experience */}
    {resume.experience && resume.experience.length > 0 && (
      <section className="mb-5">
        <h2 className="font-bold uppercase tracking-widest text-slate-900 border-b border-dashed border-slate-300 pb-1 mb-3">03. Career History</h2>
        <div className="space-y-4">
          {resume.experience.map((exp) => (
            <div key={exp.id} className="break-inside-avoid">
              <div className="flex justify-between items-baseline mb-0.5 font-bold">
                <h3 className="text-slate-900">{exp.role}</h3>
                <span className="font-medium text-slate-500">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              <div className="flex justify-between items-baseline mb-1.5 text-slate-500">
                <span className="italic">{exp.company}</span>
                <span>{exp.location}</span>
              </div>
              <ul className="list-none space-y-1 pl-1 font-sans text-slate-600">
                {exp.description.split('\n').filter(Boolean).map((line, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-slate-400 mt-1">&gt;</span>
                    <span className="leading-relaxed">{line.replace(/^•\s*/, '')}</span>
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
      <section className="mb-5">
        <h2 className="font-bold uppercase tracking-widest text-slate-900 border-b border-dashed border-slate-300 pb-1 mb-3">04. Open Source / Projects</h2>
        <div className="space-y-3">
          {resume.projects.map((proj) => (
            <div key={proj.id} className="break-inside-avoid">
              <div className="flex justify-between items-baseline mb-0.5">
                <h3 className="font-bold text-slate-900">{proj.name}</h3>
                {proj.url && <a href={`https://${proj.url}`} className="text-[10px] underline font-bold" style={{ color: 'var(--theme-primary)' }}>{proj.url}</a>}
              </div>
              <p className="font-sans text-slate-600 leading-relaxed">{proj.description}</p>
            </div>
          ))}
        </div>
      </section>
    )}

    {/* Education */}
    {resume.education && resume.education.length > 0 && (
      <section className="mb-5 break-inside-avoid">
        <h2 className="font-bold uppercase tracking-widest text-slate-900 border-b border-dashed border-slate-300 pb-1 mb-2">05. Education</h2>
        <div className="space-y-2">
          {resume.education.map((edu) => (
            <div key={edu.id} className="flex justify-between items-start">
              <div>
                <span className="font-bold text-slate-900">{edu.institution}</span>
                <span className="text-slate-500 font-sans"> – {edu.degree} in {edu.fieldOfStudy}</span>
              </div>
              <span className="font-medium text-slate-400">{edu.startDate} – {edu.endDate}</span>
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
