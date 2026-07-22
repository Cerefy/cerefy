// HEADER
<header className="fixed top-0 w-full z-50 flex justify-between items-center px-margin-mobile md:px-margin-desktop h-20 bg-background/80 dark:bg-background/80 backdrop-blur-xl border-b border-white/10">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined text-primary font-headline-md text-headline-md">visibility</span>
<span className="font-headline-md text-headline-md font-bold tracking-tighter text-primary dark:text-primary">EyeX</span>
</div>
<nav className="hidden md:flex gap-10 items-center">
<a className="font-label-caps text-label-caps text-primary transition-colors hover:text-secondary-container" href="#">Vision Hero</a>
<a className="font-label-caps text-label-caps text-on-surface-variant transition-colors hover:text-secondary-container" href="#">Solutions</a>
<a className="font-label-caps text-label-caps text-on-surface-variant transition-colors hover:text-secondary-container" href="#">Analytics</a>
<a className="font-label-caps text-label-caps text-on-surface-variant transition-colors hover:text-secondary-container" href="#">Contact</a>
</nav>
<div className="flex items-center gap-6">
<button className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors">menu</button>
</div>
</header>

// MAIN
<main className="pt-20">
{/* Hero Section */}
<section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-margin-mobile md:px-margin-desktop overflow-hidden">
{/* Background HUD Effect */}
<div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full animate-[pulse_8s_infinite]"></div>
<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/10 rounded-full animate-[pulse_6s_infinite]"></div>
</div>
<div className="relative z-10 space-y-8 max-w-4xl">
<div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-4">
<span className="w-1.5 h-1.5 bg-secondary-fixed-dim rounded-full animate-pulse"></span>
<span className="font-mono-data text-[10px] tracking-widest uppercase">System Active: Core V4.0</span>
</div>
<div className="flex justify-center mb-12">
<img alt="EyeX Core Logo" className="w-48 h-48 neural-glow object-contain" src="https://lh3.googleusercontent.com/aida/AP1WRLsLbZ-VBDg4luluTD5SP6JG-zi3fZuUZCz24SsHbZ-G6d-IcrtOpBdQK_fmKdZewh9zFqvdGS70AlmHCQwT-R6FpGS64_pNJyFEwF2Zdy4FjmTQI_bmblpZGmzW00Rf5qoDQpC6tswbvpxabWQzGMgOU_TgklJRfei-RUV6aNyaumREl0ffcQjFoMv4FB9Ctl7dugvriBUThq_M_Iu-8z4e8Pb_2k6q2vedMAai9Nt9XG807sPWQB3wOhZl"/>
</div>
<h1 className="font-display-lg text-[64px] md:text-[96px] leading-[1.1] tracking-tighter text-primary">
                    The Future of <span className="text-secondary-fixed-dim italic">Vision AI</span>
</h1>
<p className="font-body-lg text-on-surface-variant max-w-2xl mx-auto opacity-80">
                    Intelligence Amplified. We provide the neural framework for high-performance vision environments, blending Swiss-engineered precision with futuristic adaptive intelligence.
                </p>
<div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-8">
<button className="bg-primary text-background font-label-caps text-label-caps px-8 py-4 rounded-lg hover:bg-secondary-fixed-dim transition-all duration-300 transform active:scale-95 uppercase tracking-widest">
                        Initialize Core
                    </button>
<button className="border border-white/20 text-primary font-label-caps text-label-caps px-8 py-4 rounded-lg hover:border-white transition-all duration-300 uppercase tracking-widest">
                        View Documentation
                    </button>
</div>
</div>
</section>
{/* Section 01-03 Horizontal Layout */}
<section className="px-margin-desktop py-24 bg-surface-container-lowest">
<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
{/* 01 Neural Processing */}
<div className="group p-8 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 rounded-xl relative overflow-hidden">
<div className="absolute top-0 right-0 p-4 font-mono-data text-white/10 text-6xl font-bold select-none">01</div>
<div className="space-y-6">
<span className="material-symbols-outlined text-secondary-fixed-dim text-4xl">psychology</span>
<h3 className="font-headline-md text-headline-md text-primary">Neural Mesh</h3>
<p className="font-body-md text-on-surface-variant opacity-70">
                            Proprietary architecture designed for sub-millisecond object detection and environmental mapping in high-density data streams.
                        </p>
<div className="pt-4 flex items-center gap-2 text-secondary-fixed-dim font-label-caps text-label-caps uppercase tracking-wider cursor-pointer group-hover:gap-4 transition-all">
                            Explore Mesh <span className="material-symbols-outlined text-sm">arrow_forward</span>
