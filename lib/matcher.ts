import { Repository, ProjectMatch, JobAnalysis, ProjectScore } from './types';
import { scoreAndDescribeProject } from './claude';

// Scoring weights
const WEIGHTS = {
  TECH_STACK: 0.35,
  DOMAIN_RELEVANCE: 0.30,
  RECENCY_ACTIVITY: 0.20,
  COMPLEXITY_SCALE: 0.15,
};

export const calculateTechStackMatch = (
  repoLanguages: string[],
  jobTechnologies: string[]
): number => {
  if (jobTechnologies.length === 0) return 0;
  if (repoLanguages.length === 0) return 0;

  // Normalize to lowercase for matching
  const normalizedRepo = repoLanguages.map((l) => l.toLowerCase());
  const normalizedJob = jobTechnologies.map((t) => t.toLowerCase());

  // Count exact or partial matches
  let matches = 0;
  for (const jobTech of normalizedJob) {
    if (
      normalizedRepo.some(
        (lang) =>
          lang === jobTech ||
          jobTech.includes(lang) ||
          lang.includes(jobTech) ||
          (lang.includes('js') && jobTech.includes('js')) ||
          (lang.includes('py') && jobTech.includes('python')) ||
          (lang.includes('ts') && jobTech.includes('typescript'))
      )
    ) {
      matches++;
    }
  }

  return (matches / jobTechnologies.length) * 100;
};

export const calculateDomainRelevance = (
  repoDescription: string | null,
  repoTopic: string[],
  jobDomain: string
): number => {
  const text = (repoDescription + ' ' + repoTopic.join(' ')).toLowerCase();
  const domain = jobDomain.toLowerCase();

  if (!text || !domain) return 0;

  // Simple keyword matching for domain
  const domainWords = domain.split(/[\s,]+/).filter((w) => w.length > 2);
  let matches = 0;

  for (const word of domainWords) {
    if (text.includes(word.toLowerCase())) {
      matches++;
    }
  }

  const score = (matches / Math.max(domainWords.length, 1)) * 100;
  return Math.min(score, 100);
};

export const calculateRecencyScore = (lastUpdated: string): number => {
  const now = new Date();
  const updated = new Date(lastUpdated);
  const daysDiff = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);

  // Recent activity (within 90 days) = 100, decays over time
  if (daysDiff <= 90) return 100;
  if (daysDiff <= 180) return 80;
  if (daysDiff <= 365) return 60;
  if (daysDiff <= 730) return 40;
  if (daysDiff <= 1095) return 20;
  return 10;
};

export const calculateComplexityScore = (
  stars: number,
  size: number,
  forks: number
): number => {
  // Normalize each factor to 0-100

  // Stars: log scale, 1000+ = max
  const starScore = Math.min((Math.log10(stars + 1) / Math.log10(1000)) * 100, 100);

  // Size: bytes, 100KB+ = max
  const sizeScore = Math.min((size / 100) * 10, 100);

  // Forks: indicator of community interest
  const forkScore = Math.min((forks / 50) * 100, 100);

  // Weighted average
  return (starScore * 0.4 + sizeScore * 0.3 + forkScore * 0.3);
};

export const calculateOverallScore = (
  repo: Repository,
  jobAnalysis: JobAnalysis
): number => {
  const techStackScore = calculateTechStackMatch(repo.languages, jobAnalysis.technologies);
  const domainScore = calculateDomainRelevance(repo.description, repo.topics, jobAnalysis.domain);
  const recencyScore = calculateRecencyScore(repo.updatedAt);
  const complexityScore = calculateComplexityScore(repo.stars, repo.size, repo.forks);

  const overallScore =
    techStackScore * WEIGHTS.TECH_STACK +
    domainScore * WEIGHTS.DOMAIN_RELEVANCE +
    recencyScore * WEIGHTS.RECENCY_ACTIVITY +
    complexityScore * WEIGHTS.COMPLEXITY_SCALE;

  return Math.round(overallScore);
};

