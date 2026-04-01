import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENAI_API_KEY;

  // Don't expose the full key in response, just check if it exists and its length
  const keyInfo = apiKey
    ? {
        exists: true,
        length: apiKey.length,
        startsWithSk: apiKey.startsWith('sk-'),
        preview: `${apiKey.substring(0, 10)}...`,
      }
    : { exists: false };

  return NextResponse.json({
    success: true,
    message: 'Environment variable check',
    data: {
      OPENAI_API_KEY: keyInfo,
      nodeEnv: process.env.NODE_ENV,
    },
  });
}