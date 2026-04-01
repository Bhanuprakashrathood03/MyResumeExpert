'use client';

import { useState, useEffect } from 'react';
import JobDescriptionInput from '@/components/JobDescriptionInput';
import PersonalInfoForm from '@/components/PersonalInfoForm';
import ExperienceForm from '@/components/ExperienceForm';
import GitHubInput from '@/components/GitHubInput';
import ProjectMatchList from '@/components/ProjectMatchList';
import ResumePreview from '@/components/ResumePreview';
import {
  PersonalInfo,
  Experience,
  JobAnalysis,
  Repository,
  ProjectMatch,
} from '@/lib/types';

const INITIAL_PERSONAL_INFO: PersonalInfo = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  linkedIn: '',
  github: '',
  website: '',
};

enum Step {
  JOB_DESCRIPTION = 1,
  PERSONAL_INFO = 2,
  EXPERIENCE = 3,
  GITHUB = 4,
  PROJECTS = 5,
  PREVIEW = 6,
}

const REQUIRED_KEYS = ['ANTHROPIC_API_KEY'];

export default function Home() {
  const [step, setStep] = useState<Step>(Step.JOB_DESCRIPTION);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  // Check for required API keys on mount
  useEffect(() => {
    const missing = REQUIRED_KEYS.filter(key => !process.env[key]);
    if (missing.length > 0) {
      setApiKeyMissing(true);
    }
  }, []);

  // Data states
  const [jobDescription, setJobDescription] = useState('');
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>(INITIAL_PERSONAL_INFO);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [matchedProjects, setMatchedProjects] = useState<ProjectMatch[]>([]);
  const [generatedLatex, setGeneratedLatex] = useState<string>('');
  const [atsScore, setAtsScore] = useState<number>(0);
  const [feedback, setFeedback] = useState<string[]>([]);

  // Loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [isMatching, setIsMatching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Step 1: Analyze Job Description
  const handleAnalyzeJob = async (description: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobDescription: description }),
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.error || 'Failed to analyze job description');
        return;
      }

      setJobAnalysis(data.data);
      setStep(Step.PERSONAL_INFO);
    } catch (error) {
      alert('An error occurred while analyzing the job description');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Step 2: Personal info - just forward to experience
  const handlePersonalInfoSubmit = () => {
    setStep(Step.EXPERIENCE);
  };

  // Step 3: Experience - just forward to GitHub
  const handleExperienceSubmit = () => {
    if (experiences.length === 0) {
      alert('Please add at least one work experience');
      return;
    }
    setStep(Step.GITHUB);
  };

  // Step 4: Fetch GitHub Repos
  const handleFetchRepos = async (username: string, token?: string) => {
    setIsFetchingRepos(true);
    try {
      const response = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, token }),
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.error || 'Failed to fetch repositories');
        return;
      }

      setRepos(data.data);
      setStep(Step.PROJECTS);
    } catch (error) {
      alert('An error occurred while fetching repositories');
      console.error(error);
    } finally {
      setIsFetchingRepos(false);
    }
  };

  // Step 5: Match Projects
  const handleMatchProjects = async () => {
    if (!jobAnalysis || !personalInfo) {
      alert('Missing required data. Please complete previous steps.');
      return;
    }

    setIsMatching(true);
    try {
      const response = await fetch('/api/match-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repos,
          jobAnalysis,
          userInfo: {
            personalInfo,
            experiences,
          },
        }),
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.error || 'Failed to match projects');
        return;
      }

      setMatchedProjects(data.data);
      setStep(Step.PREVIEW);
    } catch (error) {
      alert('An error occurred while matching projects');
      console.error(error);
    } finally {
      setIsMatching(false);
    }
  };

  // Step 6: Generate Resume
  const handleGenerateResume = async () => {
    if (!jobAnalysis || !personalInfo || experiences.length === 0 || matchedProjects.length === 0) {
      alert('Missing required data. Please complete all steps.');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalInfo,
          experiences,
          matchedProjects,
          jobAnalysis,
          education: {
            degree: '',
            university: '',
            graduationYear: '',
          },
        }),
      });

      const data = await response.json();
      if (!data.success) {
        alert(data.error || 'Failed to generate resume');
        return;
      }

      setGeneratedLatex(data.data.latex);
      setAtsScore(data.data.atsScore);
      setFeedback(data.data.feedback);
      setStep(Step.PREVIEW);
    } catch (error) {
      alert('An error occurred while generating the resume');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset to start over
  const handleReset = () => {
    setStep(Step.JOB_DESCRIPTION);
    setJobDescription('');
    setJobAnalysis(null);
    setPersonalInfo(INITIAL_PERSONAL_INFO);
    setExperiences([]);
    setRepos([]);
    setMatchedProjects([]);
    setGeneratedLatex('');
    setAtsScore(0);
    setFeedback([]);
  };

  // Progress indicator
  const steps = [
    { num: 1, label: 'Job Description', current: step >= Step.JOB_DESCRIPTION, done: step > Step.JOB_DESCRIPTION },
    { num: 2, label: 'Personal Info', current: step === Step.PERSONAL_INFO, done: step > Step.PERSONAL_INFO },
    { num: 3, label: 'Experience', current: step === Step.EXPERIENCE, done: step > Step.EXPERIENCE },
    { num: 4, label: 'GitHub', current: step === Step.GITHUB, done: step > Step.GITHUB },
    { num: 5, label: 'Match Projects', current: step === Step.PROJECTS, done: step > Step.PROJECTS },
    { num: 6, label: 'Generate Resume', current: step === Step.PREVIEW, done: false },
  ];

  if (apiKeyMissing) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h1 className="text-2xl font-bold text-red-800 mb-4">Configuration Required</h1>
            <p className="text-red-700 mb-4">
              This application requires the <code className="bg-red-100 px-2 py-1 rounded font-mono">ANTHROPIC_API_KEY</code> environment variable to be set.
            </p>
            <div className="bg-white rounded p-4 border border-red-200">
              <p className="text-sm text-gray-700 mb-3">
                To set up the application:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Get an API key from the <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Anthropic Console</a></li>
                <li>Create a <code className="bg-gray-100 px-2 py-1 rounded font-mono">.env.local</code> file in the project root</li>
                <li>Add this line: <code className="block bg-gray-100 p-2 mt-1 rounded font-mono text-xs">ANTHROPIC_API_KEY=your-key-here</code></li>
                <li>(Optional) Add <code className="bg-gray-100 px-2 py-1 rounded font-mono">GITHUB_TOKEN</code> for higher rate limits</li>
                <li>Restart the Next.js development server</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Resume Expert
          </h1>
          <p className="text-gray-600">
            AI-Powered ATS-Elite Resume Generator &lt;100/100 Score&gt;
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute left-0 right-0 top-5 h-1 bg-gray-200 -z-10" />
            <div
              className="absolute left-0 top-5 h-1 bg-blue-600 -z-10 transition-all"
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            />

            {steps.map((stepItem) => (
              <div key={stepItem.num} className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    stepItem.done
                      ? 'bg-green-600 text-white'
                      : stepItem.current
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {stepItem.done ? '✓' : stepItem.num}
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center ${
                    stepItem.current || stepItem.done ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {stepItem.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Job Description */}
        {step === Step.JOB_DESCRIPTION && (
          <JobDescriptionInput
            onAnalyze={handleAnalyzeJob}
            isLoading={isAnalyzing}
            analysisResult={jobAnalysis || undefined}
          />
        )}

        {/* Step 2: Personal Info */}
        {step === Step.PERSONAL_INFO && (
          <div>
            <PersonalInfoForm
              personalInfo={personalInfo}
              onChange={setPersonalInfo}
            />

            <div className="flex justify-between">
              <button
                onClick={() => setStep(Step.JOB_DESCRIPTION)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Back
              </button>
              <button
                onClick={handlePersonalInfoSubmit}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue to Experience →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Experience */}
        {step === Step.EXPERIENCE && (
          <div>
            <ExperienceForm experiences={experiences} onChange={setExperiences} />

            <div className="flex justify-between">
              <button
                onClick={() => setStep(Step.PERSONAL_INFO)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Back
              </button>
              <button
                onClick={handleExperienceSubmit}
                disabled={experiences.length === 0}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue to GitHub →
              </button>
            </div>
          </div>
        )}

        {/* Step 4: GitHub */}
        {step === Step.GITHUB && (
          <div>
            <GitHubInput
              onFetchRepos={handleFetchRepos}
              isLoading={isFetchingRepos}
              reposCount={repos.length}
            />

            {repos.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">
                  ✓ Successfully fetched {repos.length} repositories
                </p>
                <p className="text-green-700 text-sm mt-1">
                  AI will analyze and select the 2 best projects that align with the job requirements.
                </p>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep(Step.EXPERIENCE)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(Step.PROJECTS)}
                disabled={repos.length === 0}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue to Match Projects →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Project Matching */}
        {step === Step.PROJECTS && (
          <div>
            <ProjectMatchList
              matches={matchedProjects}
              onGenerate={handleGenerateResume}
              isLoading={isGenerating}
            />

            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setStep(Step.GITHUB)}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                ← Back
              </button>
              {matchedProjects.length === 0 && (
                <button
                  onClick={handleMatchProjects}
                  disabled={isMatching || repos.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isMatching ? (
                    <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Matching Projects...
                    </span>
                  ) : (
                    'Match Projects'
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 6: Resume Preview */}
        {step === Step.PREVIEW && generatedLatex && (
          <ResumePreview
            latex={generatedLatex}
            atsScore={atsScore}
            feedback={feedback}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}
