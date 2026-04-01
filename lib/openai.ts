import OpenAI from 'openai';
import { JobAnalysis, GenerateResumeOutput } from './types';

// Helper to get OpenRouter client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY or OPENAI_API_KEY is not set');
  }

  const baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

  return new OpenAI({
    apiKey,
    baseURL,
    defaultHeaders: {
      'HTTP-Referer': process.env.OPENROUTER_REFERER || 'https://resume-expert.vercel.app',
      'X-Title': process.env.OPENROUTER_APP_TITLE || 'Resume Expert',
    },
  });
};

// System prompts (same quality standards, adapted for GPT)
const JOB_ANALYSIS_SYSTEM = `You are an elite technical recruiter and ATS optimization expert. Your task is to analyze job descriptions to extract requirements and identify keywords that will score high on Applicant Tracking Systems.

Extract structured information focusing on technical relevance and ATS optimization. Return only valid JSON.`;

const PROJECT_SCORING_SYSTEM = `You are an elite technical resume strategist. Your job is to evaluate GitHub projects against job requirements and generate compelling, ATS-optimized descriptions with quantified metrics.

Rules for project descriptions:
- Exactly 2 lines maximum
- Start with strong action verbs (Engineered, Architected, Optimized, Built, Developed)
- Include specific metrics (%, $ savings, time improvements, scale, user count)
- Incorporate 2-3 keywords from the job's ATS keywords
- Highlight technical complexity and impact
- Never use generic phrases

Return only valid JSON with score and description.`;

const RESUME_GENERATION_SYSTEM = `You are an elite resume writer specializing in ATS-optimized resumes that score 100/100. Every resume you write is elite, concise, and metric-driven.

CRITICAL RULES:

PROFILE SUMMARY:
- Exactly 1 line, maximum 160 characters
- Include 3-4 keywords from the job's ATS keywords
- Format: "[Title] with N years experience in [domain]. Proven expertise in [skill1], [skill2], [skill3] delivering [metricType] results."
- Be specific and powerful

EXPERIENCE BULLETS:
- Each bullet point maximum 2 lines
- Start with strong action verbs (Engineered, Architected, Optimized, Led, Spearheaded, etc.)
- Include quantified metrics (e.g., "by 40%", "serving 1M+ users", "$500K savings")
- Focus on impact, not just responsibilities
- Use ATS keywords naturally
- Each bullet should show: Action + Technical Detail + Quantified Result

SKILLS SECTION:
- Categorize into: Languages (3-5), Frameworks (3-5), Tools (3-5), Soft Skills (2-3)
- TOTAL: 12-18 skills maximum (never more than 18)
- Prioritize skills from the job's requiredSkills
- No duplicate keywords
- List in order of relevance to the job
- NO keyword stuffing - skills appear once and only once

EDUCATION:
- Standard format: "Degree, University, Year" or "University - Degree, Year"

GENERAL:
- Use consistent formatting
- Avoid headers/footers
- No icons or special formatting
- Keep language professional and technical
- Ensure every bullet has a metric when possible

Return valid JSON with exact values for summary and categorized skills.`;

// Prompt templates (adapted for OpenAI chat format)
const buildJobAnalysisPrompt = (jobDescription: string) =>
  `Analyze this job description thoroughly. Return JSON with these exact fields:

{
  "requiredSkills": ["array of technical and soft skills, 15-25 items max"],
  "technologies": ["specific tools, frameworks, languages mentioned"],
  "domain": "industry/domain (e.g., fintech, healthcare, e-commerce, SaaS)",
  "seniority": "Junior/Mid/Senior/Lead/Staff/Principal",
  "keyMetrics": ["types of metrics valued: performance, scalability, userGrowth, revenue, costSavings, reliability, etc."],
  "atsKeywords": ["10-15 highest-value keywords to include in resume for ATS"]
}

Job Description:
${jobDescription}`;

