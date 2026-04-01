import { NextRequest, NextResponse } from 'next/server';
import { generateResumeContent } from '@/lib/claude';
import { generateLaTeX, validateLaTeX } from '@/lib/latex-template';
import { optimizeForATS } from '@/lib/ats-optimizer';
import { z } from 'zod';

const experienceSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string(),
  bullets: z.array(z.string()),
});

const projectMatchSchema = z.object({
  repo: z.object({
    id: z.number(),
    name: z.string(),
    fullName: z.string(),
    description: z.string().nullable(),
    languages: z.array(z.string()),
    topics: z.array(z.string()),
    stars: z.number(),
    forks: z.number(),
    createdAt: z.string(),
    updatedAt: z.string(),
    size: z.number(),
    isFork: z.boolean(),
    isArchived: z.boolean(),
    url: z.string(),
  }),
  matchScore: z.number(),
  alignmentPoints: z.array(z.string()),
  generatedDescription: z.string(),
});

const personalInfoSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedIn: z.string().optional(),
  github: z.string().optional(),
  website: z.string().optional(),
});

const educationSchema = z.object({
  degree: z.string(),
  university: z.string(),
  graduationYear: z.string(),
  gpa: z.string().optional(),
});

const generateResumeSchema = z.object({
  personalInfo: personalInfoSchema,
  experiences: z.array(experienceSchema),
  matchedProjects: z.array(projectMatchSchema),
  jobAnalysis: z.object({
    requiredSkills: z.array(z.string()),
    technologies: z.array(z.string()),
    domain: z.string(),
    seniority: z.string(),
    keyMetrics: z.array(z.string()),
    atsKeywords: z.array(z.string()),
  }),
  education: educationSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = generateResumeSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error.issues?.[0]?.message || 'Invalid input';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    const { personalInfo, experiences, matchedProjects, jobAnalysis, education } = validation.data;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'ANTHROPIC_API_KEY is not configured on the server' },
        { status: 500 }
      );
    }

    // Collect all skills from projects and experiences for context
    const allSkills = [
      ...jobAnalysis.requiredSkills,
      ...matchedProjects.flatMap(p => p.repo.languages),
      ...matchedProjects.flatMap(p => p.repo.topics),
    ];
    const uniqueSkills = [...new Set(allSkills.map(s => s.toLowerCase()))];

    // Estimate years of experience
    const yearsExperience = experiences.length * 2; // Rough estimate

    // Generate resume content with Claude
    const generatedContent = await generateResumeContent(
      {
        name: personalInfo.fullName,
        yearsExperience,
        domain: jobAnalysis.domain,
        skills: uniqueSkills,
        projectTypes: matchedProjects.map(p => p.repo.name),
      },
      jobAnalysis,
      experiences.map(e => ({
        company: e.company,
        role: e.role,
        bullets: e.bullets,
      }))
    );

    // Build skills structure from generated content
    const skills = {
      languages: generatedContent.skills.languages,
      frameworks: generatedContent.skills.frameworks,
      tools: generatedContent.skills.tools,
      softSkills: generatedContent.skills.softSkills,
    };

    // Enhance experience bullets with metrics if missing
    const enhancedExperiences = experiences.map(exp => ({
      ...exp,
      bullets: exp.bullets.map(bullet => {
        // If bullet lacks metrics, keep as is (Claude already enhanced)
        return bullet;
      }),
    }));

    // Assemble resume data
    const resumeData = {
      personalInfo,
      summary: generatedContent.summary,
      experiences: enhancedExperiences,
      matchedProjects,
      skills,
      education: education || {
        degree: '',
        university: '',
        graduationYear: '',
      },
    };

    // Generate LaTeX
    let latex = generateLaTeX(resumeData);

    // Validate LaTeX
    const latexValidation = validateLaTeX(latex);
    if (!latexValidation.valid) {
      console.warn('LaTeX validation issues:', latexValidation.errors);
    }

    // Optimize for ATS and get score
    const atsResult = optimizeForATS(latex, jobAnalysis.atsKeywords, skills);

    // If score is too low, we could try to regenerate, but for now just report
    if (atsResult.score < 80) {
      console.warn(`Low ATS score: ${atsResult.score}. Issues: ${atsResult.issues.join(', ')}`);
    }

    return NextResponse.json({
      success: true,
      data: {
        latex,
        atsScore: atsResult.score,
        feedback: atsResult.feedback,
        issues: atsResult.issues,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/generate-resume:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate resume',
      },
      { status: 500 }
    );
  }
}