</div>
</div>
</div>
{/* 02 Predictive Vision */}
<div className="group p-8 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 rounded-xl relative overflow-hidden">
<div className="absolute top-0 right-0 p-4 font-mono-data text-white/10 text-6xl font-bold select-none">02</div>
<div className="space-y-6">
<span className="material-symbols-outlined text-secondary-fixed-dim text-4xl">visibility</span>
<h3 className="font-headline-md text-headline-md text-primary">Predictive Sight</h3>
<p className="font-body-md text-on-surface-variant opacity-70">
                            Anticipate movements and environmental shifts using integrated temporal analysis models built for mission-critical reliability.
                        </p>
<div className="pt-4 flex items-center gap-2 text-secondary-fixed-dim font-label-caps text-label-caps uppercase tracking-wider cursor-pointer group-hover:gap-4 transition-all">
                            Core Specs <span className="material-symbols-outlined text-sm">arrow_forward</span>
</div>
</div>
</div>
{/* 03 Seamless API */}
<div className="group p-8 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 rounded-xl relative overflow-hidden">
<div className="absolute top-0 right-0 p-4 font-mono-data text-white/10 text-6xl font-bold select-none">03</div>
<div className="space-y-6">
<span className="material-symbols-outlined text-secondary-fixed-dim text-4xl">hub</span>
<h3 className="font-headline-md text-headline-md text-primary">Global Link</h3>
<p className="font-body-md text-on-surface-variant opacity-70">
                            Deploy instantly across distributed edge networks with a single unified API designed for hardware-agnostic integration.
                        </p>
<div className="pt-4 flex items-center gap-2 text-secondary-fixed-dim font-label-caps text-label-caps uppercase tracking-wider cursor-pointer group-hover:gap-4 transition-all">
                            API Docs <span className="material-symbols-outlined text-sm">arrow_forward</span>
</div>
</div>
</div>
</div>
</section>
{/* Core Capabilities Bento Grid */}
<section className="px-margin-desktop py-32 bg-background">
<div className="mb-16">
<span className="font-label-caps text-label-caps text-secondary-fixed-dim uppercase tracking-widest block mb-2">Systems &amp; Performance</span>
<h2 className="font-display-lg text-primary text-[48px] tracking-tight">Core Capabilities</h2>
</div>
<div className="grid grid-cols-12 grid-rows-2 gap-6 h-[700px]">
{/* Large Analytics Card */}
<div className="col-span-8 row-span-2 glass-panel p-10 rounded-xl flex flex-col justify-between overflow-hidden relative group">
<div className="z-10">
<h4 className="font-headline-md text-headline-md text-primary mb-4">Spatial Intelligence Dashboard</h4>
<p className="font-body-md text-on-surface-variant max-w-md opacity-80">
                            Real-time data visualization of neural processing clusters. Monitor performance metrics with zero latency.
                        </p>
</div>
<div className="absolute bottom-0 right-0 w-2/3 h-2/3 opacity-20 group-hover:opacity-40 transition-opacity duration-700">
<div className="w-full h-full border-l border-t border-white/10 p-6 flex items-end">
<div className="flex items-end gap-1 w-full h-full">
<div className="w-4 bg-primary h-[30%]" style="transition: height 1s; height: 45%;"></div>
<div className="w-4 bg-secondary-fixed-dim h-[60%]" style="transition: height 1.2s; height: 75%;"></div>
<div className="w-4 bg-primary h-[40%]" style="transition: height 0.8s; height: 60%;"></div>
<div className="w-4 bg-secondary-fixed-dim h-[80%]" style="transition: height 1.5s; height: 90%;"></div>
<div className="w-4 bg-primary h-[20%]" style="transition: height 1.1s; height: 55%;"></div>
</div>
</div>
</div>
<div className="z-10 flex gap-4">
<div className="px-4 py-2 bg-white/5 border border-white/10 rounded flex items-center gap-2">
<span className="material-symbols-outlined text-secondary-fixed-dim text-sm">query_stats</span>
<span className="font-mono-data text-xs text-primary">Live Optimization</span>
</div>
</div>
</div>
{/* Adaptive Logic */}
<div className="col-span-4 row-span-1 glass-panel p-8 rounded-xl flex flex-col justify-center gap-4 hover-cyan transition-all duration-300">
<span className="material-symbols-outlined text-primary text-3xl">terminal</span>
<h4 className="font-headline-md text-[24px] text-primary">Adaptive Logic</h4>
<p className="font-body-md text-on-surface-variant text-sm opacity-70">
                        Self-correcting algorithms that evolve based on site-specific visual patterns.
                    </p>
