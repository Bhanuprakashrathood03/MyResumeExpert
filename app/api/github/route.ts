import { NextRequest, NextResponse } from 'next/server';
import { fetchUserRepos } from '@/lib/github';
import { z } from 'zod';

const schema = z.object({
  username: z.string().min(1, 'Username is required'),
  token: z.string().optional(),
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

    const { username, token } = validation.data;

    // Fetch repos from GitHub
    const repos = await fetchUserRepos(username, token);

    // Sort by updated date (most recent first)
    repos.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return NextResponse.json({
      success: true,
      data: repos,
    });
  } catch (error: any) {
    console.error('Error in /api/github:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch GitHub repositories',
      },
      { status: 500 }
    );
  }
}