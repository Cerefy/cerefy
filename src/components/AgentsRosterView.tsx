import React, { useEffect, useMemo, useState } from 'react';
import { Bot, Search } from 'lucide-react';
import { useAgents } from '../hooks/useApi';
import { EmptyState, ErrorState, LoadingState } from './design-system';

export const AgentsRosterView: React.FC = () => {
  const { data: agents = [], isLoading, isError, error, refetch } = useAgents();
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  const departments = useMemo(
    () => ['ALL', ...Array.from(new Set(agents.map((agent) => agent.department).filter(Boolean))).sort()],
    [agents],
  );

  const filteredAgents = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
    return agents.filter((agent) => {
      const matchesDepartment = selectedDepartment === 'ALL' || agent.department === selectedDepartment;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [agent.name, agent.role, agent.department, ...agent.skills]
          .filter(Boolean)
          .some((value) => value.toLocaleLowerCase().includes(normalizedSearch));
      return matchesDepartment && matchesSearch;
    });
  }, [agents, searchQuery, selectedDepartment]);

  useEffect(() => {
    if (filteredAgents.length === 0) {
      setSelectedAgentId(null);
      return;
    }
    if (!selectedAgentId || !filteredAgents.some((agent) => agent.id === selectedAgentId)) {
      setSelectedAgentId(filteredAgents[0].id);
    }
  }, [filteredAgents, selectedAgentId]);

  const activeAgent = filteredAgents.find((agent) => agent.id === selectedAgentId) ?? null;

  if (isLoading) return <LoadingState label="Loading agents" rows={4} />;

  if (isError) {
    return (
      <ErrorState
        title="Unable to load agents"
        message={error instanceof Error ? error.message : undefined}
        variant="backend-unavailable"
        onRetry={() => void refetch()}
      />
    );
  }

  if (agents.length === 0) {
    return (
      <EmptyState
        icon="smart_toy"
        title="No agents available"
        description="The agent registry returned no agents for this workspace."
      />
    );
  }

  return (
    <section className="space-y-6" aria-labelledby="agents-roster-heading">
      <header className="bento-card rounded-xl p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary font-label text-xs font-semibold uppercase tracking-widest">
            <Bot className="h-4 w-4" aria-hidden="true" /> Agent registry
          </div>
          <h1 id="agents-roster-heading" className="mt-1 font-headline text-xl font-semibold text-on-surface">
            AI Agents Roster
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant font-body">
            Agent profiles returned by the workspace API.
          </p>
        </div>
        <div className="rounded-lg bg-surface-container px-3 py-2 font-label text-xs text-on-surface-variant">
          Agents returned: <span className="font-semibold text-on-surface">{agents.length}</span>
        </div>
      </header>

      <div className="bento-card rounded-xl p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0" aria-label="Department filter">
          {departments.map((department) => (
            <button
              key={department}
              type="button"
              onClick={() => setSelectedDepartment(department)}
              className={`rounded-lg px-3 py-2 text-xs font-label transition-colors ${
                selectedDepartment === department
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
              aria-pressed={selectedDepartment === department}
            >
              {department}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-3 py-2 sm:w-72">
          <Search className="h-4 w-4 text-on-surface-variant" aria-hidden="true" />
          <span className="sr-only">Search agents</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search names, roles, or skills"
            className="w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant"
          />
        </label>
      </div>

      {filteredAgents.length === 0 ? (
        <EmptyState
          icon="search_off"
          title="No matching agents"
          description="No returned agent matches the selected department and search query."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2">
            {filteredAgents.map((agent) => {
              const selected = activeAgent?.id === agent.id;
              return (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`rounded-xl border p-5 text-start transition-colors ${
                    selected
                      ? 'border-primary bg-primary-container'
                      : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'
                  }`}
                  aria-pressed={selected}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-container font-label text-sm font-semibold text-on-primary-container">
                        {agent.name.slice(0, 2).toLocaleUpperCase()}
                      </span>
                      <div>
                        <h2 className="font-headline text-sm font-semibold text-on-surface">{agent.name}</h2>
                        <p className="text-xs text-primary font-label">{agent.role}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">{agent.department}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-surface-container-high px-2 py-1 text-xs font-label text-on-surface-variant">
                      {agent.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2">
                    <p className="text-xs text-on-surface-variant">
                      Current task: <span className="text-on-surface">{agent.currentTask || '—'}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.skills.length === 0 ? (
                        <span className="text-xs text-on-surface-variant">No skills returned</span>
                      ) : (
                        agent.skills.map((skill) => (
                          <span key={skill} className="rounded-md bg-surface-container px-2 py-1 text-xs text-on-surface-variant">
                            {skill}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {activeAgent && (
            <aside className="bento-card rounded-xl p-6 space-y-5" aria-label="Selected agent details">
              <div className="flex items-center gap-3 border-b border-outline-variant pb-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-container font-label text-base font-semibold text-on-primary-container">
                  {activeAgent.name.slice(0, 2).toLocaleUpperCase()}
                </span>
                <div>
                  <h2 className="font-headline text-base font-semibold text-on-surface">{activeAgent.name}</h2>
                  <p className="text-sm text-primary">{activeAgent.role}</p>
                  <p className="text-xs text-on-surface-variant">{activeAgent.department}</p>
                </div>
              </div>

              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Status</dt>
                  <dd className="mt-1 text-on-surface">{activeAgent.status}</dd>
                </div>
                <div>
                  <dt className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Current task</dt>
                  <dd className="mt-1 text-on-surface">{activeAgent.currentTask || '—'}</dd>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface-container p-3">
                    <dt className="font-label text-xs text-on-surface-variant">Performance</dt>
                    <dd className="mt-1 font-headline text-base font-semibold text-on-surface">{activeAgent.performanceScore}%</dd>
                  </div>
                  <div className="rounded-lg bg-surface-container p-3">
                    <dt className="font-label text-xs text-on-surface-variant">Monthly cost</dt>
                    <dd className="mt-1 font-headline text-base font-semibold text-on-surface">{activeAgent.monthlyCost || '—'}</dd>
                  </div>
                </div>
                <div>
                  <dt className="font-label text-xs uppercase tracking-widest text-on-surface-variant">Tools</dt>
                  <dd className="mt-2 flex flex-wrap gap-1.5">
                    {activeAgent.tools.length === 0 ? (
                      <span className="text-xs text-on-surface-variant">No tools returned</span>
                    ) : (
                      activeAgent.tools.map((tool) => (
                        <span key={tool} className="rounded-md bg-surface-container px-2 py-1 text-xs text-on-surface-variant">
                          {tool}
                        </span>
                      ))
                    )}
                  </dd>
                </div>
              </dl>
            </aside>
          )}
        </div>
      )}
    </section>
  );
};

export default AgentsRosterView;
