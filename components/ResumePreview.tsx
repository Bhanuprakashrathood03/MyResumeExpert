'use client';

import { useState } from 'react';

interface ResumePreviewProps {
  latex: string;
  atsScore: number;
  feedback: string[];
  onReset: () => void;
}

export default function ResumePreview({ latex, atsScore, feedback, onReset }: ResumePreviewProps) {
  const [copied, setCopied] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100 border-green-300';
    if (score >= 75) return 'text-blue-600 bg-blue-100 border-blue-300';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 95) return 'Elite (100/100 ATS)';
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(latex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([latex], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.tex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">6. Generated Resume</h2>
          <p className="text-sm text-gray-600 mt-1">
            Your elite ATS-optimized resume has been generated. Review the LaTeX source below.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg border ${getScoreColor(atsScore)}`}>
            <div className="text-2xl font-bold">{atsScore}/100</div>
            <div className="text-xs font-medium uppercase">{getScoreLabel(atsScore)}</div>
          </div>
        </div>
      </div>

      {/* Feedback section */}
      {feedback.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">ATS Optimization Feedback:</h4>
          <ul className="space-y-1">
            {feedback.slice(0, 5).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="text-blue-600 mt-0.5">→</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* LaTeX preview */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800">LaTeX Source</h3>
          <div className="flex gap-2">
            <button
              onClick={onReset}
              className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors border border-gray-300"
            >
              Start Over
            </button>
            <button
              onClick={handleCopyToClipboard}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors border ${
                copied
                  ? 'bg-green-600 text-white border-green-700'
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200 border-gray-300'
              }`}
            >
              {copied ? '✓ Copied!' : 'Copy LaTeX'}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors border border-blue-700"
            >
              Download .tex
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm leading-relaxed max-h-96 overflow-y-auto">
            <code>{latex}</code>
          </pre>
          <div className="absolute top-2 right-2 text-xs text-gray-400 font-mono">
            {latex.length} characters
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-semibold text-yellow-900 mb-2">How to Compile to PDF</h4>
        <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-800">
          <li>
            <strong>Save</strong> the LaTeX source using the &quot;Download .tex&quot; button above
          </li>
          <li>
            <strong>Compile</strong> using any of these methods:
            <ul className="list-disc list-inside ml-6 mt-1 space-y-1 text-yellow-800">
              <li>
                <strong>Online</strong>: Upload to{' '}
                <a href="https://www.overleaf.com" target="_blank" rel="noopener noreferrer" className="underline">
                  Overleaf
                </a>{' '}
                and click &quot;Recompile&quot;
              </li>
              <li>
                <strong>Local</strong>: Install LaTeX (TeX Live, MiKTeX) and run:{' '}
                <code className="bg-yellow-100 px-2 py-0.5 rounded font-mono">pdflatex resume.tex</code>
              </li>
              <li>
                <strong>VS Code</strong>: Use the LaTeX Workshop extension
              </li>
            </ul>
          </li>
          <li>
            <strong>Review</strong> the compiled PDF. The ATS score of {atsScore}/100 indicates excellent parser compatibility.
          </li>
        </ol>
      </div>
    </div>
  );
}