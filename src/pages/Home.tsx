export function HomePage() {
  return (
    <div className="pt-20">
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-margin-mobile md:px-margin-desktop overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full animate-[pulse_8s_infinite]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full animate-[pulse_6s_infinite]"></div>
        </div>
        <div className="relative z-10 space-y-8 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-secondary-fixed-dim rounded-full animate-pulse"></span>
            <span className="font-mono-data text-[10px] tracking-widest uppercase">
              Cerefy AI Startup Builder
            </span>
          </div>
          <div className="flex justify-center mb-12">
            <img
              alt="Cerefy Logo"
              className="w-48 h-48 neural-glow object-contain"
              src="https://lh3.googleusercontent.com/aida/AP1WRLsLbZ-VBDg4luluTD5SP6JG-zi3fZuUZCz24SsHbZ-G6d-IcrtOpBdQK_fmKdZewh9zFqvdGS70AlmHCQwT-R6FpGS64_pNJyFEwF2Zdy4FjmTQI_bmblpZGmzW00Rf5qoDQpC6tswbvpxabWQzGMgOU_TgklJRfei-RUV6aNyaumREl0ffcQjFoMv4FB9Ctl7dugvriBUThq_M_Iu-8z4e8Pb_2k6q2vedMAai9Nt9XG807sPWQB3wOhZl"
            />
          </div>
          <h1 className="font-display-lg text-[64px] md:text-[96px] leading-[1.1] tracking-tighter text-primary">
            Build Startups with <span className="text-secondary-fixed-dim italic">AI Agents</span>
          </h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto opacity-80">
            Cerefy is the AI Startup Builder Platform. Deploy founding agents — CEO, CTO, Product,
            CFO, Marketing, and Investor — to accelerate your company from idea to launch.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-8">
            <button className="bg-primary text-background font-label-caps text-label-caps px-8 py-4 rounded-lg hover:bg-secondary-fixed-dim transition-all duration-300 transform active:scale-95 uppercase tracking-widest">
              Start Building
            </button>
            <button className="border border-white/20 text-primary font-label-caps text-label-caps px-8 py-4 rounded-lg hover:border-white transition-all duration-300 uppercase tracking-widest">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      <section className="px-margin-desktop py-24 bg-surface-container-lowest">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group p-8 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 font-mono-data text-white/10 text-6xl font-bold select-none">
              01
            </div>
            <div className="space-y-6">
              <span className="material-symbols-outlined text-secondary-fixed-dim text-4xl">
                psychology
              </span>
              <h3 className="font-headline-md text-headline-md text-primary">AI Founding Team</h3>
              <p className="font-body-md text-on-surface-variant opacity-70">
                Deploy specialized AI agents — CEO, CTO, CFO, Product, Marketing, and Investor —
                each working in parallel to build your startup.
              </p>
              <div className="pt-4 flex items-center gap-2 text-secondary-fixed-dim font-label-caps text-label-caps uppercase tracking-wider cursor-pointer group-hover:gap-4 transition-all">
                Meet the Team{" "}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          </div>
          <div className="group p-8 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 font-mono-data text-white/10 text-6xl font-bold select-none">
              02
            </div>
            <div className="space-y-6">
              <span className="material-symbols-outlined text-secondary-fixed-dim text-4xl">
                hub
              </span>
              <h3 className="font-headline-md text-headline-md text-primary">Startup Workspace</h3>
              <p className="font-body-md text-on-surface-variant opacity-70">
                Track progress, manage tasks, review documents, and monitor your AI agents in real
                time from a unified dashboard.
              </p>
              <div className="pt-4 flex items-center gap-2 text-secondary-fixed-dim font-label-caps text-label-caps uppercase tracking-wider cursor-pointer group-hover:gap-4 transition-all">
                Open Workspace{" "}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          </div>
          <div className="group p-8 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 font-mono-data text-white/10 text-6xl font-bold select-none">
              03
            </div>
            <div className="space-y-6">
              <span className="material-symbols-outlined text-secondary-fixed-dim text-4xl">
                auto_awesome
              </span>
              <h3 className="font-headline-md text-headline-md text-primary">AI Workflow</h3>
              <p className="font-body-md text-on-surface-variant opacity-70">
                Watch your startup move through the building pipeline — Idea, Research, Business
                Model, Product, Technology, and Launch.
              </p>
              <div className="pt-4 flex items-center gap-2 text-secondary-fixed-dim font-label-caps text-label-caps uppercase tracking-wider cursor-pointer group-hover:gap-4 transition-all">
                See Workflow{" "}
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-margin-desktop py-32 bg-background">
        <div className="mb-16">
          <span className="font-label-caps text-label-caps text-secondary-fixed-dim uppercase tracking-widest block mb-2">
            AI Powered
          </span>
          <h2 className="font-display-lg text-primary text-[48px] tracking-tight">
            How Cerefy Works
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-2 gap-6 md:h-[700px]">
          <div className="col-span-1 md:col-span-8 md:row-span-2 glass-panel p-10 rounded-xl flex flex-col justify-between overflow-hidden relative group">
            <div className="z-10">
              <h4 className="font-headline-md text-headline-md text-primary mb-4">
                Startup Intelligence Dashboard
              </h4>
              <p className="font-body-md text-on-surface-variant max-w-md opacity-80">
                Monitor your AI founding agents in real time. Track progress, review outputs, and
                steer your startup toward launch.
              </p>
            </div>
            <div className="absolute bottom-0 right-0 w-2/3 h-2/3 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
              <div className="w-full h-full border-l border-t border-white/10 p-6 flex items-end">
                <div className="flex items-end gap-1 w-full h-full">
                  <div className="w-1/6 bg-secondary-fixed-dim h-1/4 rounded-t-sm"></div>
                  <div className="w-1/6 bg-secondary-fixed-dim/80 h-2/4 rounded-t-sm"></div>
                  <div className="w-1/6 bg-secondary-fixed-dim/60 h-1/3 rounded-t-sm"></div>
                  <div className="w-1/6 bg-secondary-fixed-dim/40 h-3/4 rounded-t-sm"></div>
                  <div className="w-1/6 bg-secondary-fixed-dim/90 h-full rounded-t-sm"></div>
                  <div className="w-1/6 bg-white/20 h-1/2 rounded-t-sm"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-1 md:col-span-4 glass-panel p-8 rounded-xl relative overflow-hidden group">
            <span className="material-symbols-outlined text-secondary-fixed-dim text-3xl mb-4">
              speed
            </span>
            <h4 className="font-headline-md text-headline-md text-primary mb-2 text-2xl">
              Rapid Building
            </h4>
            <p className="font-body-md text-on-surface-variant opacity-70">
              From idea to launch in minutes, not months.
            </p>
            <div className="absolute -right-4 -bottom-4 text-9xl text-white/[0.03] font-mono-data font-bold group-hover:text-secondary-fixed-dim/10 transition-colors">
              6x
            </div>
          </div>
          <div className="col-span-1 md:col-span-4 glass-panel p-8 rounded-xl relative overflow-hidden group">
            <span className="material-symbols-outlined text-secondary-fixed-dim text-3xl mb-4">
              security
            </span>
            <h4 className="font-headline-md text-headline-md text-primary mb-2 text-2xl">
              Investor Ready
            </h4>
            <p className="font-body-md text-on-surface-variant opacity-70">
              AI-generated pitch decks, financials, and roadmaps.
            </p>
            <div className="absolute -right-4 -bottom-4 text-9xl text-white/[0.03] font-mono-data font-bold group-hover:text-secondary-fixed-dim/10 transition-colors">
              $2.4M
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
