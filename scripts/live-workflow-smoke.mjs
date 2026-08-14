import crypto from 'node:crypto';

const baseUrl = (process.env.LIVE_BASE_URL || 'https://cerefy-web.onrender.com').replace(/\/$/, '');
const unique = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
const email = `workflow-smoke-${unique}@example.invalid`;
const password = `Wf!${crypto.randomBytes(18).toString('base64url')}`;

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const raw = await response.text();
  let body;
  try { body = raw ? JSON.parse(raw) : null; } catch { body = raw; }
  return { response, body };
}

function assertStatus(result, expected, label) {
  if (result.response.status !== expected) {
    throw new Error(`${label}: expected HTTP ${expected}, received ${result.response.status}: ${JSON.stringify(result.body)}`);
  }
}

async function waitForRun(token, runId, expectedStatuses, timeoutMs = 90_000) {
  const started = Date.now();
  let last;
  while (Date.now() - started < timeoutMs) {
    const result = await request(`/api/v1/workflow-runs/${encodeURIComponent(runId)}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assertStatus(result, 200, 'workflow run lookup');
    last = result.body?.data;
    const status = last?.run?.status;
    if (expectedStatuses.includes(status)) return last;
    await new Promise((resolve) => setTimeout(resolve, 2_500));
  }
  throw new Error(`workflow run ${runId} did not reach ${expectedStatuses.join(', ')}: ${JSON.stringify(last)}`);
}

try {
  const registered = await request('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      firstName: 'Workflow',
      lastName: 'Smoke',
      organizationName: `Workflow Smoke ${unique}`,
    }),
  });
  assertStatus(registered, 200, 'registration');
  const token = registered.body?.tokens?.accessToken;
  if (!token) throw new Error(`registration did not return access token: ${JSON.stringify(registered.body)}`);

  const definition = {
    steps: [
      { key: 'analyze', type: 'AI_ANALYSIS' },
      { key: 'approve', type: 'APPROVAL', config: { requestedRole: 'approver' } },
      { key: 'decision', type: 'CREATE_DECISION' },
      { key: 'notify', type: 'NOTIFY' },
    ],
  };
  const created = await request('/api/v1/workflows', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: `Live Workflow Smoke ${unique}`,
      description: 'Disposable end-to-end verification workflow',
      triggerType: 'MANUAL',
      triggerConfig: {},
      definition,
    }),
  });
  assertStatus(created, 201, 'workflow creation');
  const workflowId = created.body?.data?.workflow?.id;
  const versionId = created.body?.data?.version?.id;
  if (!workflowId || !versionId) throw new Error(`workflow creation returned incomplete IDs: ${JSON.stringify(created.body)}`);

  const published = await request(`/api/v1/workflows/${encodeURIComponent(workflowId)}/publish`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ versionId }),
  });
  assertStatus(published, 200, 'workflow publish');

  const idempotencyKey = `workflow-smoke-${unique}`;
  const started = await request(`/api/v1/workflows/${encodeURIComponent(workflowId)}/runs`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'idempotency-key': idempotencyKey },
    body: JSON.stringify({
      input: {
        title: `Workflow smoke decision ${unique}`,
        question: 'Should this verified pilot workflow proceed after human approval?',
      },
    }),
  });
  assertStatus(started, 202, 'workflow run creation');
  const runId = started.body?.data?.run?.id;
  if (!runId) throw new Error(`workflow run creation returned no run ID: ${JSON.stringify(started.body)}`);

  const waiting = await waitForRun(token, runId, ['WAITING_APPROVAL', 'FAILED']);
  if (waiting.run.status === 'FAILED') throw new Error(`workflow failed before approval: ${waiting.run.error || JSON.stringify(waiting)}`);
  const approval = waiting.approvals?.find((item) => item.status === 'PENDING');
  if (!approval?.id) throw new Error(`workflow did not create pending approval: ${JSON.stringify(waiting)}`);

  const resolved = await request(`/api/v1/workflow-approvals/${encodeURIComponent(approval.id)}/resolve`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: JSON.stringify({ status: 'APPROVED', note: 'Automated live verification approval' }),
  });
  assertStatus(resolved, 200, 'workflow approval');

  const completed = await waitForRun(token, runId, ['SUCCEEDED', 'FAILED']);
  if (completed.run.status !== 'SUCCEEDED') throw new Error(`workflow did not succeed after approval: ${completed.run.error || JSON.stringify(completed)}`);

  const summary = {
    registrationStatus: registered.response.status,
    workflowCreateStatus: created.response.status,
    workflowPublishStatus: published.response.status,
    workflowRunStatus: started.response.status,
    finalWorkflowStatus: completed.run.status,
    completedStepTypes: completed.steps.filter((step) => step.status === 'COMPLETED').map((step) => step.stepType),
    approvalStatus: completed.approvals?.[0]?.status,
    runId,
    workflowId,
  };
  console.log(`LIVE_WORKFLOW_SMOKE_PASS ${JSON.stringify(summary)}`);
} catch (error) {
  console.error(`LIVE_WORKFLOW_SMOKE_FAIL ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
