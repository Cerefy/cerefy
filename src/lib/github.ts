const GITHUB_API_BASE = 'https://api.github.com';

export interface GitHubRepository {
  repository: string;
}

function requireGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is required for GitHub automation');
  }
  return token;
}

function encodeGitHubPath(filePath: string): string {
  return filePath.split('/').map((part) => encodeURIComponent(part)).join('/');
}

function encodeGitHubRef(ref: string): string {
  return encodeURIComponent(ref);
}

async function githubRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = requireGitHubToken();
  const response = await fetch(`${GITHUB_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'cerefy-enterprise-ai',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  let payload: any = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const message = payload?.message || response.statusText || 'GitHub request failed';
    throw new Error(message);
  }

  return payload as T;
}

export async function getGitHubRepository(repository: string) {
  return githubRequest<Record<string, unknown>>(`/repos/${repository}`);
}

export async function createGitHubBranch(repository: string, branch: string, baseBranch = 'main') {
  const ref = await githubRequest<{ object: { sha: string } }>(`/repos/${repository}/git/ref/heads/${encodeGitHubRef(baseBranch)}`);
  return githubRequest<Record<string, unknown>>(`/repos/${repository}/git/refs`, {
    method: 'POST',
    body: JSON.stringify({
      ref: `refs/heads/${branch}`,
      sha: ref.object.sha,
    }),
  });
}

export async function createGitHubPullRequest(repository: string, title: string, head: string, base: string, body?: string, draft = true) {
  return githubRequest<Record<string, unknown>>(`/repos/${repository}/pulls`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      head,
      base,
      body,
      draft,
    }),
  });
}

export async function updateGitHubFile(params: {
  repository: string;
  filePath: string;
  content: string;
  commitMessage: string;
  branch?: string;
  sha?: string;
}) {
  const existing = params.sha
    ? { sha: params.sha }
    : await githubRequest<{ sha: string }>(`/repos/${params.repository}/contents/${encodeGitHubPath(params.filePath)}`, {
        method: 'GET',
      }).catch(() => null);

  return githubRequest<Record<string, unknown>>(`/repos/${params.repository}/contents/${encodeGitHubPath(params.filePath)}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: params.commitMessage,
      content: Buffer.from(params.content, 'utf8').toString('base64'),
      branch: params.branch,
      sha: params.sha || existing?.sha,
    }),
  });
}
