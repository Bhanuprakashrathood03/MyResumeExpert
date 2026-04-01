import { NextRequest, NextResponse } from 'next/server';
import { analyzeJobDescription } from '@/lib/openai';
import { z } from 'zod';

const schema = z.object({
  jobDescription: z.string().min(10, 'Job description must be at least 10 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = schema.safeParse(body);
    if (!validation.success) {
      const errorMessage = validation.error.issues?.[0]?.message || 'Invalid input';
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 }
      );
    }

    const { jobDescription } = validation.data;

    if (!process.env.OPENROUTER_API_KEY && !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OPENROUTER_API_KEY or OPENAI_API_KEY is not configured on the server' },
        { status: 500 }
      );
    }

    // Analyze with Claude
    const analysis = await analyzeJobDescription(jobDescription);

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    console.error('Error in /api/analyze-jd:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze job description',
      },
      { status: 500 }
    );
  }
}