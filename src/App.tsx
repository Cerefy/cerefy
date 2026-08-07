import React from 'react';
import { FirebaseSync } from './components/FirebaseSync';
import { Routes, Route, Outlet, useNavigate, Navigate } from 'react-router-dom';
import { useAgentStore } from './store/useAgentStore';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import NotFound from './components/NotFound';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { AICommandCenter } from './components/AICommandCenter';
import { AdminConsole } from './components/AdminConsole';
import { DashboardOverview } from './components/DashboardOverview';
import { DecisionCenterView } from './components/DecisionCenterView';
import { AgentsRosterView } from './components/AgentsRosterView';
import { ProjectsTrackerView } from './components/ProjectsTrackerView';
import { DocumentsOCRView } from './components/DocumentsOCRView';
import { MeetingsView } from './components/MeetingsView';
import { TasksKanbanView } from './components/TasksKanbanView';
import { KnowledgeHubView } from './components/KnowledgeHubView';
import { AIStudioWorkflowView } from './components/AIStudioWorkflowView';
import { AnalyticsView } from './components/AnalyticsView';
import { IntegrationsView } from './components/IntegrationsView';
import { WorkspaceSettingsView } from './components/WorkspaceSettingsView';
import { AgentOrchestratorView } from './components/AgentOrchestratorView';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';
import { IngestionPipeline } from './components/IngestionPipeline';
import { MultiTierMemoryView } from './components/MultiTierMemoryView';
import { TenantSecurityView } from './components/TenantSecurityView';
import { SystemTelemetryView } from './components/SystemTelemetryView';
import { PublicMarketingSite } from './components/PublicMarketingSite';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { PricingPage } from './components/PricingPage';
import { FeaturesPage } from './components/FeaturesPage';
import { AICanvasView } from './components/AICanvasView';
import { BPMNWorkspaceView } from './components/BPMNWorkspaceView';
import { GovernanceDashboardView } from './components/GovernanceDashboardView';
import { ActivityFeedView } from './components/ActivityFeedView';

const WorkspaceLayout = () => {
  const navigate = useNavigate();

  const handleCommandPaletteAction = (actionType: string, payload?: any) => {
    if (actionType === 'switch_tab' && payload) {
      navigate(`/workspace/${payload}`);
    } else if (actionType === 'run_query' && payload) {
      navigate('/workspace/orchestrator');
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body antialiased">
      {/* Top Navigation */}
      <Navbar />

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="ml-64 pt-4 pb-8 px-8 min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Command Palette */}
      <CommandPalette onSelectAction={handleCommandPaletteAction} />
    </div>
  );
};

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm font-mono">CEREFY OS — AUTHENTICATING...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
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
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicMarketingSite />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/features" element={<FeaturesPage />} />

        {/* Protected Workspace Routes */}
        <Route path="/workspace" element={<RequireAuth><WorkspaceLayout /></RequireAuth>}>
          <Route index element={<AICommandCenter />} />
          <Route path="command-center" element={<AICommandCenter />} />
          <Route path="dashboard" element={<DashboardOverview />} />
          <Route path="decisions" element={<DecisionCenterView />} />
          <Route path="agents" element={<AgentsRosterView />} />
          <Route path="projects" element={<ProjectsTrackerView />} />
          <Route path="documents" element={<DocumentsOCRView />} />
          <Route path="meetings" element={<MeetingsView />} />
          <Route path="tasks" element={<TasksKanbanView />} />
          <Route path="knowledge" element={<KnowledgeHubView />} />
          <Route path="studio" element={<AIStudioWorkflowView />} />
          <Route path="analytics" element={<AnalyticsView />} />
          <Route path="integrations" element={<IntegrationsView />} />
          <Route path="settings" element={<WorkspaceSettingsView />} />
          <Route path="orchestrator" element={<AgentOrchestratorView />} />
          <Route path="graph" element={<KnowledgeGraphView />} />
          <Route path="ingestion" element={<IngestionPipeline />} />
          <Route path="memory" element={<MultiTierMemoryView />} />
          <Route path="security" element={<TenantSecurityView />} />
          <Route path="telemetry" element={<SystemTelemetryView />} />
          {/* New AI-powered workspace routes */}
          <Route path="ai-canvas" element={<AICanvasView />} />
          <Route path="bpmn" element={<BPMNWorkspaceView />} />
          <Route path="governance" element={<GovernanceDashboardView />} />
          <Route path="activity" element={<ActivityFeedView />} />
        </Route>

        {/* Admin Console */}
        <Route path="/admin" element={<AdminConsole />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
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
