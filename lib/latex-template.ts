import { ResumeData } from './types';

export const generateLaTeX = (data: ResumeData): string => {
  const {
    personalInfo,
    summary,
    experiences,
    matchedProjects,
    skills,
    education,
  } = data;

  // Escape special LaTeX characters
  const escapeLatex = (text: string): string => {
    return text
      .replace(/\\/g, '\\textbackslash{}')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\$/g, '\\$')
      .replace(/&/g, '\\&')
      .replace(/_/g, '\\_')
      .replace(/\^/g, '\\^{}')
      .replace(/%/g, '\\%')
      .replace(/~/g, '\\~{}')
      .replace(/#/g, '\\#')
      .replace(/\|/g, '\\textbar{}');
  };

  // Format date
  const formatDate = (dateStr: string): string => {
    if (dateStr === 'Present') return 'Present';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const p = escapeLatex;
  const name = p(personalInfo.fullName);
  const email = p(personalInfo.email);
  const phone = p(personalInfo.phone);
  const location = p(personalInfo.location);
  const linkedIn = personalInfo.linkedIn ? p(personalInfo.linkedIn) : '';
  const github = personalInfo.github ? p(personalInfo.github) : '';
  const website = personalInfo.website ? p(personalInfo.website) : '';

  // Build header contact info
  const contactInfo = [];
  contactInfo.push(email);
  contactInfo.push(`\\textit{${phone}}`);
  contactInfo.push(`\\textit{${location}}`);
  if (linkedIn) contactInfo.push(`LinkedIn: ${linkedIn}`);
  if (github) contactInfo.push(`GitHub: ${github}`);
  if (website) contactInfo.push(`Website: ${website}`);

  // Build skills section
  const buildSkillList = (skillList: string[]): string => {
    return skillList.map(skill => `\\textbf{${p(skill)}}`).join(', ');
  };

  // Build experience sections
  const experienceSections = experiences.map(exp => {
    const bullets = exp.bullets
      .slice(0, 3) // max 3 bullets per role
      .map(bullet => `\\item ${escapeLatex(bullet)}`)
      .join('\n');

    return `\\section*{${p(exp.role)} \\hfill \\textit{${p(exp.company)}}}

\\textbf{${formatDate(exp.startDate)} -- ${formatDate(exp.endDate)} | ${p(exp.location)}}

\\begin{itemize}[leftmargin=*]
${bullets}
\\end{itemize}
`;
  }).join('\n');

  // Build projects section
  const projectsSections = matchedProjects.map(match => {
    const repo = match.repo;
    const title = match.generatedDescription
      ? `${repo.name} \\texttt{[${escapeLatex(repo.languages.slice(0, 3).join(', '))}]}`
      : repo.name;

    return `\\section*{${title} \\hfill \\small \\href{${repo.url}}{GitHub}}

\\begin{itemize}[leftmargin=*]
\\item ${escapeLatex(match.generatedDescription)}
\\end{itemize}
`;
  }).join('\n');

  // Build skills section with categories
  const skillsSection = `\\section*{Skills}

\\begin{itemize}[leftmargin=*]
\\item \\textbf{Languages:} ${buildSkillList(skills.languages)}
\\item \\textbf{Frameworks:} ${buildSkillList(skills.frameworks)}
\\item \\textbf{Tools:} ${buildSkillList(skills.tools)}
\\item \\textbf{Soft Skills:} ${buildSkillList(skills.softSkills)}
\\end{itemize}
`;

  // Build education section
  const educationSection = education.degree && education.university
    ? `\\section*{Education}

\\textbf{${p(education.university)}}

${p(education.degree)}${education.graduationYear ? `, ${education.graduationYear}` : ''}${education.gpa ? ` \\hfill GPA: ${education.gpa}` : ''}
`
    : '';

  return `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{fontawesome5}
\\usepackage{graphicx}
\\usepackage{parskip}
\\usepackage{titlesec}

% Set section formatting
\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[]\\usepackage{titlesec}
\\titlespacing*{\\section}{0pt}{12pt}{6pt}

% Compact lists
\\setlist[itemize]{leftmargin=*,label=--,noitemsep,topsep=0pt,partopsep=0pt}

% No paragraph indentation
\\setlength{\\parindent}{0pt}

\\begin{document}

% Header
\\begin{center}
    \\LARGE\\textbf{${name}}\\\\[4pt]
    \\normalsize
    ${contactInfo.join(' \\textbullet{} ')}
\\end{center}

\\vspace{10pt}

% Professional Summary
\\section*{Professional Summary}
${escapeLatex(summary)}

% Work Experience
\\section*{Work Experience}
${experienceSections}

% Projects
\\section*{Projects}
${projectsSections}

% Skills
${skillsSection}

% Education
${educationSection}

\\end{document}
`;
};

export const validateLaTeX = (latex: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for unescaped special characters that would break LaTeX
  const unescapedPattern = /(?<!\\)[#\$%&~_\^{}|]/;
  if (unescapedPattern.test(latex)) {
    errors.push('Unescaped special LaTeX characters detected');
  }

  // Check for balanced braces
  const openBraces = (latex.match(/\{/g) || []).length;
  const closeBraces = (latex.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
  }

  // Check for required sections
  const required = [
    /\\section\*?\{?Professional?\s*Summary\}?/i,
    /\\section\*?\{?Work?\s*Experience\}?/i,
    /\\section\*?\{?Projects\}?/i,
    /\\section\*?\{?Skills\}?/i,
  ];

  required.forEach((pattern, i) => {
    if (!pattern.test(latex)) {
      const sectionNames = ['Professional Summary', 'Work Experience', 'Projects', 'Skills'];
      errors.push(`Missing required section: ${sectionNames[i]}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};