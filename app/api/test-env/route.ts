import { NextResponse } from 'next/server';

export async function GET() {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const apiKey = openrouterKey || openaiKey;

  // Don't expose the full key in response, just check if it exists and its length
  const keyInfo = apiKey
    ? {
        exists: true,
        length: apiKey.length,
        startsWithSk: apiKey.startsWith('sk-'),
        preview: `${apiKey.substring(0, 10)}...`,
        source: openrouterKey ? 'OPENROUTER_API_KEY' : 'OPENAI_API_KEY',
      }
    : { exists: false };

  return NextResponse.json({
    success: true,
    message: 'Environment variable check',
    data: {
      OPENROUTER_API_KEY: openrouterKey
        ? {
            exists: true,
            length: openrouterKey.length,
            preview: `${openrouterKey.substring(0, 10)}...`,
          }
        : { exists: false },
      OPENAI_API_KEY: openaiKey
        ? {
            exists: true,
            length: openaiKey.length,
            preview: `${openaiKey.substring(0, 10)}...`,
          }
        : { exists: false },
      nodeEnv: process.env.NODE_ENV,
    },
  });
}