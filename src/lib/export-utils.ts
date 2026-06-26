import { Resume } from '@/types';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';

export const generatePDF = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Could not find the resume preview element.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opt: any = {
    margin: [10, 0, 10, 0],
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Dynamically import html2pdf to prevent SSR "self is not defined" error
  const html2pdf = (await import('html2pdf.js')).default;
  await html2pdf().from(element).set(opt).save();
};

export const generateDOCX = async (resume: Resume, filename: string) => {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Header
          new Paragraph({
            text: `${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`,
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun(`${resume.personalInfo.email} | ${resume.personalInfo.phone} | ${resume.personalInfo.location}`)
            ],
          }),
          new Paragraph({ text: '' }), // Spacer

          // Summary
          ...(resume.summary ? [
            new Paragraph({ text: 'PROFESSIONAL SUMMARY', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: resume.summary }),
            new Paragraph({ text: '' }),
          ] : []),

          // Experience
          ...(resume.experience?.length ? [
            new Paragraph({ text: 'EXPERIENCE', heading: HeadingLevel.HEADING_2 }),
            ...resume.experience.flatMap(exp => [
              new Paragraph({
                children: [
                  new TextRun({ text: exp.role, bold: true }),
                  new TextRun(`\t\t${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: exp.company, italics: true }),
                  new TextRun(` - ${exp.location}`),
                ],
              }),
              // Handle multiline bullets
              ...exp.description.split('\n').map(line => new Paragraph({ text: line })),
              new Paragraph({ text: '' }),
            ])
          ] : []),

          // Education
          ...(resume.education?.length ? [
            new Paragraph({ text: 'EDUCATION', heading: HeadingLevel.HEADING_2 }),
            ...resume.education.flatMap(edu => [
              new Paragraph({
                children: [
                  new TextRun({ text: edu.institution, bold: true }),
                  new TextRun(`\t\t${edu.startDate} - ${edu.current ? 'Present' : edu.endDate}`),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun(`${edu.degree} in ${edu.fieldOfStudy}`),
                  ...(edu.score ? [new TextRun(` - ${edu.score}`)] : [])
                ]
              }),
              new Paragraph({ text: '' }),
            ])
          ] : []),

          // Skills
          ...(resume.skills?.length ? [
            new Paragraph({ text: 'SKILLS', heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
              children: [
                new TextRun({ text: 'Core Competencies: ', bold: true }),
                new TextRun(resume.skills.map(s => s.name).join(', ')),
              ]
            }),
            new Paragraph({ text: '' }),
          ] : []),

          // Projects
          ...(resume.projects?.length ? [
            new Paragraph({ text: 'PROJECTS', heading: HeadingLevel.HEADING_2 }),
            ...resume.projects.flatMap(proj => [
              new Paragraph({
                children: [
                  new TextRun({ text: proj.name, bold: true }),
                  ...(proj.url ? [new TextRun(` | ${proj.url}`)] : [])
                ],
              }),
              new Paragraph({ text: proj.description }),
              new Paragraph({ text: '' }),
            ])
          ] : []),

          // Certifications
          ...(resume.certifications?.length ? [
            new Paragraph({ text: 'CERTIFICATIONS', heading: HeadingLevel.HEADING_2 }),
            ...resume.certifications.flatMap(cert => [
              new Paragraph({
                children: [
                  new TextRun({ text: cert.name, bold: true }),
                  new TextRun(` - ${cert.issuer}\t\t${cert.date}`),
                ],
              }),
            ])
          ] : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename);
};

export const generateTXT = (resume: Resume, filename: string) => {
  const lines: string[] = [];

  // Header
  lines.push(`${resume.personalInfo.firstName} ${resume.personalInfo.lastName}`);
  lines.push(`${resume.personalInfo.email} | ${resume.personalInfo.phone} | ${resume.personalInfo.location}`);
  if (resume.personalInfo.linkedin) lines.push(resume.personalInfo.linkedin);
  lines.push('');

  // Summary
  if (resume.summary) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(resume.summary);
    lines.push('');
  }

  // Experience
  if (resume.experience?.length) {
    lines.push('EXPERIENCE');
    resume.experience.forEach(exp => {
      lines.push(`${exp.role}`);
      lines.push(`${exp.company} - ${exp.location} | ${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`);
      lines.push(exp.description);
      lines.push('');
    });
  }

  // Education
  if (resume.education?.length) {
    lines.push('EDUCATION');
    resume.education.forEach(edu => {
      lines.push(`${edu.institution}`);
      lines.push(`${edu.degree} in ${edu.fieldOfStudy} | ${edu.startDate} - ${edu.current ? 'Present' : edu.endDate}`);
      if (edu.score) lines.push(edu.score);
      lines.push('');
    });
  }

  // Skills
  if (resume.skills?.length) {
    lines.push('SKILLS');
    lines.push(resume.skills.map(s => s.name).join(', '));
    lines.push('');
  }

  // Projects
  if (resume.projects?.length) {
    lines.push('PROJECTS');
    resume.projects.forEach(proj => {
      lines.push(`${proj.name} ${proj.url ? `| ${proj.url}` : ''}`);
      lines.push(proj.description);
      lines.push('');
    });
  }

  // Certifications
  if (resume.certifications?.length) {
    lines.push('CERTIFICATIONS');
    resume.certifications.forEach(cert => {
      lines.push(`${cert.name} - ${cert.issuer} | ${cert.date}`);
    });
  }

  const textContent = lines.join('\n');
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, filename);
};
