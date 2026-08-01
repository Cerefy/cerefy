import React from 'react';
import { Routes, Route, Outlet, useNavigate } from 'react-router-dom';
import { useAgentStore } from './store/useAgentStore';
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
    <div className="min-h-screen bg-[#08080a] text-zinc-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200 antialiased">
      {/* Top Fixed Header */}
      <Navbar />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar />

        {/* Dynamic Workspace Tab Content */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full custom-scrollbar">
          <Outlet />
        </main>
      </div>

      {/* Sticky Telemetry Bar */}
      <footer className="h-9 border-t border-zinc-800/80 bg-[#08080a]/90 backdrop-blur-md font-mono text-[10px] text-zinc-500 flex items-center justify-between px-6 shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> DB: CONNECTED
          </span>
          <span className="flex items-center gap-1.5 text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> AI: ONLINE
          </span>
          <span className="hidden sm:inline text-zinc-700">|</span>
          <span className="hidden sm:inline text-zinc-400">GATEWAY: 100% HEALTH</span>
        </div>
        <div className="flex items-center gap-4">
          <span>CPU: 12%</span>
          <span>MEM: 1.4GB</span>
          <span className="text-indigo-400 font-bold">LATENCY: 24ms</span>
        </div>
      </footer>

      {/* Global Command Palette (Cmd+K) Modal */}
      <CommandPalette onSelectAction={handleCommandPaletteAction} />
    </div>
  );
};

export default function App() {
  const { fetchProjects } = useAgentStore();

  React.useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <Routes>
      <Route path="/" element={<PublicMarketingSite />} />
      <Route path="/workspace" element={<WorkspaceLayout />}>
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
      </Route>
      <Route path="/admin" element={<AdminConsole />} />
    </Routes>
  );
}
