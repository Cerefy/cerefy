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
    <div className="min-h-screen bg-[#f9f9f9] text-[#1b1b1b] font-sans antialiased selection:bg-zinc-200 selection:text-zinc-900">
      {/* Top Header Navigation */}
      <header className="fixed top-0 w-full z-50 bg-[#f9f9f9]/90 backdrop-blur-md border-b border-[#e5e5e5]">
        <div className="flex justify-between items-center h-16 px-6 md:px-12 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-8">
            <div
              onClick={() => handleLaunchWorkspace('command-center')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <LogoIcon className="h-7 w-7 text-[#080E38] group-hover:scale-105 transition-transform" />
            </div>

            <nav className="hidden md:flex items-center gap-8 font-['Inter'] text-sm font-medium text-[#666666]">
              <button
                onClick={() => setActiveNav('products')}
                className={`py-1 transition-colors hover:text-[#1b1b1b] ${
                  activeNav === 'products' ? 'text-[#1b1b1b] font-semibold border-b-2 border-[#1b1b1b]' : ''
                }`}
              >
                Products
              </button>
              <button
                onClick={() => {
                  setActiveNav('solutions');
                  handleLaunchWorkspace('integrations');
                }}
                className={`py-1 transition-colors hover:text-[#1b1b1b] ${
                  activeNav === 'solutions' ? 'text-[#1b1b1b] font-semibold border-b-2 border-[#1b1b1b]' : ''
                }`}
              >
                Solutions
              </button>
              <button
                onClick={() => {
                  setActiveNav('enterprise');
                  handleLaunchWorkspace('security');
                }}
                className={`py-1 transition-colors hover:text-[#1b1b1b] ${
                  activeNav === 'enterprise' ? 'text-[#1b1b1b] font-semibold border-b-2 border-[#1b1b1b]' : ''
                }`}
              >
                Enterprise
              </button>
              <button
                onClick={() => setActiveNav('pricing')}
                className={`py-1 transition-colors hover:text-[#1b1b1b] ${
                  activeNav === 'pricing' ? 'text-[#1b1b1b] font-semibold border-b-2 border-[#1b1b1b]' : ''
                }`}
              >
                Pricing
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLaunchWorkspace('command-center')}
              className="hidden lg:block text-[#1b1b1b] font-medium text-sm px-4 py-2 hover:bg-[#eaeaea] rounded-lg transition-all cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => setDemoModalOpen(true)}
              className="bg-[#2b2b2b] text-white font-semibold px-5 py-2 rounded-lg active:scale-95 hover:bg-[#1b1b1b] transition-all text-sm cursor-pointer shadow-sm"
            >
              Book Demo
            </button>
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative min-h-[85vh] flex flex-col items-center justify-center overflow-hidden px-6 md:px-12 bg-[#ffffff] border-b border-[#e2e2e2]">
          <div className="relative z-10 text-center max-w-5xl mx-auto pt-12 pb-16 space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f3f3f3] border border-[#e2e2e2] text-xs font-semibold text-[#5e5e5f] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Sovereign Enterprise Intelligence OS
            </div>

            <h1 className="font-['Inter'] text-4xl sm:text-6xl lg:text-7xl font-semibold text-[#1b1b1b] tracking-tight leading-[1.08]">
              Enterprise AI starts here. <br />
              <span className="text-[#888888] font-medium">Build an intelligent company.</span>
            </h1>

            <p className="font-['Inter'] text-lg sm:text-xl text-[#5e5e5f] max-w-2xl mx-auto leading-relaxed">
              The first Enterprise Intelligence Operating System designed for the era of autonomous scaling.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => handleLaunchWorkspace('command-center')}
                className="w-full sm:w-auto px-10 py-4 bg-[#5e5e5f] hover:bg-[#1b1b1b] text-white font-bold rounded-lg shadow-lg active:scale-95 transition-all text-base cursor-pointer"
              >
                Start Free
              </button>
              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full sm:w-auto px-10 py-4 bg-[#eeeeee] border border-[#c4c7c8] text-[#1b1b1b] font-medium rounded-lg hover:bg-[#e2e2e2] active:scale-95 transition-all text-base cursor-pointer"
              >
                Book Demo
              </button>
            </div>

            {/* Neural Memory Core Interactive Visualization Box */}
            <div className="w-full max-w-4xl mx-auto mt-16 p-4 bg-[#f3f3f3] rounded-2xl border border-[#c4c7c8]/40 shadow-xl">
              <div className="bg-white rounded-xl h-[380px] flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#f9f9f9] to-[#eeeeee] opacity-60" />
                
                {/* Visual Neural Core Nodes */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-72 h-72 border border-[#c4c7c8]/30 rounded-full animate-spin [animation-duration:30s]" />
                  <div className="w-48 h-48 border border-dashed border-[#5e5e5f]/20 rounded-full absolute" />
                  <div className="w-24 h-24 bg-[#5e5e5f]/10 rounded-full absolute animate-ping opacity-30" />
                </div>

                <div className="relative z-10 flex flex-col items-center gap-4 text-center p-6">
                  <div className="w-16 h-16 rounded-2xl bg-[#f3f3f3] border border-[#c4c7c8]/50 flex items-center justify-center text-[#5e5e5f] shadow-inner">
                    <CpuIcon className="w-8 h-8 animate-pulse text-[#1b1b1b]" />
                  </div>
                  
                  <div className="bg-white/90 backdrop-blur-md px-6 py-2 rounded-full border border-[#c4c7c8] text-xs font-semibold text-[#1b1b1b] flex items-center gap-3 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    Neural Memory Core Operational
                  </div>

                  <div className="grid grid-cols-3 gap-6 mt-4 text-left text-xs text-[#5e5e5f] font-mono">
                    <div className="p-3 bg-[#f3f3f3] rounded-lg border border-[#e2e2e2]">
                      <div className="text-[10px] text-[#888888] uppercase">Vectors Indexed</div>
                      <div className="font-bold text-[#1b1b1b] text-sm">12.4 TB</div>
                    </div>
                    <div className="p-3 bg-[#f3f3f3] rounded-lg border border-[#e2e2e2]">
                      <div className="text-[10px] text-[#888888] uppercase">Active Agents</div>
                      <div className="font-bold text-[#1b1b1b] text-sm">1,240</div>
                    </div>
                    <div className="p-3 bg-[#f3f3f3] rounded-lg border border-[#e2e2e2]">
                      <div className="text-[10px] text-[#888888] uppercase">Latency</div>
                      <div className="font-bold text-emerald-600 text-sm">24ms</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enterprise Trust Section */}
        <section className="py-16 bg-white border-b border-[#e2e2e2]">
          <div className="px-6 md:px-12 max-w-7xl mx-auto text-center">
            <p className="text-xs text-[#5e5e5f] font-bold uppercase tracking-widest mb-10">
              Powering the world's most intelligent enterprises
            </p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all">
              <span className="font-['Inter'] text-2xl font-extrabold tracking-tighter text-[#1b1b1b]">NVIDIA</span>
              <span className="font-['Inter'] text-2xl font-bold tracking-tight text-[#1b1b1b]">Goldman Sachs</span>
              <span className="font-['Inter'] text-2xl font-semibold text-[#1b1b1b]">SIEMENS</span>
              <span className="font-['Inter'] text-2xl font-bold italic text-[#1b1b1b]">salesforce</span>
            </div>
          </div>
        </section>

        {/* Platform Bento Grid Architecture */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="font-['Inter'] text-3xl sm:text-4xl font-bold text-[#1b1b1b] mb-4">
              The OS Architecture
            </h2>
            <p className="text-base sm:text-lg text-[#5e5e5f] max-w-2xl mx-auto">
              A unified intelligence layer that sits across your entire enterprise stack, orchestrating decisions, memory, and automated execution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Enterprise Memory */}
            <div
              onClick={() => handleLaunchWorkspace('memory')}
              className="md:col-span-2 bg-white p-8 rounded-2xl border border-[#e2e2e2] hover:border-[#747879] hover:shadow-xl transition-all group cursor-pointer"
            >
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-[#eeeeee] flex items-center justify-center text-[#1b1b1b]">
                    <Database className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1b1b1b]">Enterprise Memory</h3>
                  <p className="text-sm text-[#5e5e5f] max-w-md leading-relaxed">
                    Every document, chat, and codebase indexed into a multi-dimensional semantic vector space for instant context retrieval.
                  </p>
                </div>
                <div className="mt-8 bg-[#f3f3f3] rounded-xl h-48 flex items-center justify-center overflow-hidden border border-[#e2e2e2] p-4 font-mono text-xs text-[#5e5e5f]">
                  <div className="w-full space-y-2">
                    <div className="flex justify-between border-b border-[#e2e2e2] pb-1">
                      <span>Index Target</span>
                      <span className="font-bold text-[#1b1b1b]">Status</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Slack Sync Engine</span>
                      <span className="text-emerald-600 font-bold">100% Synced</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Google Drive Docs</span>
                      <span className="text-emerald-600 font-bold">4.2k Indexed</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GitHub Repos</span>
                      <span className="text-indigo-600 font-bold">Live Monitoring</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Knowledge Graph */}
            <div
              onClick={() => handleLaunchWorkspace('graph')}
              className="bg-white p-8 rounded-2xl border border-[#e2e2e2] hover:border-[#747879] hover:shadow-xl transition-all group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#eeeeee] flex items-center justify-center text-[#5e5e5d]">
                  <Network className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-[#1b1b1b]">Knowledge Graph</h3>
                <p className="text-sm text-[#5e5e5f]">
                  Automated relationship mapping between teams, projects, and disparate data silos.
                </p>
              </div>
              <div className="mt-12 bg-[#e8e8e8] rounded-xl h-32 flex items-center justify-center border border-[#e2e2e2]">
                <Network className="w-10 h-10 text-[#5e5e5f] animate-pulse" />
              </div>
            </div>

            {/* AI Agents */}
            <div
              onClick={() => handleLaunchWorkspace('agents')}
              className="bg-white p-8 rounded-2xl border border-[#e2e2e2] hover:border-[#747879] hover:shadow-xl transition-all group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#eeeeee] flex items-center justify-center text-[#5e6141]">
                  <Bot className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-[#1b1b1b]">AI Agents</h3>
                <p className="text-sm text-[#5e5e5f]">
                  Autonomous entities that execute cross-platform workflows without human intervention.
                </p>
              </div>
              <div className="mt-12 flex gap-2">
                <div className="flex-1 h-20 bg-[#f3f3f3] rounded-xl border border-[#e2e2e2] p-3 text-xs font-bold text-[#1b1b1b] flex items-center justify-center">
                  CEO Agent
                </div>
                <div className="flex-1 h-20 bg-[#f3f3f3] rounded-xl border border-[#e2e2e2] p-3 text-xs font-bold text-[#1b1b1b] flex items-center justify-center">
                  CTO Agent
                </div>
              </div>
            </div>

            {/* Decision Intelligence */}
            <div
              onClick={() => handleLaunchWorkspace('decisions')}
              className="md:col-span-2 bg-white p-8 rounded-2xl border border-[#e2e2e2] hover:border-[#747879] hover:shadow-xl transition-all group cursor-pointer"
            >
              <div className="flex flex-col md:flex-row gap-8 items-center h-full">
                <div className="space-y-4 md:w-1/2">
                  <div className="w-12 h-12 rounded-xl bg-[#eeeeee] flex items-center justify-center text-red-600">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1b1b1b]">Decision Intelligence</h3>
                  <p className="text-sm text-[#5e5e5f]">
                    Predictive modeling that simulates outcomes before you commit resources or capital.
                  </p>
                </div>
                <div className="md:w-1/2 bg-[#f3f3f3] border border-[#e2e2e2] p-6 rounded-xl w-full">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Efficiency Gain</span>
                        <span>75%</span>
                      </div>
                      <div className="h-2 w-full bg-[#e2e2e2] rounded-full overflow-hidden">
                        <div className="h-full bg-[#5e5e5f] w-[75%]" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Risk Factor</span>
                        <span>40%</span>
                      </div>
                      <div className="h-2 w-full bg-[#e2e2e2] rounded-full overflow-hidden">
                        <div className="h-full bg-[#5e5e5d] w-[40%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Dashboard Section */}
        <section className="py-20 bg-white border-y border-[#e2e2e2]">
          <div className="px-6 md:px-12 max-w-7xl mx-auto">
            <div className="bg-[#f3f3f3] rounded-2xl p-1 shadow-2xl border border-[#c4c7c8]/60 overflow-hidden">
              <div className="bg-white rounded-xl h-[560px] flex flex-col">
                {/* Toolbar */}
                <div className="h-12 border-b border-[#e2e2e2] flex items-center px-6 justify-between bg-[#f8f9fa]">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-xs text-[#5e5e5f] font-mono font-bold tracking-tight">
                    CEREFY OS V1.4.2 // ENTERPRISE_DASHBOARD
                  </div>
                  <div className="w-16" />
                </div>

                <div className="flex-1 flex overflow-hidden">
                  {/* Sidebar */}
                  <aside className="w-60 border-r border-[#e2e2e2] p-5 hidden lg:block bg-white">
                    <nav className="space-y-6">
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold text-[#888888] uppercase tracking-widest px-2">Main</div>
                        <div
                          onClick={() => handleLaunchWorkspace('dashboard')}
                          className="flex items-center gap-3 text-[#1b1b1b] bg-[#f3f3f3] p-2.5 rounded-lg cursor-pointer font-bold text-sm"
                        >
                          <LayoutGrid className="w-4 h-4" />
                          <span>Dashboard</span>
                        </div>
                        <div
                          onClick={() => handleLaunchWorkspace('agents')}
                          className="flex items-center gap-3 text-[#5e5e5f] p-2.5 hover:bg-[#f3f3f3] rounded-lg cursor-pointer text-sm font-medium"
                        >
                          <Bot className="w-4 h-4" />
                          <span>Agents</span>
                        </div>
                        <div
                          onClick={() => handleLaunchWorkspace('knowledge')}
                          className="flex items-center gap-3 text-[#5e5e5f] p-2.5 hover:bg-[#f3f3f3] rounded-lg cursor-pointer text-sm font-medium"
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
                      <div className="p-4 bg-white rounded-xl border border-[#e2e2e2] shadow-sm">
                        <div className="text-xs font-bold text-[#5e5e5f] uppercase tracking-tight mb-1">Company Health</div>
                        <div className="text-3xl font-bold text-[#1b1b1b] mb-1 font-mono">{healthScore}%</div>
                        <div className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> +2.4% vs prev week
                        </div>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-[#e2e2e2] shadow-sm">
                        <div className="text-xs font-bold text-[#5e5e5f] uppercase tracking-tight mb-1">Active Agents</div>
                        <div className="text-3xl font-bold text-[#1b1b1b] mb-1 font-mono">1,240</div>
                        <div className="text-[#5e5e5f] text-xs">Executing 4.2k tasks/min</div>
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-[#e2e2e2] shadow-sm">
                        <div className="text-xs font-bold text-[#5e5e5f] uppercase tracking-tight mb-1">Compute Efficiency</div>
                        <div className="text-3xl font-bold text-[#1b1b1b] mb-1 font-mono">99.8%</div>
                        <div className="text-[#5e5e5f] text-xs font-bold">Optimization active</div>
                      </div>
                    </div>

                    <div className="p-6 bg-white border border-[#e2e2e2] rounded-xl shadow-sm space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-[#1b1b1b]">Intelligence Insights</h4>
                        <button
                          onClick={() => handleLaunchWorkspace('analytics')}
                          className="text-[#1b1b1b] font-bold text-xs hover:underline cursor-pointer"
                        >
                          View Analysis →
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-[#f3f3f3] rounded-lg border border-[#e2e2e2] text-xs text-[#1b1b1b]">
                          <Sparkles className="w-4 h-4 text-[#5e5e5f] shrink-0" />
                          <span>Revenue anomaly detected in EMEA region. Analysis suggests 14% supply chain bottleneck.</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-[#f3f3f3] rounded-lg border border-[#e2e2e2] text-xs text-[#1b1b1b]">
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
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
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto bg-[#f9f9f9]">
          <div className="text-center mb-16">
            <h2 className="font-['Inter'] text-3xl sm:text-4xl font-bold text-[#1b1b1b] mb-4">
              Autonomous Executive Layer
            </h2>
            <p className="text-base sm:text-lg text-[#5e5e5f] max-w-2xl mx-auto">
              Deploy specialized AI agents that function as 24/7 executive members, handling the friction of scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* CEO Agent */}
            <div className="bg-white p-8 rounded-2xl border border-[#e2e2e2] hover:shadow-xl transition-all text-center flex flex-col items-center">
              <div className="relative w-28 h-28 mb-6">
                <div className="w-full h-full bg-[#f3f3f3] rounded-full flex items-center justify-center border-2 border-[#c4c7c8]">
                  <Bot className="w-12 h-12 text-[#5e5e5f]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#1b1b1b] mb-2">CEO Agent</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Live Status</span>
              </div>
              <p className="text-xs text-[#5e5e5f] italic mb-6 leading-relaxed">
                "Analyzing Q4 Revenue growth and simulating market expansion scenarios."
              </p>
              <div className="w-full h-1.5 bg-[#f3f3f3] rounded-full overflow-hidden mb-2">
                <div className="h-full bg-[#5e5e5f] w-[82%]" />
              </div>
              <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                Decision Confidence: 82%
              </span>
            </div>

            {/* CTO Agent */}
            <div className="bg-white p-8 rounded-2xl border border-[#e2e2e2] hover:shadow-xl transition-all text-center flex flex-col items-center">
              <div className="relative w-28 h-28 mb-6">
                <div className="w-full h-full bg-[#f3f3f3] rounded-full flex items-center justify-center border-2 border-[#c4c7c8]">
                  <Terminal className="w-12 h-12 text-[#5e5e5d]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#1b1b1b] mb-2">CTO Agent</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Live Status</span>
              </div>
              <p className="text-xs text-[#5e5e5f] italic mb-6 leading-relaxed">
                "Optimizing global server latency and orchestrating microservice deployment."
              </p>
              <div className="w-full h-1.5 bg-[#f3f3f3] rounded-full overflow-hidden mb-2">
                <div className="h-full bg-[#5e5e5d] w-[96%]" />
              </div>
              <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                Network Health: 96%
              </span>
            </div>

            {/* Finance Agent */}
            <div className="bg-white p-8 rounded-2xl border border-[#e2e2e2] hover:shadow-xl transition-all text-center flex flex-col items-center">
              <div className="relative w-28 h-28 mb-6">
                <div className="w-full h-full bg-[#f3f3f3] rounded-full flex items-center justify-center border-2 border-[#c4c7c8]">
                  <Wallet className="w-12 h-12 text-[#5e6141]" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#1b1b1b] mb-2">Finance Agent</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Live Status</span>
              </div>
              <p className="text-xs text-[#5e5e5f] italic mb-6 leading-relaxed">
                "Executing algorithmic treasury management and cost optimization."
              </p>
              <div className="w-full h-1.5 bg-[#f3f3f3] rounded-full overflow-hidden mb-2">
                <div className="h-full bg-[#5e6141] w-[88%]" />
              </div>
              <span className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                Burn Rate Delta: -12%
              </span>
            </div>
          </div>
        </section>

        {/* Native Integrations */}
        <section className="py-20 bg-white border-y border-[#e2e2e2]">
          <div className="px-6 md:px-12 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div>
                <h2 className="font-['Inter'] text-3xl sm:text-4xl font-bold text-[#1b1b1b] mb-3">
                  Native Integrations
                </h2>
                <p className="text-base text-[#5e5e5f] max-w-xl">
                  Cerefy doesn't replace your tools; it inhabits them. Over 500+ enterprise-grade connections ready for deployment.
                </p>
              </div>
              <button
                onClick={() => handleLaunchWorkspace('integrations')}
                className="text-[#1b1b1b] font-bold flex items-center gap-2 border border-[#c4c7c8] px-6 py-3 rounded-lg hover:bg-[#f3f3f3] transition-all cursor-pointer text-sm"
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
                  className="bg-[#f9f9f9] p-6 rounded-xl border border-[#e2e2e2] flex flex-col items-center justify-center h-32 hover:bg-[#eeeeee] cursor-pointer transition-all"
                >
                  <Cpu className="w-8 h-8 mb-2 text-[#5e5e5f]" />
                  <span className="text-xs font-bold text-[#1b1b1b]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-['Inter'] text-3xl sm:text-4xl font-bold text-[#1b1b1b] mb-4">
              Scalable Intelligence
            </h2>
            <p className="text-base sm:text-lg text-[#5e5e5f] max-w-xl mx-auto">
              Tailored plans for startups to global enterprises.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Starter */}
            <div className="bg-white p-8 rounded-2xl border border-[#e2e2e2] flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#5e5e5f] mb-2">Starter</h3>
                <div className="text-4xl font-bold text-[#1b1b1b] mb-2">$0</div>
                <p className="text-xs text-[#5e5e5f] mb-6">Free forever for small teams</p>
                <ul className="space-y-3 text-xs text-[#1b1b1b] mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 1 Knowledge Graph</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 5 AI Agents</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Standard Security</li>
                </ul>
              </div>
              <button
                onClick={() => handleLaunchWorkspace('command-center')}
                className="w-full py-3 border border-[#c4c7c8] text-[#1b1b1b] font-bold rounded-lg hover:bg-[#f3f3f3] transition-all text-xs cursor-pointer"
              >
                Choose Starter
              </button>
            </div>

            {/* Pro */}
            <div className="bg-[#f3f3f3] p-8 rounded-2xl border-2 border-[#5e5e5f] flex flex-col justify-between relative shadow-lg">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#5e5e5f] text-white text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Recommended
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#1b1b1b] mb-2">Pro</h3>
                <div className="text-4xl font-bold text-[#1b1b1b] mb-2">$249<span className="text-xs font-normal text-[#5e5e5f]">/mo</span></div>
                <p className="text-xs text-[#5e5e5f] mb-6">Scaling intelligence for high-growth firms</p>
                <ul className="space-y-3 text-xs text-[#1b1b1b] mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Unlimited Graphs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 25 AI Agents</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> SOC2 Compliance</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 24/7 Priority Support</li>
                </ul>
              </div>
              <button
                onClick={() => handleLaunchWorkspace('command-center')}
                className="w-full py-3 bg-[#5e5e5f] hover:bg-[#1b1b1b] text-white font-bold rounded-lg transition-all text-xs cursor-pointer shadow-md"
              >
                Get Pro
              </button>
            </div>

            {/* Business */}
            <div className="bg-white p-8 rounded-2xl border border-[#e2e2e2] flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#5e5e5f] mb-2">Business</h3>
                <div className="text-4xl font-bold text-[#1b1b1b] mb-2">$899<span className="text-xs font-normal text-[#5e5e5f]">/mo</span></div>
                <p className="text-xs text-[#5e5e5f] mb-6">For large-scale team orchestration</p>
                <ul className="space-y-3 text-xs text-[#1b1b1b] mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Custom Agent Builder</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> 100 AI Agents</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Data Residency Control</li>
                </ul>
              </div>
              <button
                onClick={() => handleLaunchWorkspace('command-center')}
                className="w-full py-3 border border-[#c4c7c8] text-[#1b1b1b] font-bold rounded-lg hover:bg-[#f3f3f3] transition-all text-xs cursor-pointer"
              >
                Choose Business
              </button>
            </div>

            {/* Enterprise */}
            <div className="bg-[#1b1b1b] text-white p-8 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-[#888888] mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-white mb-2">Custom</div>
                <p className="text-xs text-[#888888] mb-6">Tailored OS for multinational corps</p>
                <ul className="space-y-3 text-xs text-white/90 mb-8">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Infinite Scaling</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Dedicated Compute</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Solutions Architect</li>
                </ul>
              </div>
              <button
                onClick={() => setDemoModalOpen(true)}
                className="w-full py-3 bg-white text-[#1b1b1b] font-bold rounded-lg hover:bg-zinc-200 transition-all text-xs cursor-pointer"
              >
                Contact Sales
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-16 border-t border-[#e5e5e5] bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 px-6 md:px-12 max-w-[1440px] mx-auto mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <LogoIcon className="h-7 w-7 text-[#080E38]" />
              <span className="font-['Inter'] text-2xl font-bold tracking-tight text-[#1b1b1b]">Cerefy</span>
            </div>
            <p className="text-xs text-[#666666] leading-relaxed max-w-xs mb-4">
              Building the cognitive infrastructure for the next generation of global industry. Authority. Intelligence. OS.
            </p>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1b1b1b] block mb-4">Platform</span>
            <ul className="space-y-2 text-xs text-[#5e5e5f]">
              <li><button onClick={() => handleLaunchWorkspace('security')} className="hover:text-[#1b1b1b]">Security</button></li>
              <li><button onClick={() => handleLaunchWorkspace('orchestrator')} className="hover:text-[#1b1b1b]">Architecture</button></li>
              <li><button onClick={() => handleLaunchWorkspace('analytics')} className="hover:text-[#1b1b1b]">Case Studies</button></li>
            </ul>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1b1b1b] block mb-4">Company</span>
            <ul className="space-y-2 text-xs text-[#5e5e5f]">
              <li><button onClick={() => handleLaunchWorkspace('knowledge')} className="hover:text-[#1b1b1b]">Documentation</button></li>
              <li><button onClick={() => handleLaunchWorkspace('command-center')} className="hover:text-[#1b1b1b]">Press Kit</button></li>
              <li><button onClick={() => handleLaunchWorkspace('security')} className="hover:text-[#1b1b1b]">Privacy</button></li>
            </ul>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1b1b1b] block mb-4">Systems</span>
            <ul className="space-y-2 text-xs text-[#5e5e5f]">
              <li><button onClick={() => handleLaunchWorkspace('telemetry')} className="hover:text-[#1b1b1b]">Status</button></li>
              <li><button onClick={() => handleLaunchWorkspace('command-center')} className="hover:text-[#1b1b1b]">Careers</button></li>
              <li><button onClick={() => handleLaunchWorkspace('telemetry')} className="hover:text-[#1b1b1b]">API Docs</button></li>
            </ul>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#1b1b1b] block mb-4">Connect</span>
            <ul className="space-y-2 text-xs text-[#5e5e5f]">
              <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-[#1b1b1b]">Twitter</a></li>
              <li><a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-[#1b1b1b]">LinkedIn</a></li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#1b1b1b]">GitHub</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[#e2e2e2] px-6 md:px-12 max-w-[1440px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#5e5e5f]">
          <p>© 2024 Cerefy Intelligence OS. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            <span className="font-mono text-[11px] font-bold">ALL SYSTEMS NOMINAL</span>
          </div>
        </div>
      </footer>

      {/* Book Demo Modal */}
      <AnimatePresence>
        {demoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl relative border border-[#c4c7c8]"
            >
              <button
                onClick={() => setDemoModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-[#5e5e5f] hover:text-[#1b1b1b] rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {!demoSubmitted ? (
                <>
                  <h3 className="font-['Inter'] text-2xl font-bold text-[#1b1b1b] mb-2">
                    Book an Executive Demo
                  </h3>
                  <p className="text-xs text-[#5e5e5f] mb-6">
                    See how Cerefy OS can automate your enterprise workflows and scale your team autonomously.
                  </p>

                  <form onSubmit={handleBookDemoSubmit} className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-bold text-[#5e5e5f] uppercase tracking-wider mb-1">Full Name</label>
                      <input
                        required
                        type="text"
                        value={demoForm.name}
                        onChange={(e) => setDemoSubmittedForm({ ...demoForm, name: e.target.value })}
                        placeholder="Executive Name"
                        className="w-full px-3 py-2 bg-[#f3f3f3] border border-[#c4c7c8] rounded-lg text-sm text-[#1b1b1b] outline-none focus:border-[#1b1b1b]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5e5e5f] uppercase tracking-wider mb-1">Work Email</label>
                      <input
                        required
                        type="email"
                        value={demoForm.email}
                        onChange={(e) => setDemoSubmittedForm({ ...demoForm, email: e.target.value })}
                        placeholder="executive@company.com"
                        className="w-full px-3 py-2 bg-[#f3f3f3] border border-[#c4c7c8] rounded-lg text-sm text-[#1b1b1b] outline-none focus:border-[#1b1b1b]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#5e5e5f] uppercase tracking-wider mb-1">Company Name</label>
                      <input
                        required
                        type="text"
                        value={demoForm.company}
                        onChange={(e) => setDemoSubmittedForm({ ...demoForm, company: e.target.value })}
                        placeholder="Acme Corp"
                        className="w-full px-3 py-2 bg-[#f3f3f3] border border-[#c4c7c8] rounded-lg text-sm text-[#1b1b1b] outline-none focus:border-[#1b1b1b]"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#1b1b1b] text-white font-bold rounded-lg hover:bg-[#5e5e5f] transition-all text-sm cursor-pointer shadow-lg mt-2"
                    >
                      Request Live Demo
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="font-['Inter'] text-2xl font-bold text-[#1b1b1b]">Demo Confirmed</h3>
                  <p className="text-xs text-[#5e5e5f] leading-relaxed">
                    Thank you, {demoForm.name}. A Cerefy solutions architect has been assigned and will contact you at <span className="font-bold text-[#1b1b1b]">{demoForm.email}</span> within 2 hours.
                  </p>
                  <button
                    onClick={() => {
                      setDemoModalOpen(false);
                      setDemoSubmitted(false);
                    }}
                    className="px-6 py-2.5 bg-[#f3f3f3] border border-[#c4c7c8] text-[#1b1b1b] font-bold rounded-lg text-xs hover:bg-[#e2e2e2] transition-all cursor-pointer"
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
