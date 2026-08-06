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

function assertValidRepository(repository: string): void {
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) {
    throw new Error('Invalid GitHub repository format. Expected owner/repo.');
  }
}

function assertValidRef(ref: string): void {
  if (!/^[A-Za-z0-9._/-]+$/.test(ref) || ref.includes('..') || ref.startsWith('/') || ref.endsWith('/')) {
    throw new Error('Invalid GitHub ref format.');
  }
}

function encodeGitHubPath(filePath: string): string {
  const parts = filePath.split('/').filter(Boolean);
  if (parts.length === 0) {
    throw new Error('GitHub file path is required');
  }
  return parts.map((part) => encodeURIComponent(part)).join('/');
}

function encodeGitHubRef(ref: string): string {
  assertValidRef(ref);
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
  assertValidRepository(repository);
  return githubRequest<Record<string, unknown>>(`/repos/${repository}`);
}

export async function createGitHubBranch(repository: string, branch: string, baseBranch = 'main') {
  assertValidRepository(repository);
  assertValidRef(branch);
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
  assertValidRepository(repository);
  assertValidRef(head);
  assertValidRef(base);
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
  assertValidRepository(params.repository);
  const encodedPath = encodeGitHubPath(params.filePath);
  const existing = params.sha
    ? { sha: params.sha }
    : await githubRequest<{ sha: string }>(`/repos/${params.repository}/contents/${encodedPath}`, {
        method: 'GET',
      }).catch(() => null);

  return githubRequest<Record<string, unknown>>(`/repos/${params.repository}/contents/${encodedPath}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: params.commitMessage,
      content: Buffer.from(params.content, 'utf8').toString('base64'),
      branch: params.branch,
      sha: params.sha || existing?.sha,
    }),
  });
}
