#!/usr/bin/env node

const baseUrl = process.env.SMOKE_TEST_BASE_URL || 'http://127.0.0.1:3002';
const timeoutMs = Number.parseInt(process.env.SMOKE_TEST_TIMEOUT_MS || '5000', 10);

if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  console.error('SMOKE_TEST_TIMEOUT_MS must be a positive integer.');
  process.exit(2);
}

let origin;
try {
  origin = new URL(baseUrl).origin;
} catch {
  console.error(`SMOKE_TEST_BASE_URL is not a valid URL: ${baseUrl}`);
  process.exit(2);
}

async function request(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(new URL(path, origin), {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    const body = await response.text();
    let json;
    try {
      json = JSON.parse(body);
    } catch {
      json = undefined;
    }
    return { response, body, json };
  } finally {
    clearTimeout(timer);
  }
}

function fail(message) {
  console.error(`SMOKE TEST FAILED: ${message}`);
  process.exit(1);
}

try {
  const live = await request('/health/live');
  if (live.response.status !== 200 || live.json?.status !== 'alive') {
    fail(`/health/live expected 200 with status "alive"; received ${live.response.status}: ${live.body}`);
  }
  console.log(`PASS /health/live ${live.response.status} status=${live.json.status}`);

  const ready = await request('/health/ready');
  if (ready.response.status !== 200 || ready.json?.status !== 'healthy') {
    fail(`/health/ready expected 200 with status "healthy"; received ${ready.response.status}: ${ready.body}`);
  }
  console.log(`PASS /health/ready ${ready.response.status} status=${ready.json.status}`);
  console.log(`SMOKE TEST PASSED against ${origin}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  fail(`unable to reach ${origin}: ${message}`);
}
