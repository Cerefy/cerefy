import React, { useMemo, useState } from 'react';
import { CheckCircle2, Play, Plus, Rocket, ShieldCheck, Workflow as WorkflowIcon } from 'lucide-react';
import { useCreateWorkflow, usePublishWorkflow, useResolveWorkflowApproval, useRunWorkflow, useWorkflow, useWorkflowRun, useWorkflows } from '../hooks/useApi';
import { EmptyState, ErrorState, LoadingState } from './design-system';

const DEFAULT_DEFINITION = {
  steps: [
    { key: 'analyze', type: 'AI_ANALYSIS' as const, config: {} },
    { key: 'approval', type: 'APPROVAL' as const, config: { requestedRole: 'approver' } },
    { key: 'create_decision', type: 'CREATE_DECISION' as const, config: {} },
  ],
};

export const WorkflowAutomationView: React.FC = () => {
  const workflowsQuery = useWorkflows();
  const createWorkflow = useCreateWorkflow();
  const publishWorkflow = usePublishWorkflow();
  const runWorkflow = useRunWorkflow();
  const resolveApproval = useResolveWorkflowApproval();
  const [selectedId, setSelectedId] = useState('');
  const [runId, setRunId] = useState('');
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');

  const effectiveSelectedId = selectedId || workflowsQuery.data?.[0]?.id || '';
  const workflowQuery = useWorkflow(effectiveSelectedId);
  const runQuery = useWorkflowRun(runId);
  const selectedVersion = useMemo(() => workflowQuery.data?.versions?.[0], [workflowQuery.data]);

  if (workflowsQuery.isLoading) return <LoadingState label="Loading real workflows" />;
  if (workflowsQuery.isError) return <ErrorState variant="backend-unavailable" message={workflowsQuery.error instanceof Error ? workflowsQuery.error.message : 'Unable to load workflows'} onRetry={() => workflowsQuery.refetch()} />;

  const createDefaultWorkflow = () => {
    createWorkflow.mutate({
      name: 'Document Review and Approval',
      description: 'Analyze a business request, pause for human approval, then create a decision.',
      triggerType: 'MANUAL',
      triggerConfig: {},
      definition: DEFAULT_DEFINITION,
    });
  };

  if (!workflowsQuery.data?.length) {
    return <EmptyState icon="account_tree" title="No workflows yet" description="Create the first database-backed workflow. It will analyze a request, require human approval, then create a decision." action={<button onClick={createDefaultWorkflow} disabled={createWorkflow.isPending} className="inline-flex items-center gap-2 rounded-lg bg-on-surface text-surface px-4 py-2 text-sm font-medium disabled:opacity-50"><Plus size={16} />{createWorkflow.isPending ? 'Creating…' : 'Create first workflow'}</button>} />;
  }

  const publish = () => {
    if (effectiveSelectedId && selectedVersion) publishWorkflow.mutate({ workflowId: effectiveSelectedId, versionId: selectedVersion.id });
  };

  const run = () => {
    if (!effectiveSelectedId || !title.trim() || !question.trim()) return;
    const idempotencyKey = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    runWorkflow.mutate({ workflowId: effectiveSelectedId, input: { title: title.trim(), question: question.trim() }, idempotencyKey }, { onSuccess: (result) => setRunId(result.run.id) });
  };

  return (
    <div className="space-y-6 font-sans text-dark-text-muted">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-5">
        <div className="flex items-center gap-3"><div className="p-2 rounded-xl bg-indigo-signal/10 text-indigo-signal-strong"><WorkflowIcon size={22} /></div><div><h1 className="text-xl font-bold text-dark-text-bright">Workflow Automations</h1><p className="text-xs text-dark-muted">Real tenant-scoped workflows with AI analysis, approvals, and audit events.</p></div></div>
        <button onClick={createDefaultWorkflow} disabled={createWorkflow.isPending} className="inline-flex items-center gap-2 rounded-xl bg-indigo-signal-deep px-4 py-2 text-xs font-semibold text-dark-text-bright disabled:opacity-50"><Plus size={15} />Create template</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-4 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-dark-muted">Workflows</h2>
          {workflowsQuery.data.map((workflow) => <button key={workflow.id} onClick={() => { setSelectedId(workflow.id); setRunId(''); }} className={`w-full text-start p-3 rounded-xl border ${workflow.id === effectiveSelectedId ? 'border-indigo-signal/60 bg-indigo-signal/10' : 'border-dark-panel-raised hover:bg-dark-panel-raised/50'}`}><div className="flex items-center justify-between"><span className="text-sm font-semibold text-dark-text-bright">{workflow.name}</span><span className="text-[10px] uppercase text-dark-muted">{workflow.status}</span></div><div className="text-[11px] text-dark-muted mt-1">Trigger: {workflow.triggerType}</div></button>)}
        </div>

        <div className="lg:col-span-2 space-y-5">
          {workflowQuery.isLoading ? <LoadingState label="Loading workflow definition" rows={2} /> : workflowQuery.isError ? <ErrorState variant="backend-unavailable" message="Unable to load workflow definition" onRetry={() => workflowQuery.refetch()} /> : workflowQuery.data && <>
            <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between"><div><h2 className="text-base font-bold text-dark-text-bright">{workflowQuery.data.workflow.name}</h2><p className="text-xs text-dark-muted">{workflowQuery.data.workflow.description || 'No description provided.'}</p></div><span className="text-xs uppercase text-dark-muted">{workflowQuery.data.workflow.status}</span></div>
              <div className="space-y-2">{selectedVersion?.definition.steps.map((step, index) => <div key={step.key} className="flex items-center gap-3 p-3 rounded-xl bg-dark-panel-deep border border-dark-panel-raised"><span className="text-xs font-mono text-dark-muted">{index + 1}</span><span className="text-sm font-semibold text-dark-text">{step.key}</span><span className="ms-auto text-[10px] uppercase text-indigo-signal-strong">{step.type}</span></div>)}</div>
              <div className="flex gap-2"><button onClick={publish} disabled={!selectedVersion || publishWorkflow.isPending || workflowQuery.data.workflow.status === 'PUBLISHED'} className="inline-flex items-center gap-2 rounded-lg bg-dark-panel-raised px-3 py-2 text-xs font-semibold text-dark-text-bright disabled:opacity-50"><Rocket size={14} />{publishWorkflow.isPending ? 'Publishing…' : 'Publish version'}</button><span className="text-[11px] text-dark-muted self-center">Version {selectedVersion?.version ?? '—'}</span></div>
            </div>

            <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-5 space-y-4"><div className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-signal-strong" /><h2 className="text-base font-bold text-dark-text-bright">Run with human approval</h2></div><div className="grid md:grid-cols-2 gap-3"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Decision title" className="rounded-xl bg-dark-panel-deep border border-dark-panel-raised px-3 py-2 text-sm text-dark-text-bright" /><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Decision question" className="rounded-xl bg-dark-panel-deep border border-dark-panel-raised px-3 py-2 text-sm text-dark-text-bright" /></div><button onClick={run} disabled={runWorkflow.isPending || workflowQuery.data.workflow.status !== 'PUBLISHED' || !title.trim() || !question.trim()} className="inline-flex items-center gap-2 rounded-lg bg-emerald-signal-deep px-3 py-2 text-xs font-semibold text-dark-text-bright disabled:opacity-50"><Play size={14} />{runWorkflow.isPending ? 'Starting…' : 'Start workflow run'}</button>{workflowQuery.data.workflow.status !== 'PUBLISHED' && <p className="text-xs text-amber-signal-strong">Publish a version before starting a run.</p>}</div>

            {runId && <div className="bg-dark-panel/50 border border-dark-panel-raised/80 rounded-2xl p-5 space-y-3">{runQuery.isLoading ? <LoadingState label="Loading run" rows={1} /> : runQuery.isError ? <ErrorState variant="backend-unavailable" message="Unable to load workflow run" onRetry={() => runQuery.refetch()} /> : runQuery.data && <><div className="flex justify-between"><h2 className="text-base font-bold text-dark-text-bright">Run status</h2><span className="text-xs uppercase text-dark-muted">{runQuery.data.run.status}</span></div>{runQuery.data.steps.map((step) => <div key={step.id} className="flex items-center gap-3 text-xs"><CheckCircle2 size={15} className={step.status === 'COMPLETED' ? 'text-emerald-signal-strong' : 'text-dark-muted'} /><span>{step.stepKey}</span><span className="ms-auto uppercase text-dark-muted">{step.status}</span></div>)}{runQuery.data.approvals.filter((approval) => approval.status === 'PENDING').map((approval) => <div key={approval.id} className="flex gap-2 pt-3 border-t border-dark-panel-raised"><button onClick={() => resolveApproval.mutate({ approvalId: approval.id, status: 'APPROVED' })} disabled={resolveApproval.isPending} className="rounded-lg bg-emerald-signal-deep px-3 py-2 text-xs font-semibold">Approve</button><button onClick={() => resolveApproval.mutate({ approvalId: approval.id, status: 'REJECTED', note: 'Rejected by reviewer' })} disabled={resolveApproval.isPending} className="rounded-lg bg-dark-panel-raised px-3 py-2 text-xs font-semibold">Reject</button></div>)}</>}</div>}
          </>}
        </div>
      </div>
    </div>
  );
};
