import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAgentStore } from '../store/useAgentStore';
import { useNavigate } from 'react-router-dom';
import { LogoIcon } from './LogoIcon';
import {
  Sparkles,
  ArrowRight,
  Bot,
  Terminal,
  LayoutGrid,
  Wallet,
  Megaphone,
  DollarSign,
  Lightbulb,
  CheckCircle,
  Briefcase,
  Box,
  Cpu,
  Rocket,
  Search,
  CheckCircle2,
  TrendingUp,
  Globe,
  Share2,
  Mail,
  Pause,
  Play,
  ChevronRight,
  Database,
  Network,
  Cpu as CpuIcon,
  ShieldCheck,
  Building,
  Layers,
  Zap,
  Check,
  X,
  HelpCircle,
  FileText,
  Lock,
  BarChart3,
  Users,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

export const PublicMarketingSite: React.FC = () => {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState<'products' | 'solutions' | 'enterprise' | 'pricing'>('products');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoForm, setDemoSubmittedForm] = useState({ name: '', email: '', company: '', size: '50-200' });
  const [healthScore, setHealthScore] = useState(85.0);

  // Live fluctuating metric for Company Health
  useEffect(() => {
    const interval = setInterval(() => {
      setHealthScore((prev) => {
        const delta = (Math.random() * 0.4 - 0.2);
        const nextVal = Math.min(99.9, Math.max(75.0, prev + delta));
        return parseFloat(nextVal.toFixed(1));
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleLaunchWorkspace = (tab: any = 'command-center') => {
    navigate(`/workspace/${tab}`);
  };

  const handleBookDemoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDemoSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-sans antialiased selection:bg-outline-soft selection:text-on-surface">
      {/* Top Header Navigation */}
      <header className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-md border-b border-outline-soft">
        <div className="flex justify-between items-center h-16 px-6 md:px-12 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-8">
            <div
              onClick={() => handleLaunchWorkspace('command-center')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <LogoIcon className="h-7 w-7 text-brand-navy group-hover:scale-105 transition-transform" />
            </div>

            <nav className="hidden md:flex items-center gap-8 font-['Inter'] text-sm font-medium text-on-surface-muted-strong">
              <button
                onClick={() => setActiveNav('products')}
                className={`py-1 transition-colors hover:text-on-surface ${
                  activeNav === 'products' ? 'text-on-surface font-semibold border-b-2 border-on-surface' : ''
                }`}
              >
                Products
              </button>
              <button
                onClick={() => {
                  setActiveNav('solutions');
                  handleLaunchWorkspace('integrations');
                }}
                className={`py-1 transition-colors hover:text-on-surface ${
                  activeNav === 'solutions' ? 'text-on-surface font-semibold border-b-2 border-on-surface' : ''
                }`}
              >
                Solutions
              </button>
              <button
                onClick={() => {
                  setActiveNav('enterprise');
                  handleLaunchWorkspace('security');
                }}
                className={`py-1 transition-colors hover:text-on-surface ${
                  activeNav === 'enterprise' ? 'text-on-surface font-semibold border-b-2 border-on-surface' : ''
                }`}
              >
                Enterprise
              </button>
              <button
                onClick={() => setActiveNav('pricing')}
                className={`py-1 transition-colors hover:text-on-surface ${
                  activeNav === 'pricing' ? 'text-on-surface font-semibold border-b-2 border-on-surface' : ''
                }`}
              >
                Pricing
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLaunchWorkspace('command-center')}
              className="hidden lg:block text-on-surface font-medium text-sm px-4 py-2 hover:bg-surface-container-mist rounded-lg transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="bg-dark-surface-strong text-surface-container-lowest font-semibold px-5 py-2 rounded-lg active:scale-95 hover:bg-on-surface transition-all text-sm cursor-pointer shadow-sm"
            >
              Book Demo
            </button>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden px-6 md:px-12 bg-surface-container-lowest border-b border-surface-container-highest">
          <div className="relative z-10 text-center max-w-5xl mx-auto pt-12 pb-16 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-low border border-surface-container-highest text-xs font-semibold text-primary uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-signal animate-pulse" />
              Sovereign Enterprise Intelligence OS
            </div>

            <h1 className="font-['Inter'] text-4xl sm:text-6xl lg:text-7xl font-semibold text-on-surface tracking-tight leading-[1.08]">
              Enterprise AI starts here. <br />
              <span className="text-on-surface-muted font-medium">Build an intelligent company.</span>
            </h1>

            <p className="font-['Inter'] text-lg sm:text-xl text-primary max-w-2xl mx-auto leading-relaxed">
              The first Enterprise Intelligence Operating System designed for the era of autonomous scaling.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => handleLaunchWorkspace('command-center')}
                className="w-full sm:w-auto px-10 py-4 bg-primary hover:bg-on-surface text-surface-container-lowest font-bold rounded-lg shadow-lg active:scale-95 transition-all text-base cursor-pointer"
              >
                Start Free
              </button>
              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full sm:w-auto px-10 py-4 bg-surface-container border border-outline-variant text-on-surface font-medium rounded-lg hover:bg-surface-container-highest active:scale-95 transition-all text-base cursor-pointer"
              >
                Book Demo
              </button>
            </div>

            {/* Neural Memory Core Interactive Visualization Box */}
            <div className="w-full max-w-4xl mx-auto mt-16 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/40 shadow-xl">
              <div className="bg-surface-container-lowest rounded-xl h-[380px] flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-surface to-surface-container opacity-60" />
                
                {/* Visual Neural Core Nodes */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-72 h-72 border border-outline-variant/30 rounded-full animate-spin [animation-duration:30s]" />
                  <div className="w-48 h-48 border border-dashed border-primary/20 rounded-full absolute" />
                  <div className="w-24 h-24 bg-primary/10 rounded-full absolute animate-ping opacity-30" />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-4 text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-surface-container-low border border-outline-variant/50 flex items-center justify-center text-primary shadow-inner">
                    <CpuIcon className="w-8 h-8 animate-pulse text-on-surface" />
                  </div>
                  
                  <div className="bg-surface-container-lowest/90 backdrop-blur-md px-6 py-2 rounded-full border border-outline-variant text-xs font-semibold text-on-surface flex items-center gap-3 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-signal animate-pulse" />
                    Neural Memory Core Operational
                  </div>

                  <div className="grid grid-cols-3 gap-6 mt-4 text-left text-xs text-primary font-mono">
                    <div className="p-3 bg-surface-container-low rounded-lg border border-surface-container-highest">
                      <div className="text-[10px] text-on-surface-muted uppercase">Vectors Indexed</div>
                      <div className="font-bold text-on-surface text-sm">12.4 TB</div>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-lg border border-surface-container-highest">
                      <div className="text-[10px] text-on-surface-muted uppercase">Active Agents</div>
                      <div className="font-bold text-on-surface text-sm">1,240</div>
                    </div>
                    <div className="p-3 bg-surface-container-low rounded-lg border border-surface-container-highest">
                      <div className="text-[10px] text-on-surface-muted uppercase">Latency</div>
                      <div className="font-bold text-emerald-signal-deep text-sm">24ms</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise Trust Section */}
        <section className="py-16 bg-surface-container-lowest border-b border-surface-container-highest">
          <div className="px-6 md:px-12 max-w-7xl mx-auto text-center">
            <p className="text-xs text-primary font-bold uppercase tracking-widest mb-10">
              Powering the world's most intelligent enterprises
            </p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all">
              <span className="font-['Inter'] text-2xl font-extrabold tracking-tighter text-on-surface">NVIDIA</span>
              <span className="font-['Inter'] text-2xl font-bold tracking-tight text-on-surface">Goldman Sachs</span>
              <span className="font-['Inter'] text-2xl font-semibold text-on-surface">SIEMENS</span>
              <span className="font-['Inter'] text-2xl font-bold italic text-on-surface">salesforce</span>
            </div>
          </div>
        </section>

        {/* Platform Bento Grid Architecture */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="font-['Inter'] text-3xl sm:text-4xl font-bold text-on-surface mb-4">
              The OS Architecture
            </h2>
            <p className="text-base sm:text-lg text-primary max-w-2xl mx-auto">
              A unified intelligence layer that sits across your entire enterprise stack, orchestrating decisions, memory, and automated execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Enterprise Memory */}
            <div
              onClick={() => handleLaunchWorkspace('memory')}
              className="md:col-span-2 bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-highest hover:border-outline hover:shadow-xl transition-all group cursor-pointer"
            >
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-on-surface">
                    <Database className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface">Enterprise Memory</h3>
                  <p className="text-sm text-primary max-w-md leading-relaxed">
                    Every document, chat, and codebase indexed into a multi-dimensional semantic vector space for instant context retrieval.
                  </p>
                </div>
                <div className="mt-8 bg-surface-container-low rounded-xl h-48 flex items-center justify-center overflow-hidden border border-surface-container-highest p-4 font-mono text-xs text-primary">
                  <div className="w-full space-y-2">
                    <div className="flex justify-between border-b border-surface-container-highest pb-1">
                      <span>Index Target</span>
                      <span className="font-bold text-on-surface">Status</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Slack Sync Engine</span>
                      <span className="text-emerald-signal-deep font-bold">100% Synced</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Google Drive Docs</span>
                      <span className="text-emerald-signal-deep font-bold">4.2k Indexed</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GitHub Repos</span>
                      <span className="text-indigo-signal-deep font-bold">Live Monitoring</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Knowledge Graph */}
            <div
              onClick={() => handleLaunchWorkspace('graph')}
              className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-highest hover:border-outline hover:shadow-xl transition-all group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-secondary">
                  <Network className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-on-surface">Knowledge Graph</h3>
                <p className="text-sm text-primary">
                  Automated relationship mapping between teams, projects, and disparate data silos.
                </p>
              </div>
              <div className="mt-12 bg-surface-container-high rounded-xl h-32 flex items-center justify-center border border-surface-container-highest">
                <Network className="w-10 h-10 text-primary animate-pulse" />
              </div>
            </div>

            {/* AI Agents */}
            <div
              onClick={() => handleLaunchWorkspace('agents')}
              className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-highest hover:border-outline hover:shadow-xl transition-all group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-tertiary">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-on-surface">AI Agents</h3>
                <p className="text-sm text-primary">
                  Autonomous entities that execute cross-platform workflows without human intervention.
                </p>
              </div>
              <div className="mt-12 flex gap-2">
                <div className="flex-1 h-20 bg-surface-container-low rounded-xl border border-surface-container-highest p-3 text-xs font-bold text-on-surface flex items-center justify-center">
                  CEO Agent
                </div>
                <div className="flex-1 h-20 bg-surface-container-low rounded-xl border border-surface-container-highest p-3 text-xs font-bold text-on-surface flex items-center justify-center">
                  CTO Agent
                </div>
              </div>
            </div>

            {/* Decision Intelligence */}
            <div
              onClick={() => handleLaunchWorkspace('decisions')}
              className="md:col-span-2 bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-highest hover:border-outline hover:shadow-xl transition-all group cursor-pointer"
            >
              <div className="flex flex-col md:flex-row gap-8 items-center h-full">
                <div className="space-y-4 md:w-1/2">
                  <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-rose-signal-deep">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-on-surface">Decision Intelligence</h3>
                  <p className="text-sm text-primary">
                    Predictive modeling that simulates outcomes before you commit resources or capital.
                  </p>
                </div>
                <div className="md:w-1/2 bg-surface-container-low border border-surface-container-highest p-6 rounded-xl w-full">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Efficiency Gain</span>
                        <span>75%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-[75%]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Risk Factor</span>
                        <span>40%</span>
                      </div>
                      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-secondary w-[40%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Dashboard Section */}
        <section className="py-20 bg-surface-container-lowest border-y border-surface-container-highest">
          <div className="px-6 md:px-12 max-w-7xl mx-auto">
            <div className="bg-surface-container-low rounded-2xl p-1 shadow-2xl border border-outline-variant/60 overflow-hidden">
              <div className="bg-surface-container-lowest rounded-xl h-[560px] flex flex-col">
                {/* Toolbar */}
                <div className="h-12 border-b border-surface-container-highest flex items-center px-6 justify-between bg-surface-soft">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-signal-strong" />
                    <div className="w-3 h-3 rounded-full bg-amber-signal-strong" />
                    <div className="w-3 h-3 rounded-full bg-emerald-signal-strong" />
                  </div>
                  <div className="text-xs text-primary font-mono font-bold tracking-tight">
                    CEREFY OS V1.4.2 // ENTERPRISE_DASHBOARD
                  </div>
                  <div className="w-16" />
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {/* Sidebar */}
                  <aside className="w-60 border-r border-surface-container-highest p-5 hidden lg:block bg-surface-container-lowest">
                    <nav className="space-y-6">
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-on-surface-muted uppercase tracking-widest px-2">Main</div>
                        <div
                          onClick={() => handleLaunchWorkspace('dashboard')}
                          className="flex items-center gap-3 text-on-surface bg-surface-container-low p-2.5 rounded-lg cursor-pointer font-bold text-sm"
                        >
                          <LayoutGrid className="w-4 h-4" />
                          <span>Dashboard</span>
                        </div>
                        <div
                          onClick={() => handleLaunchWorkspace('agents')}
                          className="flex items-center gap-3 text-primary p-2.5 hover:bg-surface-container-low rounded-lg cursor-pointer text-sm font-medium"
                        >
                          <Bot className="w-4 h-4" />
                          <span>Agents</span>
                        </div>
                        <div
                          onClick={() => handleLaunchWorkspace('knowledge')}
                          className="flex items-center gap-3 text-primary p-2.5 hover:bg-surface-container-low rounded-lg cursor-pointer text-sm font-medium"
                        >
                          <Database className="w-4 h-4" />
                          <span>Knowledge Base</span>
                        </div>
                      </div>
                    </nav>
                  </aside>

                  {/* Content Area */}
                  <main className="flex-1 p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-surface-container-lowest rounded-xl border border-surface-container-highest shadow-sm">
                        <div className="text-xs font-bold text-primary uppercase tracking-tight mb-1">Company Health</div>
                        <div className="text-3xl font-bold text-on-surface mb-1 font-mono">{healthScore}%</div>
                        <div className="text-emerald-signal-deep text-xs font-bold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> +2.4% vs prev week
                        </div>
                      </div>
                      <div className="p-4 bg-surface-container-lowest rounded-xl border border-surface-container-highest shadow-sm">
                        <div className="text-xs font-bold text-primary uppercase tracking-tight mb-1">Active Agents</div>
                        <div className="text-3xl font-bold text-on-surface mb-1 font-mono">1,240</div>
                        <div className="text-primary text-xs">Executing 4.2k tasks/min</div>
                      </div>
                      <div className="p-4 bg-surface-container-lowest rounded-xl border border-surface-container-highest shadow-sm">
                        <div className="text-xs font-bold text-primary uppercase tracking-tight mb-1">Compute Efficiency</div>
                        <div className="text-3xl font-bold text-on-surface mb-1 font-mono">99.8%</div>
                        <div className="text-primary text-xs font-bold">Optimization active</div>
                      </div>
                    </div>

                    <div className="p-6 bg-surface-container-lowest border border-surface-container-highest rounded-xl shadow-sm space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-on-surface">Intelligence Insights</h4>
                        <button
                          onClick={() => handleLaunchWorkspace('analytics')}
                          className="text-on-surface font-bold text-xs hover:underline cursor-pointer"
                        >
                          View Analysis →
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-surface-container-highest text-xs text-on-surface">
                          <Sparkles className="w-4 h-4 text-primary shrink-0" />
                          <span>Revenue anomaly detected in EMEA region. Analysis suggests 14% supply chain bottleneck.</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-surface-container-highest text-xs text-on-surface">
                          <CheckCircle className="w-4 h-4 text-emerald-signal-deep shrink-0" />
                          <span>Compliance audit for Project 'Aurora' successfully completed via autonomous agent.</span>
                        </div>
                      </div>
                    </div>
                  </main>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Autonomous Executive Layer */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto bg-surface">
          <div className="text-center mb-16">
            <h2 className="font-['Inter'] text-3xl sm:text-4xl font-bold text-on-surface mb-4">
              Autonomous Executive Layer
            </h2>
            <p className="text-base sm:text-lg text-primary max-w-2xl mx-auto">
              Deploy specialized AI agents that function as 24/7 executive members, handling the friction of scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* CEO Agent */}
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-highest hover:shadow-xl transition-all text-center flex flex-col items-center">
              <div className="relative w-28 h-28 mb-6">
                <div className="w-full h-full bg-surface-container-low rounded-full flex items-center justify-center border-2 border-outline-variant">
                  <Bot className="w-12 h-12 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">CEO Agent</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-signal animate-pulse" />
                <span className="text-xs font-bold text-emerald-signal-deep uppercase tracking-wider">Live Status</span>
              </div>
              <p className="text-xs text-primary italic mb-6 leading-relaxed">
                "Analyzing Q4 Revenue growth and simulating market expansion scenarios."
              </p>
              <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden mb-2">
                <div className="h-full bg-primary w-[82%]" />
              </div>
              <span className="text-[10px] font-bold text-on-surface-muted uppercase tracking-wider">
                Decision Confidence: 82%
              </span>
            </div>

            {/* CTO Agent */}
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-highest hover:shadow-xl transition-all text-center flex flex-col items-center">
              <div className="relative w-28 h-28 mb-6">
                <div className="w-full h-full bg-surface-container-low rounded-full flex items-center justify-center border-2 border-outline-variant">
                  <Terminal className="w-12 h-12 text-secondary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">CTO Agent</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-signal animate-pulse" />
                <span className="text-xs font-bold text-emerald-signal-deep uppercase tracking-wider">Live Status</span>
              </div>
              <p className="text-xs text-primary italic mb-6 leading-relaxed">
                "Optimizing global server latency and orchestrating microservice deployment."
              </p>
              <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden mb-2">
                <div className="h-full bg-secondary w-[96%]" />
              </div>
              <span className="text-[10px] font-bold text-on-surface-muted uppercase tracking-wider">
                Network Health: 96%
              </span>
            </div>

            {/* Finance Agent */}
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-highest hover:shadow-xl transition-all text-center flex flex-col items-center">
              <div className="relative w-28 h-28 mb-6">
                <div className="w-full h-full bg-surface-container-low rounded-full flex items-center justify-center border-2 border-outline-variant">
                  <Wallet className="w-12 h-12 text-tertiary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Finance Agent</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-signal animate-pulse" />
                <span className="text-xs font-bold text-emerald-signal-deep uppercase tracking-wider">Live Status</span>
              </div>
              <p className="text-xs text-primary italic mb-6 leading-relaxed">
                "Executing algorithmic treasury management and cost optimization."
              </p>
              <div className="w-full h-1.5 bg-surface-container-low rounded-full overflow-hidden mb-2">
                <div className="h-full bg-tertiary w-[88%]" />
              </div>
              <span className="text-[10px] font-bold text-on-surface-muted uppercase tracking-wider">
                Burn Rate Delta: -12%
              </span>
            </div>
          </div>
        </section>

        {/* Native Integrations */}
        <section className="py-20 bg-surface-container-lowest border-y border-surface-container-highest">
          <div className="px-6 md:px-12 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="font-['Inter'] text-3xl sm:text-4xl font-bold text-on-surface mb-3">
                  Native Integrations
                </h2>
                <p className="text-base text-primary max-w-xl">
                  Cerefy doesn't replace your tools; it inhabits them. Over 500+ enterprise-grade connections ready for deployment.
                </p>
              </div>
              <button
                onClick={() => handleLaunchWorkspace('integrations')}
                className="text-on-surface font-bold flex items-center gap-2 border border-outline-variant px-6 py-3 rounded-lg hover:bg-surface-container-low transition-all cursor-pointer text-sm"
              >
                See all integrations
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {['GitHub', 'Salesforce', 'SAP', 'Slack', 'Teams', 'Jira'].map((item) => (
                <div
                  key={item}
                  onClick={() => handleLaunchWorkspace('integrations')}
                  className="bg-surface p-6 rounded-xl border border-surface-container-highest flex flex-col items-center justify-center h-32 hover:bg-surface-container cursor-pointer transition-all"
                >
                  <Cpu className="w-8 h-8 mb-2 text-primary" />
                  <span className="text-xs font-bold text-on-surface">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-['Inter'] text-3xl sm:text-4xl font-bold text-on-surface mb-4">
              Scalable Intelligence
            </h2>
            <p className="text-base sm:text-lg text-primary max-w-xl mx-auto">
              Tailored plans for startups to global enterprises.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Starter */}
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-highest flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Starter</h3>
                <div className="text-4xl font-bold text-on-surface mb-2">$0</div>
                <p className="text-xs text-primary mb-6">Free forever for small teams</p>
                <ul className="space-y-3 text-xs text-on-surface mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-signal-deep" /> 1 Knowledge Graph</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-signal-deep" /> 5 AI Agents</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-signal-deep" /> Standard Security</li>
                </ul>
              </div>
              <button
                onClick={() => handleLaunchWorkspace('command-center')}
                className="w-full py-3 border border-outline-variant text-on-surface font-bold rounded-lg hover:bg-surface-container-low transition-all text-xs cursor-pointer"
              >
                Choose Starter
              </button>
            </div>

            {/* Pro */}
            <div className="bg-surface-container-low p-8 rounded-2xl border-2 border-primary flex flex-col justify-between relative shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-surface-container-lowest text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Recommended
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface mb-2">Pro</h3>
                <div className="text-4xl font-bold text-on-surface mb-2">$249<span className="text-xs font-normal text-primary">/mo</span></div>
                <p className="text-xs text-primary mb-6">Scaling intelligence for high-growth firms</p>
                <ul className="space-y-3 text-xs text-on-surface mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-signal-deep" /> Unlimited Graphs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-signal-deep" /> 25 AI Agents</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-signal-deep" /> SOC2 Compliance</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-signal-deep" /> 24/7 Priority Support</li>
                </ul>
              </div>
              <button
                onClick={() => handleLaunchWorkspace('command-center')}
                className="w-full py-3 bg-primary hover:bg-on-surface text-surface-container-lowest font-bold rounded-lg transition-all text-xs cursor-pointer shadow-md"
              >
                Get Pro
              </button>
            </div>

            {/* Business */}
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-highest flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-2">Business</h3>
                <div className="text-4xl font-bold text-on-surface mb-2">$899<span className="text-xs font-normal text-primary">/mo</span></div>
                <p className="text-xs text-primary mb-6">For large-scale team orchestration</p>
                <ul className="space-y-3 text-xs text-on-surface mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-signal-deep" /> Custom Agent Builder</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-signal-deep" /> 100 AI Agents</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-signal-deep" /> Data Residency Control</li>
                </ul>
              </div>
              <button
                onClick={() => handleLaunchWorkspace('command-center')}
                className="w-full py-3 border border-outline-variant text-on-surface font-bold rounded-lg hover:bg-surface-container-low transition-all text-xs cursor-pointer"
              >
                Choose Business
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-on-surface text-surface-container-lowest p-8 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-muted mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-surface-container-lowest mb-2">Custom</div>
                <p className="text-xs text-on-surface-muted mb-6">Tailored OS for multinational corps</p>
                <ul className="space-y-3 text-xs text-surface-container-lowest/90 mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-signal-strong" /> Infinite Scaling</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-signal-strong" /> Dedicated Compute</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-signal-strong" /> Solutions Architect</li>
                </ul>
              </div>
              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full py-3 bg-surface-container-lowest text-on-surface font-bold rounded-lg hover:bg-outline-soft transition-all text-xs cursor-pointer"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 border-t border-outline-soft bg-surface-container-lowest">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 px-6 md:px-12 max-w-[1440px] mx-auto mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <LogoIcon className="h-7 w-7 text-brand-navy" />
              <span className="font-['Inter'] text-2xl font-bold tracking-tight text-on-surface">Cerefy</span>
            </div>
            <p className="text-xs text-on-surface-muted-strong leading-relaxed max-w-xs mb-4">
              Building the cognitive infrastructure for the next generation of global industry. Authority. Intelligence. OS.
            </p>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface block mb-4">Platform</span>
            <ul className="space-y-2 text-xs text-primary">
              <li><button onClick={() => handleLaunchWorkspace('security')} className="hover:text-on-surface">Security</button></li>
              <li><button onClick={() => handleLaunchWorkspace('orchestrator')} className="hover:text-on-surface">Architecture</button></li>
              <li><button onClick={() => handleLaunchWorkspace('analytics')} className="hover:text-on-surface">Case Studies</button></li>
            </ul>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface block mb-4">Company</span>
            <ul className="space-y-2 text-xs text-primary">
              <li><button onClick={() => handleLaunchWorkspace('knowledge')} className="hover:text-on-surface">Documentation</button></li>
              <li><button onClick={() => handleLaunchWorkspace('command-center')} className="hover:text-on-surface">Press Kit</button></li>
              <li><button onClick={() => handleLaunchWorkspace('security')} className="hover:text-on-surface">Privacy</button></li>
            </ul>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface block mb-4">Systems</span>
            <ul className="space-y-2 text-xs text-primary">
              <li><button onClick={() => handleLaunchWorkspace('telemetry')} className="hover:text-on-surface">Status</button></li>
              <li><button onClick={() => handleLaunchWorkspace('command-center')} className="hover:text-on-surface">Careers</button></li>
              <li><button onClick={() => handleLaunchWorkspace('telemetry')} className="hover:text-on-surface">API Docs</button></li>
            </ul>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-on-surface block mb-4">Connect</span>
            <ul className="space-y-2 text-xs text-primary">
              <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-on-surface">Twitter</a></li>
              <li><a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-on-surface">LinkedIn</a></li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-on-surface">GitHub</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-surface-container-highest px-6 md:px-12 max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-primary">
          <p>© 2024 Cerefy Intelligence OS. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-signal shadow-glow-green-xs" />
            <span className="font-mono text-[11px] font-bold">ALL SYSTEMS NOMINAL</span>
          </div>
        </div>
      </footer>

      {/* Book Demo Modal */}
      <AnimatePresence>
        {demoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface-container-lowest rounded-2xl max-w-md w-full p-8 shadow-2xl relative border border-outline-variant"
            >
              <button
                onClick={() => setDemoModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-primary hover:text-on-surface rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {!demoSubmitted ? (
                <>
                  <h3 className="font-['Inter'] text-2xl font-bold text-on-surface mb-2">
                    Book an Executive Demo
                  </h3>
                  <p className="text-xs text-primary mb-6">
                    See how Cerefy OS can automate your enterprise workflows and scale your team autonomously.
                  </p>

                  <form onSubmit={handleBookDemoSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Full Name</label>
                      <input
                        required
                        type="text"
                        value={demoForm.name}
                        onChange={(e) => setDemoSubmittedForm({ ...demoForm, name: e.target.value })}
                        placeholder="Executive Name"
                        className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-on-surface"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Work Email</label>
                      <input
                        required
                        type="email"
                        value={demoForm.email}
                        onChange={(e) => setDemoSubmittedForm({ ...demoForm, email: e.target.value })}
                        placeholder="executive@company.com"
                        className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-on-surface"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">Company Name</label>
                      <input
                        required
                        type="text"
                        value={demoForm.company}
                        onChange={(e) => setDemoSubmittedForm({ ...demoForm, company: e.target.value })}
                        placeholder="Acme Corp"
                        className="w-full px-3 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-sm text-on-surface outline-none focus:border-on-surface"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-on-surface text-surface-container-lowest font-bold rounded-lg hover:bg-primary transition-all text-sm cursor-pointer shadow-lg mt-2"
                    >
                      Request Live Demo
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-signal-faint-strong text-emerald-signal-deep rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="font-['Inter'] text-2xl font-bold text-on-surface">Demo Confirmed</h3>
                  <p className="text-xs text-primary leading-relaxed">
                    Thank you, {demoForm.name}. A Cerefy solutions architect has been assigned and will contact you at <span className="font-bold text-on-surface">{demoForm.email}</span> within 2 hours.
                  </p>
                  <button
                    onClick={() => {
                      setDemoModalOpen(false);
                      setDemoSubmitted(false);
                    }}
                    className="px-6 py-2.5 bg-surface-container-low border border-outline-variant text-on-surface font-bold rounded-lg text-xs hover:bg-surface-container-highest transition-all cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
