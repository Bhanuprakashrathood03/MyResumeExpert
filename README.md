# Resume Expert - AI-Powered ATS Elite Resume Generator

Generate elite, 100/100 ATS-scoring resumes tailored to specific job descriptions using AI. This app analyzes job requirements, fetches your GitHub projects, matches the best ones, and generates an optimized LaTeX resume with quantified metrics.

## Features

- **Job Analysis**: AI-powered extraction of required skills, technologies, domain, and ATS keywords
- **GitHub Integration**: Fetch your repositories and intelligently select the 2 best projects that align with the job
- **ATS Optimization**: Ensures keyword density is optimal (3-5%), balanced skill sections, proper structure
- **Elite Output**: Profile summary in 1 line, experience/project bullets in 2 lines with quantified metrics
- **LaTeX Generation**: Clean, professional, ATS-friendly LaTeX source ready for PDF compilation
- **No Keyword Stuffing**: Carefully balanced skills section (12-18 skills across 4 categories)

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + TypeScript + TailwindCSS
- **Backend**: Next.js API Routes (Node.js)
- **AI**: Anthropic Claude (Sonnet 4 & Haiku 3.5)
- **GitHub**: Octokit API client
- **Output**: LaTeX (requires external compilation to PDF)

## Prerequisites

- Node.js 18+ installed
- Anthropic API key (from https://console.anthropic.com)
- Optional: GitHub Personal Access Token (for higher rate limits/private repos)

## Quick Start

### 1. Clone and Install

```bash
cd resume-expert
npm install
```

### 2. Configure Environment Variables

Copy `.env.local.example` to `.env.local` and add your API keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxx-your-key-here
# Optional but recommended:
GITHUB_TOKEN=ghp_xxxxxx-your-github-token-here
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Use the App

1. **Paste Job Description**: Copy the full job posting and click "Analyze Job Description"
2. **Enter Personal Info**: Fill in your name, contact details, and optional LinkedIn/GitHub
3. **Add Work Experience**: Add 1-3 work experiences with quantified achievement bullets (2-3 per role)
4. **Fetch GitHub Projects**: Enter your GitHub username (and token if you have one)
5. **Review Matches**: AI selects and describes the top 2 projects that align with the job
6. **Generate Resume**: Get your ATS-optimized LaTeX source with an ATS score
7. **Download & Compile**: Save the `.tex` file and compile to PDF using Overleaf or local LaTeX

## Compiling LaTeX to PDF

The app generates clean LaTeX source. To convert to PDF:

### Option 1: Overleaf (Online - Easiest)
1. Go to [overleaf.com](https://www.overleaf.com)
2. Create a new project
3. Paste the generated LaTeX code
4. Click "Recompile" (Menu → Compiler → LaTeX)
5. Download PDF

### Option 2: Local LaTeX Installation

**MacOS:**
```bash
brew install --cask mactex
pdflatex resume.tex
```

**Ubuntu/Debian:**
```bash
sudo apt-get install texlive-latex-base texlive-latex-extra
pdflatex resume.tex
```

**Windows:**
Download and install MiKTeX from miktex.org, then run `pdflatex resume.tex` in Command Prompt.

### Option 3: VS Code (with LaTeX Workshop extension)
1. Install "LaTeX Workshop" extension
2. Open the `.tex` file
3. Click "Build LaTeX project" or press `Ctrl+Alt+B`

## How It Works

### Job Analysis
Claude parses the job description and identifies:
- Required skills (technical and soft skills)
- Specific technologies (frameworks, languages, tools)
- Industry domain (fintech, healthcare, SaaS, etc.)
- Seniority level
- Key metrics valued (performance, scalability, revenue, etc.)
- High-value ATS keywords

### GitHub Project Matching
1. **Fetch** all your public repositories (filter out forks, archived)
2. **Enrich** with languages, topics, stars, forks, size, update recency
3. **Score** using multi-factor algorithm:
   - Tech stack match (35%)
   - Domain relevance (30%)
   - Recency/activity (20%)
   - Complexity/scale (15%)
4. **Select** top 5 candidates
5. **AI Evaluation**: Claude reviews top candidates and generates project descriptions (2 lines max) with:
   - Action verb at start
   - Relevant technologies
   - Quantified metrics
   - 2-3 ATS keywords

### Resume Generation
Claude generates:
- **1-line profile summary** (max 160 chars) with keywords
- **Optimized experience bullets** (2 lines each) with metrics
- **Balanced skills section** (12-18 total, categorized: Languages, Frameworks, Tools, Soft Skills)
- **ATS feedback** explaining the score

### ATS Optimization
The built-in optimizer checks:
- Keyword density (3-5% optimal)
- Section presence (Summary, Experience, Projects, Skills, Education)
- Resume length (1-2 pages)
- Skills balance (no stuffing)
- Quantified metrics usage
- Action verbs at bullet starts

Target score: 95-100/100 (Elite tier)

## Project Structure

```
/resume-expert
├── app/
│   ├── api/
│   │   ├── analyze-jd/     # Claude job analysis
│   │   ├── github/         # GitHub repo fetch
│   │   ├── match-projects/ # Project selection & description
│   │   └── generate-resume/# LaTeX generation
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # Main app component
├── components/
│   ├── JobDescriptionInput.tsx
│   ├── PersonalInfoForm.tsx
│   ├── ExperienceForm.tsx
│   ├── GitHubInput.tsx
│   ├── ProjectMatchList.tsx
│   └── ResumePreview.tsx
├── lib/
│   ├── claude.ts           # Claude API integration
│   ├── github.ts           # GitHub API client
│   ├── matcher.ts          # Project matching algorithm
│   ├── latex-template.ts   # LaTeX template engine
│   ├── ats-optimizer.ts    # ATS scoring & validation
│   └── types.ts            # TypeScript interfaces
├── .env.local.example
├── .gitignore
├── next.config.js
├── package.json
└── tsconfig.json
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Your Anthropic Claude API key |
| `GITHUB_TOKEN` | No | GitHub personal access token (recommended for higher rate limits) |

### Getting an Anthropic API Key
1. Go to [Anthropic Console](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to API Keys settings
4. Create a new key
5. Add it to `.env.local`

### Getting a GitHub Token (Optional but Recommended)
1. Go to [GitHub Settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token" → "Fine-grained tokens"
3. Select account access: Only select repositories you want to analyze
4. Permissions needed: `public_repo` (for public repos) or `repo` (for private)
5. Generate and copy the token
6. Add it to `.env.local` as `GITHUB_TOKEN`

## API Usage & Costs

- **Job Analysis**: Uses Claude Sonnet 4 (~$0.03 per analysis)
- **Project Matching**: Uses Claude Haiku 3.5 (~$0.002 per project description)
- **Resume Generation**: Uses Claude Sonnet 4 (~$0.06 per generation)
- **Total Cost per Resume**: ~$0.15 - $0.25 (varies by number of projects)

**Note**: Actual costs depend on Anthropic pricing. Using your own API key means you pay for usage.

## Troubleshooting

### "ANTHROPIC_API_KEY is not configured"
- Ensure `.env.local` exists in the project root
- Verify the key is set correctly: `ANTHROPIC_API_KEY=sk-ant-...`
- Restart the dev server after changing `.env.local`

### "GitHub API rate limit exceeded"
- Add a `GITHUB_TOKEN` to `.env.local` (increases limit from 60 to 5,000 requests/hour)
- Or wait for rate limit to reset (60 requests/hour without token)

### "No matching projects found"
- Ensure your GitHub repos have clear descriptions and languages
- Check if your repositories are too small or inactive
- Try adding more repositories with relevant technologies

### LaTeX Compilation Errors
- The generated LaTeX should be valid ATS-friendly code
- If compilation fails, check that your LaTeX distribution is up-to-date
- Common issues: missing LaTeX packages (moderncv, graphicx, enumitem)
- Install full TeX Live or MikTeX for complete package support

## Development

### Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm start         # Start production server
npm run lint      # Run ESLint
```

### Adding New Features

The codebase is structured with clear separation:
- **API Routes**: `/app/api/*/route.ts`
- **Components**: `/components/*.tsx`
- **Logic**: `/lib/*.ts`

Follow the existing patterns for new features.

## Future Enhancements

- [ ] Multiple LaTeX templates (modern, classic, executive)
- [ ] PDF preview in browser (using `pdf.js` or server-side compilation)
- [ ] JD auto-refinement to improve keyword density
- [ ] Resume versioning and A/B testing
- [ ] Export to Word/DOCX format
- [ ] User authentication and saved resumes
- [ ] Bulk processing for multiple job applications
- [ ] Chrome extension for one-click resume generation
- [ ] Integration with LinkedIn profile import

## Contributing

This is a personal project but improvements are welcome! Open issues or PRs with:
- Bug fixes
- Better ATS optimization algorithms
- Enhanced matching logic
- Additional LaTeX templates
- UI/UX improvements

Please ensure:
- TypeScript types are correct
- Error handling is robust
- No API keys are committed
- Code follows existing style

## License

MIT - Feel free to use, modify, and distribute as needed.

## Disclaimer

This tool uses AI to generate resume content. While it aims for 100/100 ATS scores, actual results depend on the job description quality and your input data. Always review generated content for accuracy and authenticity before submitting applications. AI-generated content should complement, not replace, your professional judgment.

## Support

If you encounter issues:
1. Check your API keys are valid and have credits
2. Review console logs in browser and terminal
3. Ensure GitHub username is correct and repos are public
4. Open an issue with details (JD example, error message, steps to reproduce)

---

Generated with ❤️ for elite job seekers
