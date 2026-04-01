'use client';

import { ProjectMatch } from '@/lib/types';

interface ProjectMatchListProps {
  matches: ProjectMatch[];
  onGenerate: () => void;
  isLoading: boolean;
}

export default function ProjectMatchList({ matches, onGenerate, isLoading }: ProjectMatchListProps) {
  if (matches.length === 0) {
    return null;
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-300';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match';
    if (score >= 60) return 'Good Match';
    return 'Fair Match';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">5. Matched Projects</h2>
      <p className="text-sm text-gray-600 mb-4">
        We&apos;ve identified these 2 projects as the best fit for the job. AI has generated
        optimized, ATS-friendly descriptions with quantified metrics.
      </p>

      <div className="space-y-6">
        {matches.map((match, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {match.repo.name}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${getScoreColor(match.matchScore)}`}
                  >
                    {match.matchScore}% - {getScoreLabel(match.matchScore)}
                  </span>
                  <a
                    href={match.repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                    View on GitHub
                  </a>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  ⭐ {match.repo.stars}
                  <span>🍴 {match.repo.forks}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Updated: {new Date(match.repo.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">AI-Generated Description:</h4>
              <div className="p-4 bg-white border border-gray-200 rounded-lg">
                <p className="text-gray-800 leading-relaxed">
                  {match.generatedDescription}
                </p>
              </div>
            </div>

            {match.alignmentPoints.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Alignment Points:</h4>
                <ul className="space-y-1">
                  {match.alignmentPoints.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {match.repo.languages.slice(0, 4).map((lang) => (
                <span
                  key={lang}
                  className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded"
                >
                  {lang}
                </span>
              ))}
              {match.repo.topics.slice(0, 3).map((topic) => (
                <span
                  key={topic}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-blue-900">
              Ready to generate your elite ATS-optimized resume
            </p>
            <p className="text-sm text-blue-800 mt-1">
              All selected projects match the job requirements. Click the button below to generate your LaTeX resume.
            </p>
          </div>
          <button
            onClick={onGenerate}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </span>
            ) : (
              'Generate Resume'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}