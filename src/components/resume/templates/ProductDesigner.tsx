import React from 'react';
import { Resume } from '@/types';
import { DateBadge, BulletPoint, DarkSkillBadge, RenderLanguages, RenderCertifications, RenderAwards, RenderCustomSections } from './shared';

export const ProductDesigner = ({ resume }: { resume: Resume }) => (
  <div className="flex h-full min-h-[1131px] text-slate-800">
    {/* Left Sidebar */}
    <aside className="w-[32%] resume-sidebar p-8 flex flex-col break-inside-avoid" style={{ backgroundColor: 'var(--theme-aside-background)', color: 'var(--theme-aside-text)' }}>
      <div className="mb-10">
        <h1 className="text-3xl font-bold leading-tight mb-3 tracking-tight" style={{ color: 'var(--theme-aside-text)' }}>
          {resume.personalInfo.firstName} <br /> {resume.personalInfo.lastName}
        </h1>
        <div className="font-medium tracking-wide text-sm" style={{ color: 'var(--theme-aside-muted)' }}>{resume.targetRole}</div>
      </div>

      <div className="space-y-10">
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--theme-aside-subtle)' }}>Contact</h2>
          <ul className="space-y-3 text-sm" style={{ color: 'var(--theme-aside-muted)' }}>
            {resume.personalInfo.phone && <li>{resume.personalInfo.phone}</li>}
            {resume.personalInfo.email && <li className="truncate">{resume.personalInfo.email}</li>}
            {resume.personalInfo.location && <li>{resume.personalInfo.location}</li>}
            {resume.personalInfo.linkedin && <li className="truncate">{resume.personalInfo.linkedin.replace('https://', '')}</li>}
            {resume.personalInfo.website && <li className="truncate" style={{ color: 'var(--theme-aside-subtle)' }}>{resume.personalInfo.website.replace('https://', '')}</li>}
          </ul>
        </section>

        {resume.skills && resume.skills.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--theme-aside-subtle)' }}>Skills</h2>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map(s => (
                <DarkSkillBadge key={s.id} name={s.name} />
              ))}
            </div>
          </section>
        )}

        {resume.education && resume.education.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--theme-aside-subtle)' }}>Education</h2>
            <div className="space-y-5">
              {resume.education.map(edu => (
                <div key={edu.id}>
                  <div className="font-bold text-sm leading-snug" style={{ color: 'var(--theme-aside-text)' }}>{edu.degree}</div>
                  <div className="text-sm my-1" style={{ color: 'var(--theme-aside-muted)' }}>{edu.fieldOfStudy}</div>
                  <div className="text-xs" style={{ color: 'var(--theme-aside-subtle)' }}>{edu.institution}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--theme-aside-subtle)' }}>{edu.startDate} - {edu.endDate}</div>
                </div>
              ))}
            </div>
          </section>
        )}
        <RenderLanguages languages={resume.languages} isAside={true} />
      </div>
    </aside>

    {/* Right Main Content */}
    <main className="w-[68%] resume-main p-10 pr-12">
      {resume.summary && (
        <section className="mb-10 break-inside-avoid">
          <h2 className="text-xl font-bold text-slate-900 mb-5 flex items-center uppercase tracking-wide">
            <span className="w-8 h-1 mr-4 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }}></span> Profile
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">{resume.summary}</p>
        </section>
      )}

      {resume.experience && resume.experience.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center uppercase tracking-wide">
            <span className="w-8 h-1 mr-4 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }}></span> Experience
          </h2>
          <div className="space-y-8">
            {resume.experience.map(exp => (
              <div key={exp.id} className="break-inside-avoid">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-bold text-base text-slate-900">{exp.role}</h3>
                  <DateBadge startDate={exp.startDate} endDate={exp.endDate} current={exp.current} />
                </div>
                <div className="text-sm font-medium text-slate-700 mb-3">{exp.company} <span className="text-slate-400 font-normal ml-1">• {exp.location}</span></div>
                <ul className="list-none pl-1 text-sm leading-relaxed text-slate-600 space-y-1.5">
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

      {resume.projects && resume.projects.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center uppercase tracking-wide">
            <span className="w-8 h-1 mr-4 rounded-full" style={{ backgroundColor: 'var(--theme-primary)' }}></span> Selected Work
          </h2>
          <div className="grid grid-cols-1 gap-5">
            {resume.projects.map(proj => (
              <div key={proj.id} className="break-inside-avoid border border-slate-200 p-5 rounded-xl shadow-sm" style={{ backgroundColor: 'rgba(248, 250, 252, 0.5)' }}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-base text-slate-900">{proj.name}</h3>
                  {proj.url && <a href={`https://${proj.url}`} className="text-xs hover:underline truncate ml-4" style={{ color: 'var(--theme-primary)' }}>{proj.url}</a>}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{proj.description}</p>
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
