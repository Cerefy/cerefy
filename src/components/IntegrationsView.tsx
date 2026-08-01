import React, { useState } from 'react';
import { useAgentStore } from '../store/useAgentStore';
import {
  Blocks,
  Filter,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  ShieldCheck,
  Activity,
  FileText,
  Slack,
  HardDrive,
  Database,
  Code2,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const { connectors, toggleConnectorStatus } = useAgentStore();
  const [activeCategory, setActiveCategory] = useState<string>('All Connectors');
  const [searchFilter, setSearchFilter] = useState('');

  const categories = [
    'All Connectors',
    'CRM',
    'ERP',
    'Communication',
    'Cloud Storage',
    'Developer Tools',
  ];

  const connectorMarketplaceItems = [
    {
      id: 'conn_sap',
      name: 'SAP S/4HANA',
      category: 'ERP',
      status: 'CONNECTED',
      latency: 'Active 99.8%',
      desc: 'Enterprise resource planning sync with bidirectional AI auditing.',
      icon: Database,
    },
    {
      id: 'conn_salesforce',
      name: 'Salesforce CRM',
      category: 'CRM',
      status: 'CONNECTED',
      latency: 'Active 100%',
      desc: 'Real-time pipeline analysis and opportunity scoring.',
      icon: CheckCircle2,
    },
    {
      id: 'conn_slack',
      name: 'Slack',
      category: 'Communication',
      status: 'DISCONNECTED',
      latency: 'Last synced 2d ago',
      desc: 'Channel monitoring and automated action item extraction.',
      icon: Slack,
    },
    {
      id: 'conn_s3',
      name: 'Amazon S3',
      category: 'Cloud Storage',
      status: 'CONNECTED',
      latency: 'Active 24ms',
      desc: 'Vector indexing for PDF, DOCX, and unstructured data buckets.',
      icon: HardDrive,
    },
    {
      id: 'conn_gdrive',
      name: 'Google Drive',
      category: 'Cloud Storage',
      status: 'AUTH_ERROR',
      latency: 'Auth Token Expired',
      desc: 'Automatic OCR parsing and Knowledge Graph entity mapping.',
      icon: HardDrive,
    },
    {
      id: 'conn_msteams',
      name: 'MS Teams',
      category: 'Communication',
      status: 'CONNECTED',
      latency: 'Idle 12h ago',
      desc: 'Meeting transcript summarization and agent delegation.',
      icon: Slack,
    },
    {
      id: 'conn_snowflake',
      name: 'Snowflake',
      category: 'ERP',
      status: 'CONNECTED',
      latency: 'Active 98.5%',
      desc: 'Data warehouse query synthesis and SQL agent execution.',
      icon: Database,
    },
    {
      id: 'conn_github',
      name: 'GitHub',
      category: 'Developer Tools',
      status: 'CONNECTED',
      latency: 'Active 100%',
      desc: 'Repo telemetry, PR auditing, and security vulnerability scanning.',
      icon: Code2,
    },
  ];

  const filteredItems = connectorMarketplaceItems.filter((item) => {
    const matchesCat =
      activeCategory === 'All Connectors' || item.category === activeCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 font-sans text-zinc-300 selection:bg-indigo-500/30">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/30 rounded-2xl p-8 text-white shadow-xl space-y-2 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-bold uppercase tracking-wider">
          <Blocks className="h-4 w-4" /> Enterprise Data Pipelines
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight font-sans">
          Connectors Marketplace
        </h2>
        <p className="text-xs text-slate-300 max-w-xl font-sans leading-relaxed">
          Bridge your enterprise intelligence with 200+ native integrations across CRM, ERP, Cloud Storage, and Communication suites.
        </p>
      </div>

      {/* Filter Pills & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-white text-zinc-950 font-bold shadow-sm'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search connectors..."
            className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs outline-none focus:border-indigo-500 text-zinc-200 font-sans"
          />
          <button className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-xl transition-colors cursor-pointer" title="More Filters">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-zinc-700 transition-all backdrop-blur-sm"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="p-2.5 rounded-xl bg-zinc-950 text-indigo-400 border border-zinc-800">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[9px] font-bold border ${
                      item.status === 'CONNECTED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : item.status === 'AUTH_ERROR'
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-zinc-800 text-zinc-500 border-zinc-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white font-sans">{item.name}</h4>
                  <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{item.latency}</div>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-sans">{item.desc}</p>
              </div>

              <div className="pt-2 border-t border-zinc-800">
                {item.status === 'CONNECTED' ? (
                  <button
                    onClick={() => alert(`Re-configuring ${item.name} settings...`)}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Configure
                  </button>
                ) : item.status === 'AUTH_ERROR' ? (
                  <button
                    onClick={() => alert(`Re-authenticating ${item.name} OAuth credentials...`)}
                    className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Resolve Access
                  </button>
                ) : (
                  <button
                    onClick={() => alert(`Connecting ${item.name}...`)}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Reconnect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Featured Solutions Section */}
      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 shadow-sm space-y-4 backdrop-blur-sm">
        <h3 className="text-base font-bold text-white font-sans">Featured Integration Solutions</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
              <ShieldCheck className="h-4 w-4" /> Compliance-First Connectivity
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed font-sans">
              All connector streams run through Cerefy PII redaction and RLS row-level tenant authorization.
            </p>
            <button
              onClick={() => alert('Opening Security Whitepaper...')}
              className="text-[11px] font-bold text-indigo-400 hover:underline cursor-pointer flex items-center gap-1 pt-1"
            >
              Read Security Whitepaper <ExternalLink className="h-3 w-3" />
            </button>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
              <Activity className="h-4 w-4" /> Real-time Telemetry
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed font-sans">
              Track connector API throughput, latency spikes, and vector ingestion logs in real-time.
            </p>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
              <Plus className="h-4 w-4" /> Request a Connector
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed font-sans">
              Need a custom integration for internal legacy databases? Contact our enterprise engineering team.
            </p>
            <button
              onClick={() => alert('Custom connector request submitted!')}
              className="text-[11px] font-bold text-indigo-400 hover:underline cursor-pointer flex items-center gap-1 pt-1"
            >
              Submit Request <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
