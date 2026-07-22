import React from 'react';
import { Resume } from '@/types';
import { RenderLanguages, RenderCertifications, RenderAwards, RenderCustomSections } from './shared';

export const Startup = ({ resume }: { resume: Resume }) => (
  <div className="bg-white min-h-[1056px] h-full flex">
    {/* Left Sidebar - Bold & Colorful */}
    <div className="w-[38%] resume-sidebar p-10 flex flex-col gap-10" style={{ backgroundColor: 'var(--theme-aside-background)', color: 'var(--theme-aside-text)' }}>
      {/* Profile Header (Name in Sidebar or Main? Let's put contact and skills here) */}
      <div className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--theme-aside-text)', opacity: 0.7 }}>Contact</h2>
        <div className="space-y-4 text-sm font-medium" style={{ color: 'var(--theme-aside-muted)' }}>
          {resume.personalInfo.email && (
            <div className="flex items-start">
              <span className="w-5 flex-shrink-0" style={{ color: 'var(--theme-aside-subtle)' }}>@</span>
              <span className="break-all">{resume.personalInfo.email}</span>
            </div>
          )}
          {resume.personalInfo.phone && (
            <div className="flex items-start">
              <span className="w-5 flex-shrink-0" style={{ color: 'var(--theme-aside-subtle)' }}>#</span>
              <span>{resume.personalInfo.phone}</span>
            </div>
          )}
          {resume.personalInfo.location && (
            <div className="flex items-start">
              <span className="w-5 flex-shrink-0" style={{ color: 'var(--theme-aside-subtle)' }}>📍</span>
              <span>{resume.personalInfo.location}</span>
            </div>
          )}
          {resume.personalInfo.linkedin && (
            <div className="flex items-start">
              <span className="w-5 flex-shrink-0" style={{ color: 'var(--theme-aside-subtle)' }}>in</span>
              <span className="break-all">{resume.personalInfo.linkedin.replace('https://', '')}</span>
            </div>
          )}
          {resume.personalInfo.website && (
            <div className="flex items-start">
              <span className="w-5 flex-shrink-0" style={{ color: 'var(--theme-aside-subtle)' }}>🔗</span>
              <span className="break-all">{resume.personalInfo.website.replace('https://', '')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tech Stack / Skills */}
      {resume.skills && resume.skills.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--theme-aside-text)', opacity: 0.7 }}>Tech Stack</h2>
          <div className="flex flex-wrap gap-2">
            {resume.skills.map(s => (
              <span key={s.id} className="text-xs font-bold px-3 py-1.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--theme-aside-text)' }}>
                {s.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--theme-aside-text)', opacity: 0.7 }}>Projects</h2>
          <div className="space-y-6">
            {resume.projects.map((proj) => (
              <div key={proj.id} className="break-inside-avoid">
                <h3 className="font-bold text-base mb-1" style={{ color: 'var(--theme-aside-text)' }}>{proj.name}</h3>
                {proj.url && (
                  <a href={`https://${proj.url}`} className="text-xs font-semibold underline mb-2 block" style={{ color: 'var(--theme-aside-muted)' }}>
                    {proj.url}
                  </a>
                )}
                <p className="text-sm leading-relaxed" style={{ color: 'var(--theme-aside-muted)' }}>{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {resume.education && resume.education.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--theme-aside-text)', opacity: 0.7 }}>Education</h2>
          <div className="space-y-5">
            {resume.education.map(edu => (
              <div key={edu.id} className="break-inside-avoid">
                <h3 className="font-bold text-sm" style={{ color: 'var(--theme-aside-text)' }}>{edu.degree}</h3>
                <div className="text-sm my-0.5" style={{ color: 'var(--theme-aside-muted)' }}>{edu.fieldOfStudy}</div>
                <div className="text-xs font-medium mt-1" style={{ color: 'var(--theme-aside-subtle)' }}>{edu.institution}</div>
                <div className="text-xs" style={{ color: 'var(--theme-aside-subtle)' }}>{edu.startDate} – {edu.current ? 'Present' : edu.endDate}</div>
              </div>
            ))}
          </div>
        </section>
      )}
      <RenderLanguages languages={resume.languages} isAside={true} />
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
      
      <RenderCertifications certifications={resume.certifications} />
      <RenderAwards awards={resume.awards} />
      <RenderCustomSections customSections={resume.customSections} />
    </div>
  </div>
);