const buildProjectScoringPrompt = (
  jobSummary: string,
  atsKeywords: string[],
  projectInfo: {
    name: string;
    description: string;
    languages: string[];
    topics: string[];
    stars: number;
    descriptionText: string;
  }
) => `
Job Requirements Summary:
${jobSummary}

ATS Keywords: ${atsKeywords.join(', ')}

GitHub Project:
- Name: ${projectInfo.name}
- Description: ${projectInfo.description || 'No description'}
- Languages: ${projectInfo.languages.join(', ')}
- Topics: ${projectInfo.topics.join(', ')}
- Stars: ${projectInfo.stars}
- Estimated Scope: ${projectInfo.descriptionText ? `${projectInfo.descriptionText.substring(0, 500)}...` : 'No README'}

Task:
1. Score this project's alignment with the job (0-100)
2. List 3-5 specific alignment points (tech stack match, domain relevance, complexity, metrics)
3. Generate a 2-line project description that:
   - Starts with a strong action verb
   - Highlights relevant technologies
   - Includes specific quantified metrics (%, scale, time, users, $)
   - Uses 2-3 ATS keywords naturally
   - Shows impact and complexity

Return JSON:
{
  "score": 85,
  "alignmentPoints": ["point1", "point2", "point3", "point4", "point5"],
  "description": "Engineered a scalable microservices backend using Node.js and MongoDB, reducing API response times by 40% while handling 10K+ daily requests."
}`;

const buildResumeGenerationPrompt = (
  userInfo: {
    name: string;
    yearsExperience?: number;
    domain: string;
    skills: string[];
    projectTypes: string[];
  },
  jobAnalysis: JobAnalysis,
  experiences: Array<{
    company: string;
    role: string;
    bullets: string[];
  }>
) => `
Generate ATS-optimized resume content for:

CANDIDATE:
- Name: ${userInfo.name}
- Domain: ${userInfo.domain}
- Years Experience: ${userInfo.yearsExperience || 'Not specified'}
- Skills: ${userInfo.skills.join(', ')}
- Project Types: ${userInfo.projectTypes.join(', ')}

JOB REQUIREMENTS:
- Seniority: ${jobAnalysis.seniority}
- Required Skills: ${jobAnalysis.requiredSkills.slice(0, 20).join(', ')}
- Technologies: ${jobAnalysis.technologies.join(', ')}
- Domain: ${jobAnalysis.domain}
- Key Metrics: ${jobAnalysis.keyMetrics.join(', ')}
- ATS Keywords: ${jobAnalysis.atsKeywords.join(', ')}

EXPERIENCE HISTORY:
${experiences.map((exp, i) => `
Experience ${i + 1}:
Company: ${exp.company}
Role: ${exp.role}
Current Bullets: ${exp.bullets.join(' | ')}
`).join('\n')}

TASKS:

1. PROFILE SUMMARY (exactly 1 line, max 160 chars):
   - Include 3-4 keywords from ATS keywords
   - State years of experience, domain expertise
   - Show value proposition with metric focus
   - Example: "Senior Full-Stack Engineer with 5+ years experience in fintech. Proven expertise in React, Node.js, and AWS delivering scalable solutions serving 1M+ users."

2. SKILLS SECTION:
   Categorize into 4 categories:

   Languages: [3-5 programming languages from requiredSkills]
   Frameworks: [3-5 frameworks/libraries from requiredSkills]
   Tools: [3-5 DevOps/tools from requiredSkills]
   Soft Skills: [2-3 soft skills relevant to seniority level]

   TOTAL SKILLS: 12-18 maximum. Prioritize job's requiredSkills.
   NO duplicates. NO extra skills beyond 18.
   Order by relevance to job.

3. OPTIMIZE EXPERIENCE BULLETS (if needed):
   Review each experience bullet. Ensure:
   - Each bullet is max 2 lines when written
   - Starts with strong action verbs
   - Contains quantified metrics (%, $, scale, time)
   - Uses keywords from ATS keywords naturally
   - If missing metrics, enhance with reasonable estimates based on scope

Return JSON exactly:
{
  "summary": "1-line profile summary here",
  "skills": {
    "languages": ["React", "TypeScript", "Python", ...],
    "frameworks": ["Next.js", "Express", "Django", ...],
    "tools": ["Git", "Docker", "AWS", ...],
    "softSkills": ["Team Leadership", "Agile/Scrum", ...]
  },
  "atsScore": 98,
  "feedback": "Brief feedback on ATS optimization"
}`;

