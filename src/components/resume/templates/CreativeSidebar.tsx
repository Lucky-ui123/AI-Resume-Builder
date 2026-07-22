import React from 'react';
import { Resume } from '@/types';
import { DateBadge, BulletPoint, DarkSkillBadge, RenderLanguages, RenderCertifications, RenderAwards, RenderCustomSections } from './shared';

export const CreativeSidebar = ({ resume }: { resume: Resume }) => (
  <div className="flex h-full min-h-[1131px] text-slate-800 bg-slate-50 font-sans">
    {/* Asymmetric wide sidebar */}
    <aside className="w-[36%] resume-sidebar p-8 flex flex-col gap-8 break-inside-avoid" style={{ backgroundColor: 'var(--theme-aside-background)', color: 'var(--theme-aside-text)' }}>
      <div>
        <h1 className="text-3xl font-extrabold leading-tight mb-2 uppercase tracking-tight" style={{ color: 'var(--theme-aside-text)' }}>
          {resume.personalInfo.firstName} <br /> {resume.personalInfo.lastName}
        </h1>
        {resume.targetRole && (
          <div className="font-bold tracking-wider text-xs uppercase opacity-80" style={{ color: 'var(--theme-aside-text)' }}>{resume.targetRole}</div>
        )}
      </div>

      <div className="space-y-8">
        {/* Contact info list with nice contrast */}
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4 opacity-60" style={{ color: 'var(--theme-aside-text)' }}>Connect</h2>
          <ul className="space-y-2.5 text-xs font-medium" style={{ color: 'var(--theme-aside-muted)' }}>
            {resume.personalInfo.phone && <li>Phone: {resume.personalInfo.phone}</li>}
            {resume.personalInfo.email && <li className="truncate">Email: {resume.personalInfo.email}</li>}
            {resume.personalInfo.location && <li>Loc: {resume.personalInfo.location}</li>}
            {resume.personalInfo.linkedin && <li className="truncate">LinkedIn: {resume.personalInfo.linkedin.replace('https://', '')}</li>}
            {resume.personalInfo.github && <li className="truncate">GitHub: {resume.personalInfo.github.replace('https://', '')}</li>}
            {resume.personalInfo.website && <li className="truncate">Web: {resume.personalInfo.website.replace('https://', '')}</li>}
          </ul>
        </section>

        {/* Competencies */}
        {resume.skills && resume.skills.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4 opacity-60" style={{ color: 'var(--theme-aside-text)' }}>Skills</h2>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map(s => (
                <DarkSkillBadge key={s.id} name={s.name} />
              ))}
            </div>
          </section>
        )}

        {/* Education on Sidebar */}
        {resume.education && resume.education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4 opacity-60" style={{ color: 'var(--theme-aside-text)' }}>Education</h2>
            <div className="space-y-4">
              {resume.education.map(edu => (
                <div key={edu.id} className="text-xs">
                  <div className="font-bold leading-tight" style={{ color: 'var(--theme-aside-text)' }}>{edu.degree}</div>
                  <div className="my-0.5" style={{ color: 'var(--theme-aside-muted)' }}>{edu.fieldOfStudy}</div>
                  <div className="opacity-75">{edu.institution}</div>
                  <div className="opacity-50 mt-0.5">{edu.startDate} - {edu.endDate}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <RenderLanguages languages={resume.languages} isAside={true} />
      </div>
    </aside>

    {/* Creative Main Side */}
    <main className="w-[64%] bg-white resume-main p-10 pr-12 flex flex-col gap-8">
      {/* Profile */}
      {resume.summary && (
        <section className="break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-3">About Me</h2>
          <p className="text-sm leading-relaxed text-slate-600">{resume.summary}</p>
        </section>
      )}

      {/* Experience Timeline */}
      {resume.experience && resume.experience.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Career Timeline</h2>
          <div className="space-y-8">
            {resume.experience.map(exp => (
              <div key={exp.id} className="break-inside-avoid border-l-2 pl-5 relative" style={{ borderColor: 'var(--theme-primary)' }}>
                <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }}></div>
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-extrabold text-base text-slate-900">{exp.role}</h3>
                  <DateBadge startDate={exp.startDate} endDate={exp.endDate} current={exp.current} />
                </div>
                <div className="text-xs font-semibold text-slate-500 mb-3">{exp.company} • {exp.location}</div>
                <ul className="list-none text-xs leading-relaxed text-slate-600 space-y-1.5 pl-0.5">
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

      {/* Projects */}
      {resume.projects && resume.projects.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Notable Work</h2>
          <div className="grid grid-cols-1 gap-4">
            {resume.projects.map(proj => (
              <div key={proj.id} className="break-inside-avoid border-b border-slate-100 pb-4">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-sm text-slate-900">{proj.name}</h3>
                  {proj.url && <a href={`https://${proj.url}`} className="text-[10px] hover:underline font-bold" style={{ color: 'var(--theme-primary)' }}>{proj.url}</a>}
                </div>
                <p className="text-xs leading-relaxed text-slate-600">{proj.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <RenderCertifications certifications={resume.certifications} />
      <RenderAwards awards={resume.awards} />
      <RenderCustomSections customSections={resume.customSections} />
    </main>
  </div>
);
