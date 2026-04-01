// User personal information
export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedIn?: string;
  github?: string;
  website?: string;
}

// Work experience entry
export interface Experience {
  id: string;
  company: string;
  role: string;
  startDate: string; // MM/YYYY
  endDate: string; // MM/YYYY or "Present"
  location: string;
  bullets: string[]; // 2-3 bullet points, each max 2 lines
}

// GitHub repository data
export interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  languages: string[];
  topics: string[];
  stars: number;
  forks: number;
  createdAt: string;
  updatedAt: string;
  readme?: string;
  size: number;
  isFork: boolean;
  isArchived: boolean;
  url: string;
}

// Project match result
export interface ProjectMatch {
  repo: Repository;
  matchScore: number;
  alignmentPoints: string[];
  generatedDescription: string; // 2-line ATS-optimized description
}

// Job analysis from Claude
export interface JobAnalysis {
  requiredSkills: string[];
  technologies: string[];
  domain: string;
  seniority: string;
  keyMetrics: string[];
  atsKeywords: string[];
}

// Resume data structure
export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string; // 1-line profile summary
  experiences: Experience[];
  matchedProjects: ProjectMatch[];
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    softSkills: string[];
  };
  education: {
    degree: string;
    university: string;
    graduationYear: string;
    gpa?: string;
  };
}

// AI Response structures
export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GenerateResumeOutput {
  summary: string;
  skills: {
    languages: string[];
    frameworks: string[];
    tools: string[];
    softSkills: string[];
  };
  atsScore: number;
  feedback: string;
}

export interface ProjectScore {
  repo: Repository;
  score: number;
  alignmentPoints: string[];
}

// API Request/Response types
export interface AnalyzeJdRequest {
  jobDescription: string;
}

export interface AnalyzeJdResponse {
  success: boolean;
  data?: JobAnalysis;
  error?: string;
}

export interface GitHubFetchRequest {
  username: string;
  token?: string;
}

export interface GitHubFetchResponse {
  success: boolean;
  repos?: Repository[];
  error?: string;
}

export interface MatchProjectsRequest {
  repos: Repository[];
  jobAnalysis: JobAnalysis;
  userInfo: {
    personalInfo: PersonalInfo;
    experiences: Experience[];
  };
}

export interface MatchProjectsResponse {
  success: boolean;
  matches?: ProjectMatch[];
  error?: string;
}

export interface GenerateResumeRequest {
  personalInfo: PersonalInfo;
  experiences: Experience[];
  matchedProjects: ProjectMatch[];
  jobAnalysis: JobAnalysis;
}

export interface GenerateResumeResponse {
  success: boolean;
  latex?: string;
  atsScore?: number;
  feedback?: string;
  error?: string;
}