#!/usr/bin/env node
// Scan staged files for secrets on commit. Usage: node scripts/scan-staged.cjs
const { execSync } = require('node:child_process');

const PATTERNS = [
  { id: 'stripe', re: /\bsk_(live|test)_[A-Za-z0-9]{16,}\b/g },
  { id: 'openai', re: /\bsk-[A-Za-z0-9]{20,}\b/g },
  { id: 'aws', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: 'github', re: /\bghp_[A-Za-z0-9]{36}\b/g },
  { id: 'gitlab', re: /\bglpat-[A-Za-z0-9_-]{20,}\b/g },
  { id: 'private-key', re: /-----BEGIN (RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g },
  { id: 'google', re: /\bAIza[0-9A-Za-z_-]{35}\b/g },
  { id: 'jwt', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
];

function scanText(text) {
  const hits = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    for (const p of PATTERNS) {
      p.re.lastIndex = 0;
      for (const m of lines[i].matchAll(p.re)) {
        hits.push({ id: p.id, line: i + 1 });
      }
    }
  }
  return hits;
}

const skipPaths = ['src/lib/security/__tests__/fixture.unsafe.env'];

function main() {
  const files = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((f) => !skipPaths.includes(f));

  let failed = false;
  for (const file of files) {
    let blob = null;
    try {
      blob = execSync(`git show :"${file}"`, { encoding: 'utf8' });
    } catch {
      continue;
    }
    const hits = scanText(blob);
    if (hits.length > 0) {
      failed = true;
      console.error(`[pre-commit] SECRET DETECTED in ${file}:`, JSON.stringify(hits));
    }
  }

  if (failed) {
    console.error('[pre-commit] Blocking commit: secrets found in staged changes.');
    process.exit(1);
  }
  console.log(`[pre-commit] Secret scan clean (${files.length} staged file(s)).`);
  process.exit(0);
}

main();