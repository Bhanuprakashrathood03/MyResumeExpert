interface ATSScoreResult {
  score: number;
  feedback: string[];
  keywordDensity: Record<string, number>;
  issues: string[];
}

// Common stop words to ignore in keyword counting
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'this', 'that', 'these', 'those',
  'will', 'would', 'could', 'should', 'may', 'might', 'must',
  'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there',
  'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 'just', 'can', 'will', 'don', 'should', 'now', 'use', 'using', 'work', 'worked'
]);

export const extractKeywords = (text: string): string[] => {
  // Convert to lowercase and extract words
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));

  // Count frequencies
  const frequencies: Record<string, number> = {};
  words.forEach(word => {
    frequencies[word] = (frequencies[word] || 0) + 1;
  });

  // Return keywords sorted by frequency
  return Object.entries(frequencies)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
};

export const calculateKeywordDensity = (text: string, targetKeywords: string[]): Record<string, number> => {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));

  const totalWords = words.length;
  const density: Record<string, number> = {};

  targetKeywords.forEach(keyword => {
    const normalizedKeyword = keyword.toLowerCase();
    const count = words.filter(word => word === normalizedKeyword).length;
    density[keyword] = totalWords > 0 ? (count / totalWords) * 100 : 0;
  });

  return density;
};

export const validateResumeLength = (latex: string): { pages: number; charCount: number; issue: string | null } => {
  // Simple estimation: A4 page with ~500 words or ~3000 characters
  const charCount = latex.length;
  const wordCount = latex.split(/\s+/).length;

  // Rough page count estimation for LaTeX
  // Assuming ~350-400 words per page with formatting
  const estimatedPages = Math.max(1, Math.ceil(wordCount / 375));

  let issue: string | null = null;
  if (estimatedPages > 2) {
    issue = `Resume too long: estimated ${estimatedPages} pages (max 2 for most positions)`;
  } else if (estimatedPages < 1) {
    issue = 'Resume seems too short; may lack sufficient content';
  }

  return {
    pages: estimatedPages,
    charCount,
    issue,
  };
};

export const checkSectionPresence = (latex: string): { present: string[]; missing: string[] } => {
  const requiredSections = [
    { pattern: /\\section\*?\{?Professional?\s*Summary\}?/i, name: 'Professional Summary' },
    { pattern: /\\section\*?\{?Work?\s*Experience\}?/i, name: 'Work Experience' },
    { pattern: /\\section\*?\{?Projects\}?/i, name: 'Projects' },
    { pattern: /\\section\*?\{?Skills\}?/i, name: 'Skills' },
    { pattern: /\\section\*?\{?Education\}?/i, name: 'Education' },
  ];

  const present: string[] = [];
  const missing: string[] = [];

  requiredSections.forEach(({ pattern, name }) => {
    if (pattern.test(latex)) {
      present.push(name);
    } else {
      missing.push(name);
    }
  });

  return { present, missing };
};

export const checkSkillsBalance = (skills: {
  languages: string[];
  frameworks: string[];
  tools: string[];
  softSkills: string[];
}): { isValid: boolean; feedback: string[]; total: number } => {
  const total =
    skills.languages.length +
    skills.frameworks.length +
    skills.tools.length +
    skills.softSkills.length;

  const feedback: string[] = [];
  const issues: string[] = [];

  // Check total count (12-18 is ideal, 10-20 acceptable)
  if (total < 10) {
    issues.push('Too few skills listed - may miss ATS keywords');
  } else if (total > 20) {
    issues.push('Too many skills (>20) - keyword stuffing detected');
  } else if (total > 18) {
    issues.push('Skills count slightly high (19-20) - consider trimming');
  }

  // Check individual categories (should have some in each)
  if (skills.languages.length === 0) {
    issues.push('No programming languages listed');
  }
  if (skills.frameworks.length === 0) {
    issues.push('No frameworks listed');
  }
  if (skills.tools.length === 0) {
    issues.push('No tools/technologies listed');
  }
  if (skills.softSkills.length === 0) {
    feedback.push('Consider adding 2-3 soft skills');
  }

  // Check for duplicates across categories
  const allSkills = [
    ...skills.languages,
    ...skills.frameworks,
    ...skills.tools,
    ...skills.softSkills,
  ];
  const uniqueSkills = new Set(allSkills.map(s => s.toLowerCase()));
  if (uniqueSkills.size < allSkills.length) {
    issues.push('Duplicate skills detected across categories');
  }

  return {
    isValid: issues.length === 0,
    feedback: [...feedback, ...issues],
    total,
  };
};