</div>
{/* Hardware Sync */}
<div className="col-span-4 row-span-1 border border-white/10 p-8 rounded-xl flex flex-col justify-center gap-4 bg-surface-container-high/40">
<span className="material-symbols-outlined text-secondary-fixed-dim text-3xl">memory</span>
<h4 className="font-headline-md text-[24px] text-primary">Hardware Sync</h4>
<p className="font-body-md text-on-surface-variant text-sm opacity-70">
                        Optimized for next-gen silicon. Direct-to-chip vision acceleration.
                    </p>
</div>
</div>
</section>
{/* CTA Section */}
<section className="py-32 px-margin-desktop text-center bg-surface-dim border-y border-white/5">
<div className="max-w-3xl mx-auto space-y-12">
<h2 className="font-display-lg text-[48px] text-primary leading-tight">Ready to integrate the future of vision?</h2>
<div className="flex justify-center">
<a className="group relative inline-flex items-center gap-4 px-12 py-6 bg-primary text-background font-label-caps text-label-caps uppercase tracking-widest rounded-lg overflow-hidden transition-all duration-500" href="#">
<span className="relative z-10">Request Access</span>
<span className="material-symbols-outlined relative z-10 transition-transform group-hover:translate-x-2">arrow_forward</span>
<div className="absolute inset-0 bg-secondary-fixed-dim transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
</a>
</div>
</div>
</section>
</main>

// FOOTER
<footer className="w-full py-20 px-margin-desktop bg-background border-t border-white/10">
<div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
<div className="col-span-1 md:col-span-1 space-y-6">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-primary text-2xl">visibility</span>
<span className="font-label-caps text-label-caps text-primary text-xl">EyeX</span>
</div>
<p className="font-body-md text-on-surface-variant opacity-60 max-w-xs">
                    Engineering the next generation of visual intelligence. High-performance, low-latency, mission-ready.
                </p>
</div>
<div className="space-y-6">
<h5 className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Platform</h5>
<ul className="space-y-4 font-mono-data text-mono-data text-on-surface-variant">
<li><a className="hover:text-secondary-fixed-dim underline decoration-transparent hover:decoration-secondary-fixed-dim transition-all" href="#">Documentation</a></li>
<li><a className="hover:text-secondary-fixed-dim underline decoration-transparent hover:decoration-secondary-fixed-dim transition-all" href="#">API Reference</a></li>
<li><a className="hover:text-secondary-fixed-dim underline decoration-transparent hover:decoration-secondary-fixed-dim transition-all" href="#">Core Systems</a></li>
<li><a className="hover:text-secondary-fixed-dim underline decoration-transparent hover:decoration-secondary-fixed-dim transition-all" href="#">Changelog</a></li>
</ul>
</div>
<div className="space-y-6">
<h5 className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Company</h5>
<ul className="space-y-4 font-mono-data text-mono-data text-on-surface-variant">
<li><a className="hover:text-secondary-fixed-dim underline decoration-transparent hover:decoration-secondary-fixed-dim transition-all" href="#">About EyeX</a></li>
<li><a className="hover:text-secondary-fixed-dim underline decoration-transparent hover:decoration-secondary-fixed-dim transition-all" href="#">Careers</a></li>
<li><a className="hover:text-secondary-fixed-dim underline decoration-transparent hover:decoration-secondary-fixed-dim transition-all" href="#">Contact</a></li>
<li><a className="hover:text-secondary-fixed-dim underline decoration-transparent hover:decoration-secondary-fixed-dim transition-all" href="#">Privacy</a></li>
</ul>
</div>
<div className="space-y-6">
<h5 className="font-label-caps text-label-caps text-primary uppercase tracking-widest">Newsletter</h5>
<div className="flex flex-col gap-4">
<div className="relative">
<input className="w-full bg-transparent border border-white/20 px-4 py-3 font-mono-data text-xs text-primary focus:outline-none focus:border-secondary-fixed-dim transition-colors uppercase tracking-widest" placeholder="YOUR@EMAIL.COM" type="email"/>
<button className="absolute right-2 top-1/2 -translate-y-1/2 material-symbols-outlined text-secondary-fixed-dim">arrow_forward</button>
</div>
</div>
</div>
</div>
<div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5">
<span className="font-mono-data text-mono-data text-on-surface-variant/40">© 2024 EYEX CORE. ALL RIGHTS RESERVED.</span>
<div className="flex gap-8 mt-4 md:mt-0 font-mono-data text-mono-data text-on-surface-variant/40">
<span>V4.0.2</span>
<span>STATUS: STABLE</span>
</div>
</div>
</footer>