import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { FirebaseSync } from './components/FirebaseSync';
import { useAgentStore } from './store/useAgentStore';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import NotFound from './components/NotFound';
import ErrorPage from './components/ErrorPage';
import { AppShell } from './components/shell/AppShell';
import { CommandPalette } from './components/CommandPalette';
import { AdminConsole } from './components/AdminConsole';
import { SystemHealthPage } from './features/observability/SystemHealthPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { AIWorkspacePage } from './features/ai-workspace/AIWorkspacePage';
import { PlannedModule } from './features/platform/PlannedModule';
import { AIModelsPage } from './features/ai-platform/AIModelsPage';
import { AuditLogPage } from './features/governance/AuditLogPage';
import { LoadingState } from './components/design-system';
import LandingPage from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { CountriesPage } from './intelligence/features/countries';
import { MarketsPage } from './intelligence/features/markets';
import { IndustriesPage } from './intelligence/features/industries';

// Heavy legacy views load on demand — keeps the entry chunk lean and only
// fetches what the current route actually renders (production standard).
const lazyPage = (factory: () => Promise<Record<string, unknown>>, name: string) =>
  React.lazy(() =>
    factory().then((m) => ({ default: (m[name] ?? m.default) as React.ComponentType })),
  );

const DecisionCenterView = lazyPage(() => import('./components/DecisionCenterView'), 'DecisionCenterView');
const AgentsRosterView = lazyPage(() => import('./components/AgentsRosterView'), 'AgentsRosterView');
const ProjectsTrackerView = lazyPage(() => import('./components/ProjectsTrackerView'), 'ProjectsTrackerView');
const DocumentsOCRView = lazyPage(() => import('./components/DocumentsOCRView'), 'DocumentsOCRView');
const MeetingsView = lazyPage(() => import('./components/MeetingsView'), 'MeetingsView');
const TasksKanbanView = lazyPage(() => import('./components/TasksKanbanView'), 'TasksKanbanView');
const KnowledgeHubView = lazyPage(() => import('./components/KnowledgeHubView'), 'KnowledgeHubView');
const AIStudioWorkflowView = lazyPage(() => import('./components/AIStudioWorkflowView'), 'AIStudioWorkflowView');
const AnalyticsView = lazyPage(() => import('./components/AnalyticsView'), 'AnalyticsView');
const IntegrationsView = lazyPage(() => import('./components/IntegrationsView'), 'IntegrationsView');
const WorkspaceSettingsView = lazyPage(() => import('./components/WorkspaceSettingsView'), 'WorkspaceSettingsView');
const AgentOrchestratorView = lazyPage(() => import('./components/AgentOrchestratorView'), 'AgentOrchestratorView');
const KnowledgeGraphView = lazyPage(() => import('./components/KnowledgeGraphView'), 'KnowledgeGraphView');
const IngestionPipeline = lazyPage(() => import('./components/IngestionPipeline'), 'IngestionPipeline');
const MultiTierMemoryView = lazyPage(() => import('./components/MultiTierMemoryView'), 'MultiTierMemoryView');
const TenantSecurityView = lazyPage(() => import('./components/TenantSecurityView'), 'TenantSecurityView');
const PricingPage = lazyPage(() => import('./components/PricingPage'), 'PricingPage');
const FeaturesPage = lazyPage(() => import('./components/FeaturesPage'), 'FeaturesPage');
const AICanvasView = lazyPage(() => import('./components/AICanvasView'), 'AICanvasView');
const BPMNWorkspaceView = lazyPage(() => import('./components/BPMNWorkspaceView'), 'BPMNWorkspaceView');
const GovernanceDashboardView = lazyPage(() => import('./components/GovernanceDashboardView'), 'GovernanceDashboardView');
const ActivityFeedView = lazyPage(() => import('./components/ActivityFeedView'), 'ActivityFeedView');
const ExecutiveMissionControl = lazyPage(() => import('./components/kinetic/ExecutiveMissionControl'), 'ExecutiveMissionControl');

// Command palette actions stay at the shell level so every routed page can
// trigger a tab switch without conversation breakage.
const ShellActions = () => {
  const navigate = useNavigate();

  const handleCommandPaletteAction = (actionType: string, payload?: any) => {
    if (actionType === 'switch_tab' && payload) {
      navigate(`/workspace/${payload}`);
    } else if (actionType === 'run_query' && payload) {
      navigate('/workspace/orchestrator');
    }
  };

  return <CommandPalette onSelectAction={handleCommandPaletteAction} />;
};

