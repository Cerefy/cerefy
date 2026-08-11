import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoIcon } from './LogoIcon';
import { MsIcon } from './kinetic/primitives';

const navLinks = [
  { label: 'Home', href: '#home', active: true },
  { label: 'Mission Control', href: '#dashboard' },
  { label: 'Agent Studio', href: '#agent-studio' },
  { label: 'Memory', href: '#memory' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'Marketplace', href: '#marketplace' },
  { label: 'Workflows', href: '#workflows' },
  { label: 'Dev Portal', href: '#developer-portal' },
];

const Page: React.FC = () => {
  const navigate = useNavigate();
  const go = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background text-on-surface font-body antialiased overflow-x-hidden selection:bg-primary/20 selection:text-primary">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center px-6 md:px-16 max-w-7xl mx-auto h-16">
          <div className="flex items-center gap-8">
            <a className="flex items-center gap-3 text-2xl font-headline font-bold tracking-tight text-on-surface" href="#home">
              <LogoIcon className="w-8 h-8 text-on-surface" />
              <span>Cerefy</span>
            </a>
            <div className="hidden md:flex gap-6 items-center">
              {navLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  className={
                    l.active
                      ? 'text-on-surface font-semibold border-b-2 border-primary pb-1 font-body text-base tracking-tight hover:text-primary transition-colors duration-200'
                      : 'text-on-surface-variant font-medium font-body text-base tracking-tight hover:text-primary transition-colors duration-200'
                  }
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => go('/login')}
              className="hidden md:flex text-on-surface hover:text-primary font-medium text-sm transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              onClick={() => go('/register')}
              className="bg-on-surface text-surface px-5 py-2 rounded-lg font-medium hover:bg-on-surface/90 transition-all scale-95 duration-100 items-center gap-2 text-sm tracking-wide cursor-pointer flex"
            >
              Book Demo
              <MsIcon name="arrow_forward" size={16} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        {/* Hero Section */}
        <section id="home" className="relative min-h-[90vh] flex items-center justify-center px-6 md:px-16 overflow-hidden">
          <div className="bg-glow top-0 left-1/2 -translate-x-1/2" />
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 flex flex-col gap-8 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-outline-variant/20 w-fit">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-label text-xs tracking-widest text-on-surface-variant uppercase">
                  Intelligence OS v2.0 Live
                </span>
              </div>
              <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tighter leading-tight text-on-surface">
                The Operating System <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-on-surface to-outline">
                  for Enterprise AI.
                </span>
              </h1>
              <p className="font-body text-lg md:text-xl text-on-surface-variant max-w-2xl leading-relaxed">
                Deploy, manage, and scale intelligent agents across your entire organization with zero latency and
                infinite context. The architectural foundation for the $10B enterprise.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => go('/register')}
                  className="bg-on-surface text-surface px-8 py-4 rounded-lg font-medium hover:bg-on-surface/90 transition-all flex items-center justify-center gap-2 shadow-sm text-base cursor-pointer"
                >
                  Initialize OS
                  <MsIcon name="terminal" size={20} fill />
                </button>
                <button className="glass-panel text-on-surface px-8 py-4 rounded-lg font-medium hover:bg-surface-container transition-all flex items-center justify-center gap-2 border border-outline-variant/30 text-base cursor-pointer">
                  Read Architecture Docs
                </button>
              </div>
            </div>
            <div className="lg:col-span-5 relative z-10 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden glass-panel shadow-2xl border border-outline-variant/20 group">
                <div className="absolute inset-0 bg-gradient-to-br from-surface-container-lowest to-surface-container opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Neural core visualization */}
                  <div className="relative w-72 h-72">
                    <div className="absolute inset-0 rounded-full border border-outline-variant/30" />
                    <div className="absolute inset-8 rounded-full border border-dashed border-outline-variant/40 animate-[spin_30s_linear_infinite]" />
                    <div className="absolute inset-16 rounded-full border border-outline-variant/50" />
                    <div className="absolute inset-0 m-auto w-20 h-20 rounded-2xl bg-surface-container flex items-center justify-center shadow-sm border border-outline-variant/30">
                      <LogoIcon className="w-10 h-10 text-on-surface" />
                    </div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary animate-ping opacity-60" />
                  </div>
                </div>
                <div className="absolute bottom-4 left-4 right-4 glass-panel rounded-xl p-4 flex items-center justify-between border border-outline-variant/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                      <MsIcon name="memory" className="text-primary" size={20} />
                    </div>
                    <div>
                      <p className="font-label text-xs text-on-surface-variant uppercase tracking-wider">
                        Node Status
                      </p>
                      <p className="font-body text-sm font-semibold text-on-surface">Optimal Processing</p>
                    </div>
                  </div>
                  <MsIcon name="check_circle" className="text-primary/50" size={20} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROI / Impact Bento Grid */}
        <section id="dashboard" className="py-24 px-6 md:px-16 bg-surface-container-low/50 relative border-y border-outline-variant/10">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-4">
                Enterprise Impact Architecture
              </h2>
              <p className="font-body text-on-surface-variant text-lg">
                Quantifiable ROI delivered through deterministic AI execution.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Card 1 (Span 8) */}
              <div className="md:col-span-8 glass-panel rounded-2xl p-8 relative overflow-hidden group border border-outline-variant/20 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
                <div className="relative z-10 flex flex-col h-full justify-between gap-12">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-center">
                      <MsIcon name="speed" className="text-on-surface" size={24} />
                    </div>
                    <span className="font-label text-xs px-3 py-1 bg-surface-container-lowest rounded-full border border-outline-variant/20 text-on-surface-variant">
                      Performance Metric
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-2 tracking-tighter">
                      99.9%
                    </h3>
                    <p className="font-headline text-xl font-medium text-on-surface mb-2">Reduction in Latency</p>
                    <p className="font-body text-on-surface-variant text-sm max-w-md">
                      Proprietary neural caching layer eliminates redundant processing, accelerating response times
                      across all deployed agents.
                    </p>
                  </div>
                </div>
              </div>
              {/* Card 2 (Span 4) */}
              <div className="md:col-span-4 glass-panel rounded-2xl p-8 relative overflow-hidden border border-outline-variant/20 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-center mb-6">
                    <MsIcon name="security" className="text-on-surface" size={24} />
                  </div>
                  <div>
                    <h3 className="font-display text-3xl font-bold text-on-surface mb-2 tracking-tight">Zero-Trust</h3>
                    <p className="font-headline text-lg font-medium text-on-surface mb-2">Enterprise Security</p>
                    <p className="font-body text-on-surface-variant text-sm">
                      Military-grade isolation for every agent container. Data never leaves your VPC.
                    </p>
                  </div>
                </div>
              </div>
              {/* Card 3 (Span 4) */}
              <div className="md:col-span-4 glass-panel rounded-2xl p-8 relative overflow-hidden border border-outline-variant/20 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-center mb-6">
                    <MsIcon name="account_tree" className="text-on-surface" size={24} />
                  </div>
                  <div>
                    <h3 className="font-display text-3xl font-bold text-on-surface mb-2 tracking-tight">Infinite</h3>
                    <p className="font-headline text-lg font-medium text-on-surface mb-2">Context Memory</p>
                    <p className="font-body text-on-surface-variant text-sm">
                      Vector-native storage architecture allows agents to recall enterprise-wide data instantly.
                    </p>
                  </div>
                </div>
              </div>
              {/* Card 4 (Span 8) */}
              <div className="md:col-span-8 bg-on-surface text-surface rounded-2xl p-8 relative overflow-hidden group shadow-lg">
                <div className="relative z-10 flex flex-col md:flex-row gap-8 h-full items-center">
                  <div className="flex-1">
                    <h3 className="font-display text-3xl font-bold mb-4 tracking-tight">The Autonomous Engine</h3>
                    <p className="font-body text-surface-variant text-base mb-6 max-w-md opacity-80">
                      Replace static workflows with dynamic, goal-oriented agent swarms that adapt to real-time
                      enterprise constraints.
                    </p>
                    <button
                      onClick={() => go('/workspace/bpmn')}
                      className="px-5 py-2.5 rounded-lg font-medium bg-surface text-on-surface hover:bg-surface-variant transition-colors text-sm flex items-center gap-2 cursor-pointer"
                    >
                      View Logic Flow
                      <MsIcon name="arrow_forward" size={16} />
                    </button>
                  </div>
                  <div className="w-full md:w-1/2 aspect-video rounded-xl bg-inverse-surface border border-outline/30 flex items-center justify-center p-4 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 p-4 font-label text-xs text-surface-variant font-mono text-left whitespace-pre">
                      {`> initializing core...
> compiling vectors...
[OK] context loaded
> deploying agent_01
[OK] active listening`}
                    </div>
                    <div className="w-16 h-16 rounded-full border-2 border-primary/50 flex items-center justify-center animate-[spin_10s_linear_infinite]">
                      <div className="w-12 h-12 rounded-full border border-surface-variant/20 flex items-center justify-center">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Ecosystem Section */}
        <section id="marketplace" className="py-24 px-6 md:px-16 relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="max-w-2xl">
                <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-4">
                  Universal Integration
                </h2>
                <p className="font-body text-on-surface-variant text-lg">
                  Native connectors for the core systems that run your business. Connect once, orchestrate
                  everywhere.
                </p>
              </div>
              <button
                onClick={() => go('/workspace/integrations')}
                className="font-label text-sm tracking-wide text-primary hover:text-on-surface transition-colors flex items-center gap-1 uppercase cursor-pointer"
              >
                View All Integrations <MsIcon name="arrow_forward" size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { name: 'GitHub Enterprise', desc: 'Automate PR reviews, code generation, and repository indexing with continuous sync.', icon: 'code' },
                { name: 'Salesforce CRM', desc: 'Real-time bi-directional sync for lead intelligence and autonomous customer outreach.', icon: 'cloud' },
                { name: 'SAP ERP', desc: 'Deep integration into financial and operational data lakes for predictive resource planning.', icon: 'database' },
              ].map((c) => (
                <div
                  key={c.name}
                  onClick={() => go('/workspace/integrations')}
                  className="glass-panel p-6 rounded-xl border border-outline-variant/20 hover:border-outline-variant/40 transition-colors group cursor-pointer flex flex-col h-full justify-between gap-8 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="w-14 h-14 bg-surface-container rounded-xl flex items-center justify-center shadow-sm">
                      <MsIcon name={c.icon} className="text-on-surface" size={28} />
                    </div>
                    <MsIcon
                      name="north_east"
                      className="text-outline-variant opacity-0 group-hover:opacity-100 transition-opacity"
                      size={18}
                    />
                  </div>
                  <div>
                    <h4 className="font-headline text-lg font-semibold text-on-surface mb-1">{c.name}</h4>
                    <p className="font-body text-sm text-on-surface-variant">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section id="agent-studio" className="py-24 px-6 md:px-16 bg-surface-container-low/50 border-y border-outline-variant/10">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-on-surface mb-4">
              Pay for Outcomes, Not Seat Licenses
            </h2>
            <p className="font-body text-on-surface-variant text-lg max-w-2xl mx-auto mb-12">
              Every plan includes the full operating system. Scale your workforce of agents as you grow.
            </p>
            <button
              onClick={() => go('/pricing')}
              className="bg-on-surface text-surface px-8 py-4 rounded-lg font-medium hover:bg-on-surface/90 transition-all shadow-sm text-base cursor-pointer"
            >
              View Pricing Plans
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 px-6 md:px-16 bg-surface-container-highest border-t border-outline-variant mt-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <LogoIcon className="w-10 h-10 text-on-surface object-contain" />
            </div>
            <p className="text-3xl font-bold font-headline text-on-surface mb-2">Cerefy</p>
            <p className="font-body text-sm text-on-surface-variant">
              The intelligence operating system for the enterprise.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Legal</span>
            <a onClick={() => go('/login')} className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
              Privacy Policy
            </a>
            <a onClick={() => go('/login')} className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
              Terms of Service
            </a>
          </div>
          <div className="flex flex-col gap-3">
            <span className="font-label text-xs uppercase tracking-widest text-on-surface-variant mb-2">Company</span>
            <a onClick={() => go('/workspace/security')} className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
              Security
            </a>
            <a onClick={() => go('/workspace/telemetry')} className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
              System Status
            </a>
          </div>
          <div className="flex justify-start md:justify-end items-start">
            <button
              onClick={() => go('/workspace')}
              className="font-label text-xs tracking-wider uppercase bg-surface border border-outline-variant/30 px-4 py-2 rounded text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            >
              Enter System Portal
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-outline-variant/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-xs text-on-surface-variant">
            © {new Date().getFullYear()} Cerefy. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-signal animate-pulse" />
            <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">
              All Systems Nominal
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Page;