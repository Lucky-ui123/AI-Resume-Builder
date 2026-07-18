import { Resume, ResumeScores, ResumeSuggestion } from '@/types';

const WEAK_VERBS = ['worked', 'did', 'helped', 'responsible for', 'handled', 'was', 'managed to', 'assisted'];
const BUZZWORDS = ['hardworking', 'team player', 'synergy', 'detail-oriented', 'think outside the box', 'go-getter', 'results-driven'];
const METRICS_REGEX = /\b(\d+%?|\$\d+|\d+x|\d+k|\d+m)\b/i;

function generateId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

export class LocalHeuristicAnalyzer {
  static analyze(resume: Resume): { scores: ResumeScores, suggestions: ResumeSuggestion[] } {
    const suggestions: ResumeSuggestion[] = [];
    let atsDeductions = 0;
    let writingDeductions = 0;
    let contentDeductions = 0;

    // 1. Personal Info
    if (!resume.personalInfo.linkedin) {
      atsDeductions += 5;
      contentDeductions += 5;
      suggestions.push({
        id: generateId('sug_linkedin'),
        title: 'Missing LinkedIn Profile',
        description: 'Add a LinkedIn profile. Recruiters often verify candidates through LinkedIn.',
        reason: 'Contact visibility is critical for recruiters to learn more about you.',
        priority: 'High',
        category: 'Content',
        impact: 'High',
        targetField: 'personalInfo.linkedin',
        currentText: '',
        suggestedText: 'linkedin.com/in/yourprofile'
      });
    }

    // 2. Professional Summary
    if (!resume.summary || resume.summary.length < 50) {
      contentDeductions += 15;
      suggestions.push({
        id: generateId('sug_summary_length'),
        title: 'Expand Professional Summary',
        description: 'Your professional summary is too short or empty.',
        reason: 'Recruiters spend less than 10 seconds reading summaries. It needs to pack a punch.',
        priority: 'Critical',
        category: 'Content',
        impact: 'High',
        targetField: 'summary',
        currentText: resume.summary || '',
        suggestedText: 'Experienced professional with a track record of delivering measurable impact. Skilled in [Your Key Skill] and [Your Key Skill] with a focus on [Your Industry/Focus].'
      });
    } else {
      const lowerSummary = resume.summary.toLowerCase();
      
      BUZZWORDS.forEach(word => {
        if (lowerSummary.includes(word)) {
          writingDeductions += 5;
          suggestions.push({
            id: generateId('sug_summary_buzz'),
            title: 'Remove Buzzwords in Summary',
            description: `Replace the generic term "${word}" with measurable achievements.`,
            reason: 'Buzzwords like this take up space without proving your capabilities.',
            priority: 'Medium',
            category: 'Grammar',
            impact: 'Medium',
            targetField: 'summary',
            currentText: resume.summary,
            suggestedText: resume.summary.replace(new RegExp(word, 'gi'), '[Actionable Metric]')
          });
        }
      });
    }

    // 3. Experience
    if (!resume.experience || resume.experience.length === 0) {
      contentDeductions += 40;
      atsDeductions += 20;
      suggestions.push({
        id: generateId('sug_exp_empty'),
        title: 'Missing Experience Section',
        description: 'Add your professional experience.',
        reason: 'This is the most critical part of a resume for most jobs.',
        priority: 'Critical',
        category: 'Content',
        impact: 'High',
        targetField: 'experience',
        currentText: '',
        suggestedText: 'Added Experience'
      });
    } else {
      resume.experience.forEach((exp, idx) => {
        if (!exp.description || exp.description.trim() === '') return;
        
        const lowerDesc = exp.description.toLowerCase();
        
        // Check for metrics
        if (!METRICS_REGEX.test(lowerDesc)) {
          contentDeductions += 5;
          atsDeductions += 5;
          suggestions.push({
            id: generateId(`sug_exp_metrics_${idx}`),
            title: `Add Metrics to ${exp.role || 'Experience'}`,
            description: 'Quantify your achievements with numbers, percentages, or dollar amounts.',
            reason: 'Measurable impact makes your experience significantly more compelling.',
            priority: 'High',
            category: 'Content',
            impact: 'High',
            targetField: `experience[${idx}].description`,
            currentText: exp.description,
            suggestedText: exp.description + '\n• Improved process efficiency by 25%.'
          });
        }

        // Check for weak verbs
        WEAK_VERBS.forEach(verb => {
          if (lowerDesc.includes(` ${verb} `) || lowerDesc.startsWith(`${verb} `)) {
            writingDeductions += 2;
            suggestions.push({
              id: generateId(`sug_exp_verb_${idx}`),
              title: 'Use Strong Action Verbs',
              description: `Replace the weak verb "${verb}" with a strong action verb (e.g., Orchestrated, Developed, Spearheaded).`,
              reason: 'Strong verbs demonstrate leadership and direct action.',
              priority: 'Medium',
              category: 'Writing',
              impact: 'Medium',
              targetField: `experience[${idx}].description`,
              currentText: exp.description,
              suggestedText: exp.description.replace(new RegExp(`\\b${verb}\\b`, 'gi'), 'Spearheaded')
            });
          }
        });
      });
    }

    // 4. Skills
    if (!resume.skills || resume.skills.length < 5) {
      atsDeductions += 15;
      suggestions.push({
        id: generateId('sug_skills_count'),
        title: 'Add More Skills',
        description: 'Include at least 5-10 core skills related to your target role.',
        reason: 'ATS systems heavily rely on skill keywords to rank candidates.',
        priority: 'High',
        category: 'ATS',
        impact: 'High',
        targetField: 'skills',
        currentText: resume.skills?.map(s => typeof s === 'string' ? s : s.name).join(', ') || '',
        suggestedText: (resume.skills?.length ? resume.skills.map(s => typeof s === 'string' ? s : s.name).join(', ') + ', ' : '') + 'Project Management, Data Analysis, Leadership'
      });
    }

    // Calculate Scores
    const overall = Math.max(0, Math.round(100 - (atsDeductions + writingDeductions + contentDeductions) / 3));
    const ats = Math.max(0, 100 - atsDeductions);
    const writing = Math.max(0, 100 - writingDeductions);
    const content = Math.max(0, 100 - contentDeductions);

    return {
      scores: {
        overall,
        ats,
        writing,
        content,
        keyword: ats, // simplified for now
        experience: content // simplified for now
      },
      suggestions
    };
  }
}
