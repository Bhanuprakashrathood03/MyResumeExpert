'use client';

import { useState } from 'react';

interface GitHubInputProps {
  onFetchRepos: (username: string, token?: string) => Promise<void>;
  isLoading: boolean;
  reposCount?: number;
}

export default function GitHubInput({ onFetchRepos, isLoading, reposCount }: GitHubInputProps) {
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      await onFetchRepos(username.trim(), token.trim() || undefined);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">4. GitHub Projects</h2>
      <p className="text-sm text-gray-600 mb-4">
        Enter your GitHub username to fetch your repositories. We&apos;ll analyze and select the 2 best projects that align with the job.
        {reposCount !== undefined && (
          <span className="ml-2 text-blue-600 font-medium">
            ({reposCount} repositories loaded)
          </span>
        )}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Username *
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., octocat"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Token (optional)
            </label>
            <input
              type="password"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ghp_... for higher rate limits"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Personal token avoids rate limits and allows fetching private repos
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !username.trim()}
          className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Fetching Repositories...
            </span>
          ) : (
            'Fetch Repositories'
          )}
        </button>
      </form>

      {isLoading && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Fetching your repositories from GitHub... This may take a few seconds.
          </p>
        </div>
      )}
    </div>
  );
}