function AppRoutes() {
  const { fetchProjects, fetchDecisions, currentUser } = useAgentStore();

  React.useEffect(() => {
    if (currentUser) {
      fetchProjects();
      fetchDecisions();
    }
  }, [fetchProjects, fetchDecisions, currentUser]);

  return (
    <>
      <FirebaseSync />
      <React.Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">
            <div className="w-full max-w-md px-6">
              <LoadingState label="Loading" rows={2} />
            </div>
          </div>
        }
      >
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/features" element={<FeaturesPage />} />

        {/* Protected Workspace Routes — AppShell owns auth guard + chrome */}
        <Route path="/workspace" element={<AppShell />}>
          {/* Overview */}
          <Route index element={<ExecutiveMissionControl />} />
          <Route path="command-center" element={<ExecutiveMissionControl />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* AI Workspace + Agents */}
          <Route path="ai" element={<AIWorkspacePage />} />
          <Route path="ai-canvas" element={<AICanvasView />} />
          <Route path="studio" element={<AIStudioWorkflowView />} />
          <Route path="agents" element={<AgentsRosterView />} />
          <Route path="orchestrator" element={<AgentOrchestratorView />} />
          <Route path="bpmn" element={<BPMNWorkspaceView />} />
          <Route path="conversations" element={<PlannedModule capability="memory" title="Conversations" icon="forum" />} />
          <Route path="workflows" element={<AIStudioWorkflowView />} />

          {/* AI Platform */}
          <Route path="ai/models" element={<AIModelsPage />} />
          <Route path="ai/settings" element={<PlannedModule capability="models" title="AI Settings" icon="tune" />} />
          <Route path="ai/agents/builder" element={<PlannedModule capability="agents" title="Agent Builder" icon="add_box" />} />

          {/* Decisions + Knowledge */}
          <Route path="decisions" element={<DecisionCenterView />} />
          <Route path="documents" element={<DocumentsOCRView />} />
          <Route path="knowledge" element={<KnowledgeHubView />} />
          <Route path="memory" element={<MultiTierMemoryView />} />
          <Route path="graph" element={<KnowledgeGraphView />} />
          <Route path="ingestion" element={<IngestionPipeline />} />

          {/* MENA Intelligence */}
          <Route path="mena/countries" element={<CountriesPage />} />
          <Route path="mena/markets" element={<MarketsPage />} />
          <Route path="mena/industries" element={<IndustriesPage />} />

          {/* Business Operations */}
          <Route path="projects" element={<ProjectsTrackerView />} />
          <Route path="analytics" element={<AnalyticsView />} />
          <Route path="meetings" element={<MeetingsView />} />
          <Route path="tasks" element={<TasksKanbanView />} />
          <Route path="crm" element={<PlannedModule capability="crm" title="CRM" icon="groups" />} />
          <Route path="finance" element={<PlannedModule capability="finance" title="Finance Intelligence" icon="account_balance" />} />
          <Route path="hr" element={<PlannedModule capability="hr" title="HR Intelligence" icon="badge" />} />

          {/* Automation + Integrations */}
          <Route path="integrations" element={<IntegrationsView />} />
          <Route path="automations" element={<PlannedModule capability="automations" title="Automatables" icon="bolt" />} />

          {/* Governante + Observability */}
          <Route path="governance" element={<GovernanceDashboardView />} />
          <Route path="audit" element={<AuditLogPage />} />
          <Route path="security" element={<TenantSecurityView />} />
          <Route path="telemetry" element={<SystemHealthPage />} />
          <Route path="observability/executions" element={<SystemHealthPage />} />
          <Route path="observability/health" element={<SystemHealthPage />} />
          <Route path="system/health" element={<SystemHealthPage />} />
          <Route path="activity" element={<ActivityFeedView />} />

          {/* Organization (target architecture surfaces) */}
          <Route path="organization/members" element={<PlannedModule capability="orgManagement" title="Members" icon="groups" />} />
          <Route path="organization/roles" element={<PlannedModule capability="orgManagement" title="Roles & Permissions" icon="admin_panel_settings" />} />
          <Route path="organization/workspaces" element={<PlannedModule capability="orgManagement" title="Workspaces" icon="workspaces" />} />

          {/* Tenant */}
          <Route path="settings" element={<WorkspaceSettingsView />} />
          <Route path="billing" element={<PlannedModule capability="billing" title="Billing & Usage" icon="payments" />} />
          <Route path="developer" element={<PlannedModule capability="developerPortal" title="Developer Portal" icon="terminal" />} />
        </Route>

        {/* Error Pages */}
        <Route path="/401" element={<ErrorPage variant="403" />} />
        <Route path="/403" element={<ErrorPage variant="403" />} />
        <Route path="/500" element={<ErrorPage variant="500" />} />
        <Route path="/network" element={<ErrorPage variant="network" />} />
        <Route path="/error" element={<ErrorPage variant="generic" />} />

        {/* Admin Console */}
        <Route path="/admin" element={<AdminConsole />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>

      <ShellActions />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ErrorBoundary>
  );
}