import { Octokit } from 'octokit';
import { Repository } from './types';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export interface GitHubFetchOptions {
  username: string;
  token?: string;
}

export const fetchUserRepos = async (
  username: string,
  token?: string
): Promise<Repository[]> => {
  const client = token ? new Octokit({ auth: token }) : octokit;

  try {
    // Fetch all repositories (excluding forks by default initially)
    const response = await client.request('GET /users/{username}/repos', {
      username,
      type: 'owner', // only repos owned by user
      sort: 'updated',
      direction: 'desc',
      per_page: 100,
    });

    const repos = response.data as any[];

    // Enrich each repo with additional details
    const enrichedRepos: Repository[] = await Promise.all(
      repos
        .filter((repo) => !repo.fork && !repo.archived) // filter forks and archived
        .map(async (repo) => {
          try {
            // Get languages for this repo
            const languagesRes = await client.request('GET /repos/{owner}/{repo}/languages', {
              owner: username,
              repo: repo.name,
            });

            // Get topics
            const topicsRes = await client.request('GET /repos/{owner}/{repo}/topics', {
              owner: username,
              repo: repo.name,
              headers: {
                'X-GitHub-Api-Version': '2022-11-28',
                Accept: 'application/vnd.github+json',
              },
            });

            return {
              id: repo.id,
              name: repo.name,
              fullName: repo.full_name,
              description: repo.description,
              languages: Object.keys(languagesRes.data),
              topics: topicsRes.data.names,
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              createdAt: repo.created_at,
              updatedAt: repo.updated_at,
              size: repo.size,
              isFork: repo.fork,
              isArchived: repo.archived,
              url: repo.html_url,
              readme: undefined, // fetch on demand if needed
            };
          } catch (error) {
            console.error(`Error enriching repo ${repo.name}:`, error);
            // Return basic info if enrichment fails
            return {
              id: repo.id,
              name: repo.name,
              fullName: repo.full_name,
              description: repo.description,
              languages: [],
              topics: [],
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              createdAt: repo.created_at,
              updatedAt: repo.updated_at,
              size: repo.size,
              isFork: repo.fork,
              isArchived: repo.archived,
              url: repo.html_url,
            };
          }
        })
    );

    return enrichedRepos;
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error(`GitHub user "${username}" not found`);
    }
    if (error.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please provide a GitHub token for higher limits.');
    }
    throw new Error(`Failed to fetch GitHub repos: ${error.message}`);
  }
};

export const fetchReadme = async (
  owner: string,
  repo: string,
  token?: string
): Promise<string | null> => {
  const client = token ? new Octokit({ auth: token }) : octokit;

  try {
    const response = await client.request('GET /repos/{owner}/{repo}/readme', {
      owner,
      repo,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28',
        Accept: 'application/vnd.github.v3.raw',
      },
    });

    const readme = response.data as any;
    // Decode base64 content
    const decodedContent = Buffer.from(readme.content, 'base64').toString('utf-8');
    return decodedContent;
  } catch (error) {
    console.error(`Failed to fetch README for ${owner}/${repo}:`, error);
    return null;
  }
};