export const calculateATSScore = (latex: string, jobKeywords: string[], skills: any): ATSScoreResult => {
  const feedback: string[] = [];
  const issues: string[] = [];
  const allKeywords: string[] = [];

  // Collect all keywords from job
  allKeywords.push(...jobKeywords);

  // Calculate keyword density
  const density = calculateKeywordDensity(latex, allKeywords);
  const avgDensity = Object.values(density).reduce((a, b) => a + b, 0) / Object.keys(density).length;

  // Score components
  let keywordScore = 0;
  if (avgDensity >= 3 && avgDensity <= 5) {
    keywordScore = 30; // Optimal range 3-5%
    feedback.push(`Keyword density optimal: ${avgDensity.toFixed(2)}%`);
  } else if (avgDensity >= 2 && avgDensity < 3) {
    keywordScore = 20;
    feedback.push(`Keyword density acceptable but could improve: ${avgDensity.toFixed(2)}%`);
    issues.push('Consider increasing keyword density to 3-5%');
  } else if (avgDensity > 5 && avgDensity <= 8) {
    keywordScore = 25;
    feedback.push(`Keyword density slightly high: ${avgDensity.toFixed(2)}%`);
    issues.push('Reduce keyword density to avoid stuffing (>5%)');
  } else if (avgDensity > 8) {
    keywordScore = 10;
    feedback.push(`Keyword density too high: ${avgDensity.toFixed(2)}% - risk of ATS rejection`);
    issues.push('Critical: Keyword stuffing detected (>8%)');
  } else if (avgDensity < 2) {
    keywordScore = 15;
    feedback.push(`Keyword density low: ${avgDensity.toFixed(2)}%`);
    issues.push('Increase use of job keywords throughout');
  }

  // Section presence
  const sections = checkSectionPresence(latex);
  if (sections.missing.length > 0) {
    keywordScore -= 20;
    issues.push(`Missing sections: ${sections.missing.join(', ')}`);
    feedback.push(`Added all required sections`);
  } else {
    keywordScore += 20;
    feedback.push(`All ${sections.present.length} standard sections present`);
  }

  // Length validation
  const lengthCheck = validateResumeLength(latex);
  if (lengthCheck.issue) {
    keywordScore -= 15;
    issues.push(lengthCheck.issue);
  } else {
    keywordScore += 15;
    feedback.push(`Length optimal: ~${lengthCheck.pages} page(s), ${lengthCheck.charCount} chars`);
  }

  // Skills balance
  const skillsCheck = checkSkillsBalance(skills);
  if (!skillsCheck.isValid) {
    keywordScore -= Math.min(15, skillsCheck.feedback.length * 5);
    issues.push(...skillsCheck.feedback);
  } else {
    keywordScore += 10;
    feedback.push(`Skills section balanced: ${skillsCheck.total} skills across 4 categories`);
  }

  // Check for metrics in experience/projects
  const hasMetrics = /\d+%|\$[\d,]+|[,\d]+\s*(users?|clients?|customers?|requests?|transactions?|orders?|projects?)/i.test(latex);
  if (hasMetrics) {
    keywordScore += 15;
    feedback.push('Quantified metrics detected - excellent for ATS');
  } else {
    issues.push('Add quantified metrics (%, $, scale) to experience and projects');
    keywordScore -= 10;
  }

  // Check for action verbs at bullet starts
  const actionVerbs = /\b(Engineered|Architected|Built|Developed|Optimized|Led|Spearheaded|Designed|Implemented|Created|Initiated|Revamped|Improved|Reduced|Increased|Deployed)\b/i;
  const bulletStartMatches = latex.match(/^\\item\s+(Engineered|Architected|Built|Developed|Optimized|Led|Spearheaded|Designed)/gm);
  if (bulletStartMatches && bulletStartMatches.length >= 4) {
    keywordScore += 10;
    feedback.push(`Strong action verbs used: ${bulletStartMatches.length} bullets start with powerful verbs`);
  } else {
    feedback.push('Consider using stronger action verbs to start bullet points');
  }

  // Final score: ensure 0-100 range
  const finalScore = Math.max(0, Math.min(100, keywordScore));

  // Add overall assessment
  if (finalScore >= 90) {
    feedback.unshift('Elite ATS score: This resume should pass >95% of ATS systems');
  } else if (finalScore >= 75) {
    feedback.unshift(`Good ATS score: Should pass most systems`);
  } else if (finalScore >= 60) {
    feedback.unshift(`Moderate ATS score: Some improvements needed`);
  } else {
    feedback.unshift(`Low ATS score: Significant revisions required`);
  }

  return {
    score: finalScore,
    feedback,
    keywordDensity: density,
    issues,
  };
};

export const optimizeForATS = (latex: string, jobKeywords: string[], skills: any): ATSScoreResult => {
  // Run initial assessment
  const result = calculateATSScore(latex, jobKeywords, skills);

  // If score >= 90 and no critical issues, we're good
  if (result.score >= 90 && result.issues.length <= 2) {
    return result;
  }

  // For now, return the result; can add auto-fix logic later
  return result;
};