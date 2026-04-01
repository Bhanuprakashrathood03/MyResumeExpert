'use client';

import { useState } from 'react';

interface JobDescriptionInputProps {
  onAnalyze: (jobDescription: string) => Promise<void>;
  isLoading: boolean;
  analysisResult?: any;
}

export default function JobDescriptionInput({ onAnalyze, isLoading, analysisResult }: JobDescriptionInputProps) {
  const [jobDescription, setJobDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jobDescription.trim()) {
      await onAnalyze(jobDescription);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">1. Job Description</h2>
      <p className="text-sm text-gray-600 mb-4">
        Paste the job description below. Our AI will analyze it to identify required skills, keywords, and metrics.
      </p>

      <form onSubmit={handleSubmit}>
        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-sans text-sm"
          placeholder="Paste the full job description here..."
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          required
        />

        <div className="mt-4 flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading || !jobDescription.trim()}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              'Analyze Job Description'
            )}
          </button>

          {analysisResult && (
            <div className="text-sm text-green-600 font-medium">
              ✓ Analysis complete
            </div>
          )}
        </div>
      </form>

      {analysisResult && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
          <h3 className="font-semibold text-green-800 mb-2">Analysis Complete</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Domain:</span>
              <p className="text-gray-600">{analysisResult.domain}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Seniority:</span>
              <p className="text-gray-600">{analysisResult.seniority}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Required Skills:</span>
              <p className="text-gray-600">{analysisResult.requiredSkills.length} identified</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">ATS Keywords:</span>
              <p className="text-gray-600">{analysisResult.atsKeywords.length} keywords</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}