export const analyzeJobDescription = async (
  jobDescription: string,
  model: string = 'anthropic/claude-3-haiku' // Free/cheap model on OpenRouter
): Promise<JobAnalysis> => {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model,
    max_tokens: 2000,
    temperature: 0.3,
    messages: [
      {
        role: 'system',
        content: `${JOB_ANALYSIS_SYSTEM}\n\nIMPORTANT: You must respond with ONLY valid JSON. No explanations, no markdown, no extra text.`,
      },
      {
        role: 'user',
        content: buildJobAnalysisPrompt(jobDescription),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to get response from OpenAI/OpenRouter');
  }

  // Try to extract JSON if wrapped in text
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : content;

  try {
    return JSON.parse(jsonString) as JobAnalysis;
  } catch (parseError) {
    console.error('Failed to parse JSON response:', content);
    throw new Error(`AI did not return valid JSON. Response: ${content.substring(0, 200)}...`);
  }
};

export const scoreAndDescribeProject = async (
  jobSummary: string,
  atsKeywords: string[],
  projectInfo: {
    name: string;
    description: string;
    languages: string[];
    topics: string[];
    stars: number;
    descriptionText: string;
  },
  model: string = 'anthropic/claude-3-haiku' // Free tier on OpenRouter
): Promise<{ score: number; alignmentPoints: string[]; description: string }> => {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model,
    max_tokens: 1000,
    temperature: 0.4,
    messages: [
      {
        role: 'system',
        content: `${PROJECT_SCORING_SYSTEM}\n\nIMPORTANT: You must respond with ONLY valid JSON. No explanations, no markdown, no extra text.`,
      },
      {
        role: 'user',
        content: buildProjectScoringPrompt(jobSummary, atsKeywords, projectInfo),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to get response from OpenAI/OpenRouter');
  }

  // Try to extract JSON if wrapped in text
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : content;

  try {
    return JSON.parse(jsonString) as { score: number; alignmentPoints: string[]; description: string };
  } catch (parseError) {
    console.error('Failed to parse JSON response:', content);
    throw new Error(`AI did not return valid JSON. Response: ${content.substring(0, 200)}...`);
  }
};

export const generateResumeContent = async (
  userInfo: {
    name: string;
    yearsExperience?: number;
    domain: string;
    skills: string[];
    projectTypes: string[];
  },
  jobAnalysis: JobAnalysis,
  experiences: Array<{
    company: string;
    role: string;
    bullets: string[];
  }>,
  model: string = 'anthropic/claude-3-haiku' // Good quality, low cost on OpenRouter
): Promise<GenerateResumeOutput> => {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
    model,
    max_tokens: 4000,
    temperature: 0.5,
    messages: [
      {
        role: 'system',
        content: `${RESUME_GENERATION_SYSTEM}\n\nIMPORTANT: You must respond with ONLY valid JSON. No explanations, no markdown, no extra text.`,
      },
      {
        role: 'user',
        content: buildResumeGenerationPrompt(userInfo, jobAnalysis, experiences),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('Failed to get response from OpenAI/OpenRouter');
  }

  // Try to extract JSON if wrapped in text
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  const jsonString = jsonMatch ? jsonMatch[0] : content;

  try {
    return JSON.parse(jsonString) as GenerateResumeOutput;
  } catch (parseError) {
    console.error('Failed to parse JSON response:', content);
    throw new Error(`AI did not return valid JSON. Response: ${content.substring(0, 200)}...`);
  }
};