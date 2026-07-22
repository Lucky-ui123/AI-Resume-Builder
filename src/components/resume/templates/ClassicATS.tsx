import React from 'react';
import { Resume } from '@/types';
import { RenderAwards, RenderLanguages, RenderCustomSections } from './shared';

export const ClassicATS = ({ resume }: { resume: Resume }) => (
  <div className="p-10 resume-main text-black font-serif">
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

    <RenderAwards awards={resume.awards} />
    <RenderLanguages languages={resume.languages} />
    <RenderCustomSections customSections={resume.customSections} />
  </div>
);