export const getAlignmentPoints = (
  repo: Repository,
  jobAnalysis: JobAnalysis,
  score: number
): string[] => {
  const points: string[] = [];

  // Tech stack match
  const matchingLangs = repo.languages.filter((lang) =>
    jobAnalysis.technologies.some(
      (tech) =>
        tech.toLowerCase() === lang.toLowerCase() ||
        tech.toLowerCase().includes(lang.toLowerCase()) ||
        lang.toLowerCase().includes(tech.toLowerCase())
    )
  );
  if (matchingLangs.length > 0) {
    points.push(`Tech match: ${matchingLangs.slice(0, 3).join(', ')}`);
  }

  // Domain relevance
  const desc = (repo.description || '').toLowerCase();
  const domain = jobAnalysis.domain.toLowerCase();
  if (desc.includes(domain) || repo.topics.some((t) => t.toLowerCase().includes(domain))) {
    points.push(`Domain relevance: ${jobAnalysis.domain}`);
  }

  // Recency
  if (score >= 70) {
    points.push(`Recently active (${new Date(repo.updatedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`);
  }

  // Scale indicators
  const scalePoints: string[] = [];
  if (repo.stars > 50) scalePoints.push(`${repo.stars} stars`);
  if (repo.forks > 10) scalePoints.push(`${repo.forks} forks`);
  if (repo.size > 50) scalePoints.push(`${Math.round(repo.size / 1024)}KB codebase`);

  if (scalePoints.length > 0) {
    points.push(`Scale: ${scalePoints.join(', ')}`);
  }

  // Topics alignment
  const alignedTopics = repo.topics.filter((topic) =>
    jobAnalysis.requiredSkills.some(
      (skill) => topic.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(topic.toLowerCase())
    )
  );
  if (alignedTopics.length > 0) {
    points.push(`Topics: ${alignedTopics.slice(0, 3).join(', ')}`);
  }

  return points.slice(0, 5); // Max 5 points
};

export const matchProjects = async (
  repos: Repository[],
  jobAnalysis: JobAnalysis,
  userInfo: {
    personalInfo: {
      fullName: string;
      github?: string;
    };
    experiences: Array<{ role: string; company: string }>;
  }
): Promise<ProjectMatch[]> => {
  if (repos.length === 0) {
    return [];
  }

  // Calculate scores for all repos
  const scoredRepos: ProjectScore[] = repos
    .filter((repo) => repo.languages.length > 0) // Must have at least one language
    .map((repo) => ({
      repo,
      score: calculateOverallScore(repo, jobAnalysis),
      alignmentPoints: getAlignmentPoints(repo, jobAnalysis, 0), // temporary, will recalc with score
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Take top 5 for AI evaluation

  // Use Claude to generate descriptions and final scoring for top candidates
  const enhancedMatches: ProjectMatch[] = await Promise.all(
    scoredRepos.slice(0, 3).map(async (scored) => {
      try {
        // Estimate years of experience from work history
        const yearsExp = userInfo.experiences.length * 2; // rough estimate

        // Build a brief job summary for Claude
        const jobSummary = `${jobAnalysis.seniority} ${jobAnalysis.domain} role requiring: ${jobAnalysis.requiredSkills.slice(0, 10).join(', ')}. Key technologies: ${jobAnalysis.technologies.slice(0, 8).join(', ')}. Values metrics: ${jobAnalysis.keyMetrics.join(', ')}.`;

        // Fetch README if available to better describe the project
        let descriptionText = scored.repo.description || '';

        const projectInfo = {
          name: scored.repo.name,
          description: scored.repo.description || '',
          languages: scored.repo.languages,
          topics: scored.repo.topics,
          stars: scored.repo.stars,
          descriptionText,
        };

        const aiResult = await scoreAndDescribeProject(
          jobSummary,
          jobAnalysis.atsKeywords,
          projectInfo
        );

        return {
          repo: scored.repo,
          matchScore: aiResult.score, // Use Claude's score (more nuanced)
          alignmentPoints: [
            ...scored.alignmentPoints,
            ...aiResult.alignmentPoints,
          ].slice(0, 5),
          generatedDescription: aiResult.description,
        };
      } catch (error) {
        console.error(`Error scoring project ${scored.repo.name}:`, error);
        // Fallback: use calculated score and generate simple description
        return {
          repo: scored.repo,
          matchScore: scored.score,
          alignmentPoints: scored.alignmentPoints,
          generatedDescription: `Developed ${scored.repo.name} using ${scored.repo.languages.slice(0, 3).join(', ')}. Project includes ${scored.repo.topics.slice(0, 3).join(', ')} features with ${scored.repo.stars} stars and ${scored.repo.forks} forks on GitHub.`,
        };
      }
    })
  );

  // Sort by match score descending and take top 2
  const topMatches = enhancedMatches
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 2);

  return topMatches;
};