import React from 'react';
import { Resume } from '@/types';
import { RenderLanguages, RenderCertifications, RenderAwards, RenderCustomSections } from './shared';

export const HarvardAcademic = ({ resume }: { resume: Resume }) => (
  <div className="p-12 resume-main text-slate-900 bg-white font-serif text-sm">
    {/* Centered Traditional Header */}
    <header className="text-center mb-8 border-b border-slate-300 pb-5">
      <h1 className="text-3xl font-normal tracking-wide mb-1 uppercase">
        {resume.personalInfo.firstName} {resume.personalInfo.lastName}
      </h1>
      {resume.targetRole && (
        <div className="text-xs font-bold tracking-[0.2em] uppercase text-slate-500 mb-4">
          {resume.targetRole}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs text-slate-600 font-sans font-medium">
        {resume.personalInfo.email && <span>{resume.personalInfo.email}</span>}
        {resume.personalInfo.phone && <span>| {resume.personalInfo.phone}</span>}
        {resume.personalInfo.location && <span>| {resume.personalInfo.location}</span>}
        {resume.personalInfo.linkedin && <span>| {resume.personalInfo.linkedin.replace('https://', '')}</span>}
        {resume.personalInfo.website && <span>| {resume.personalInfo.website.replace('https://', '')}</span>}
      </div>
    </header>

    {/* Summary */}
    {resume.summary && (
      <section className="mb-6 break-inside-avoid">
        <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-950 border-b border-slate-300 pb-1.5 mb-3">Academic Summary</h2>
        <p className="leading-relaxed text-justify text-slate-700">{resume.summary}</p>
      </section>
    )}

    {/* Experience */}
    {resume.experience && resume.experience.length > 0 && (
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-950 border-b border-slate-300 pb-1.5 mb-4">Professional Appointments</h2>
        <div className="space-y-5">
          {resume.experience.map((exp) => (
            <div key={exp.id} className="break-inside-avoid">
              <div className="flex justify-between items-baseline mb-1">
                <div>
                  <span className="font-bold text-slate-900">{exp.role}</span>
                  <span className="text-slate-600 italic">, {exp.company}</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 font-sans">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
              </div>
              {exp.location && <div className="text-xs text-slate-500 italic mb-2">{exp.location}</div>}
              <ul className="list-disc pl-5 space-y-1 text-slate-600 leading-relaxed">
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
        <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-950 border-b border-slate-300 pb-1.5 mb-4">Education</h2>
        <div className="space-y-4">
          {resume.education.map((edu) => (
            <div key={edu.id} className="break-inside-avoid">
              <div className="flex justify-between items-baseline mb-1">
                <div>
                  <span className="font-bold text-slate-900">{edu.institution}</span>
                </div>
                <span className="text-xs font-semibold text-slate-500 font-sans">{edu.startDate} – {edu.current ? 'Present' : edu.endDate}</span>
              </div>
              <div className="text-xs text-slate-600">
                {edu.degree} in {edu.fieldOfStudy}
                {edu.score && <span className="text-slate-400"> (GPA: {edu.score})</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    )}

    {/* Research / Projects */}
    {resume.projects && resume.projects.length > 0 && (
      <section className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-950 border-b border-slate-300 pb-1.5 mb-4">Research & Publications</h2>
        <div className="space-y-4">
          {resume.projects.map((proj) => (
            <div key={proj.id} className="break-inside-avoid">
              <div className="font-bold text-slate-900 mb-1">{proj.name}</div>
              <p className="text-slate-600 leading-relaxed">{proj.description}</p>
              {proj.url && <a href={`https://${proj.url}`} className="text-xs text-slate-400 hover:underline mt-1 block font-sans">{proj.url}</a>}
            </div>
          ))}
        </div>
      </section>
    )}

    {/* Skills */}
    {resume.skills && resume.skills.length > 0 && (
      <section className="mb-6 break-inside-avoid">
        <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-slate-950 border-b border-slate-300 pb-1.5 mb-3">Areas of Expertise</h2>
        <div className="text-slate-700 leading-relaxed text-justify">
          {resume.skills.map((s) => s.name).join(', ')}
        </div>
      </section>
    )}

    <RenderCertifications certifications={resume.certifications} />
    <RenderAwards awards={resume.awards} />
    <RenderLanguages languages={resume.languages} />
    <RenderCustomSections customSections={resume.customSections} />
  </div>
);
