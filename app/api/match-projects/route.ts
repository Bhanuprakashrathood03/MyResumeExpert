import { NextRequest, NextResponse } from 'next/server';
import { matchProjects } from '@/lib/matcher';
import { z } from 'zod';

const repositorySchema = z.object({
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
});

const userInfoSchema = z.object({
  personalInfo: z.object({
    fullName: z.string(),
    github: z.string().optional(),
  }),
  experiences: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
    })
  ),
});

const matchProjectsSchema = z.object({
  repos: z.array(repositorySchema),
  jobAnalysis: z.object({
    requiredSkills: z.array(z.string()),
    technologies: z.array(z.string()),
    domain: z.string(),
    seniority: z.string(),
    keyMetrics: z.array(z.string()),
    atsKeywords: z.array(z.string()),
  }),
  userInfo: userInfoSchema,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = matchProjectsSchema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error.issues?.[0]?.message || 'Invalid input';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    const { repos, jobAnalysis, userInfo } = validation.data;

    if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OPENROUTER_API_KEY or OPENAI_API_KEY is not configured on the server' },
        { status: 500 }
      );
    }

    if (repos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No repositories provided for matching' },
        { status: 400 }
      );
    }

    // Match projects
    const matches = await matchProjects(repos, jobAnalysis, userInfo);

    if (matches.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No matching projects found. Try adding more repositories or adjusting the job description.' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      data: matches,
    });
  } catch (error: any) {
    console.error('Error in /api/match-projects:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to match projects',
      },
      { status: 500 }
    );
  }
}