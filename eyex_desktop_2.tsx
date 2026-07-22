// HEADER
<header className="fixed top-0 right-0 left-80 z-50 flex justify-between items-center px-margin-desktop h-20 bg-background/80 backdrop-blur-xl border-b border-white/10">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined text-primary">visibility</span>
<h1 className="font-headline-md text-headline-md font-bold tracking-tighter text-primary">CORE_VISION_DASHBOARD</h1>
</div>
<div className="flex items-center gap-6">
<div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded">
<div className="status-dot-pulse"></div>
<span className="font-mono-data text-[12px] text-secondary-fixed-dim">AI_CORE_ONLINE</span>
</div>
<button className="material-symbols-outlined text-on-surface-variant hover:text-secondary-container transition-colors scale-95 duration-200">menu</button>
</div>
</header>

// MAIN
<main className="flex-1 ml-80 flex flex-col bg-background">
{/* TopAppBar (Shared Component) */}
<header className="fixed top-0 right-0 left-80 z-50 flex justify-between items-center px-margin-desktop h-20 bg-background/80 backdrop-blur-xl border-b border-white/10">
<div className="flex items-center gap-4">
<span className="material-symbols-outlined text-primary">visibility</span>
<h1 className="font-headline-md text-headline-md font-bold tracking-tighter text-primary">CORE_VISION_DASHBOARD</h1>
</div>
<div className="flex items-center gap-6">
<div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded">
<div className="status-dot-pulse"></div>
<span className="font-mono-data text-[12px] text-secondary-fixed-dim">AI_CORE_ONLINE</span>
</div>
<button className="material-symbols-outlined text-on-surface-variant hover:text-secondary-container transition-colors scale-95 duration-200">menu</button>
</div>
</header>
{/* Dashboard Content */}
<div className="mt-20 p-8 grid grid-cols-12 gap-6 flex-1 overflow-y-auto">
{/* Left Side: Live Feed */}
<section className="col-span-8 flex flex-col gap-6">
<div className="relative w-full aspect-video rounded overflow-hidden glass-panel group">
{/* Background Feed */}
<div className="absolute inset-0 z-0">
<img className="w-full h-full object-cover opacity-60" data-alt="A high-definition security camera perspective of a bustling futuristic smart factory with robotic arms, automated carts, and technical diagnostic overlays. The lighting is cold and clinical, dominated by deep blacks and vibrant electric cyan data streams. Cinematic high-tech industrial aesthetic with motion blur and sharp technical detail." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA73DLEcQ8ReVNMKWu1ZcRIxQ57HgSh60Xy5p8BKFHFcK8oG3MsT1NUaDo0xD6nCt4WX25XU6ZyeTG-X2WC5jTMW75Sbd94VtByCw8WXfA0fWHRUXJnxk3O9z_ylRFpp0SyIFxHDlKVSv-KV9v5aLO6CXt8BxQ_o-QpY17BuO8SnJtR2JSZrchCQh2JSmjOO502jyyhBc86kqu0GppmOgttXatGNrLMs53WkKopWJDLgf1bFGpLBREwAEB46QJtyWFJfgcEAZIg208B"/>
</div>
{/* HUD Overlays */}
<div className="absolute inset-0 z-10 p-6 pointer-events-none flex flex-col justify-between">
<div className="flex justify-between items-start">
<div className="flex flex-col gap-2">
<div className="font-mono-data text-[12px] bg-black/60 px-3 py-1 border-l-2 border-secondary-fixed-dim">CAM_01 // SEC_SECTOR_7G</div>
<div className="font-mono-data text-[10px] text-on-surface-variant">UTC 2024-05-24 14:22:01.045</div>
</div>
<div className="flex gap-2">
<span className="material-symbols-outlined text-secondary-fixed-dim text-sm" style="font-variation-settings: 'FILL' 1;">videocam</span>
<span className="font-mono-data text-[12px] text-primary">RECORDING_HD</span>
</div>
</div>
{/* Bounding Boxes (Visual effects) */}
<div className="absolute top-[30%] left-[25%] w-32 h-48 bounding-box">
<div className="bounding-label">OBJECT_HUMAN_01: 99.4%</div>
</div>
<div className="absolute top-[50%] left-[60%] w-40 h-24 bounding-box">
<div className="bounding-label">ASSET_ROBOT_A4: 98.2%</div>
</div>
<div className="flex justify-between items-end">
<div className="flex flex-col gap-1">
<div className="h-1 w-48 bg-white/10">
<div className="h-full bg-secondary-fixed-dim w-3/4"></div>
</div>
<span className="font-mono-data text-[10px] text-on-surface-variant uppercase">Buffer Capacity</span>
</div>
<div className="flex gap-4">
<button className="pointer-events-auto px-4 py-2 bg-white text-black font-label-caps text-label-caps rounded-sm hover:active-glow transition-all">ZOOM_OPTIC</button>
<button className="pointer-events-auto px-4 py-2 border border-white/20 text-white font-label-caps text-label-caps rounded-sm hover:bg-white/5 transition-all">THERMAL_TOGGLE</button>
</div>
</div>
</div>
</div>
{/* Bottom Section: System Performance */}
<div className="glass-card-top-weighted p-6 rounded-lg flex flex-col gap-4">
<div className="flex justify-between items-center">
<h3 className="font-label-caps text-label-caps text-primary tracking-widest flex items-center gap-2">
<span className="material-symbols-outlined text-sm">show_chart</span>
                            SYSTEM_PERFORMANCE
                        </h3>
<div className="flex gap-4 font-mono-data text-[10px] text-on-surface-variant">
<span className="flex items-center gap-1"><span className="w-2 h-2 bg-secondary-fixed-dim rounded-full"></span> GPU LOAD</span>
<span className="flex items-center gap-1"><span className="w-2 h-2 bg-white rounded-full"></span> INF_TPS</span>
</div>
</div>
<div className="h-48 w-full relative">

{/* Simulated Grid and Chart */}
<div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-10">
<div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-b border-white"></div>
<div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-b border-white"></div>
<div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-r border-b border-white"></div><div className="border-b border-white"></div>
<div className="border-r border-white"></div><div className="border-r border-white"></div><div className="border-r border-white"></div><div className="border-r border-white"></div><div className="border-r border-white"></div><div></div>
</div>
</div>
</div>
</section>
{/* Right Side: KPIs and Alerts */}
<section className="col-span-4 flex flex-col gap-6">
{/* KPI Cards */}
<div className="grid grid-cols-1 gap-4">
<div className="glass-card-top-weighted p-5 rounded-lg">
<div className="font-label-caps text-[10px] text-on-surface-variant mb-1">AVG_CONFIDENCE</div>
<div className="flex items-end justify-between">
<span className="font-mono-data text-4xl text-primary">98.4%</span>
<span className="font-mono-data text-[12px] text-secondary-fixed-dim">+0.2%</span>
</div>
</div>
<div className="glass-card-top-weighted p-5 rounded-lg">
<div className="font-label-caps text-[10px] text-on-surface-variant mb-1">NETWORK_LATENCY</div>
<div className="flex items-end justify-between">
<span className="font-mono-data text-4xl text-primary">12<span className="text-xl">ms</span></span>
<span className="font-mono-data text-[12px] text-secondary-fixed-dim">STABLE</span>
</div>
</div>
<div className="glass-card-top-weighted p-5 rounded-lg">
<div className="font-label-caps text-[10px] text-on-surface-variant mb-1">DETECTIONS_HR</div>
<div className="flex items-end justify-between">
<span className="font-mono-data text-4xl text-primary">4,822</span>
<span className="font-mono-data text-[12px] text-on-error">PEAK</span>
</div>
</div>
</div>
{/* Real-time Alerts List */}
<div className="glass-panel rounded-lg flex-1 flex flex-col overflow-hidden">
<div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
<h3 className="font-label-caps text-label-caps text-primary">REAL_TIME_ALERTS</h3>
<span className="px-2 py-0.5 bg-error-container text-[10px] font-mono-data rounded text-on-error-container">3 CRITICAL</span>
</div>
<div className="flex-1 overflow-y-auto">
<div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
<div className="flex items-center justify-between mb-2">
<span className="font-mono-data text-[10px] text-error">CRITICAL_EVENT_402</span>
<span className="font-mono-data text-[10px] text-on-surface-variant">14:21:44</span>
</div>
<p className="font-body-md text-sm text-primary mb-1">Unauthorized personnel detected in SEC_02</p>
<span className="font-label-caps text-[9px] text-on-surface-variant group-hover:text-secondary-fixed-dim">VIEW_LOGS →</span>
</div>
<div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
<div className="flex items-center justify-between mb-2">
<span className="font-mono-data text-[10px] text-secondary-fixed-dim">INFO_LOG_881</span>
<span className="font-mono-data text-[10px] text-on-surface-variant">14:19:12</span>
</div>
<p className="font-body-md text-sm text-on-surface-variant mb-1">Automated drone charging cycle initiated</p>
<span className="font-label-caps text-[9px] text-on-surface-variant group-hover:text-secondary-fixed-dim">VIEW_LOGS →</span>
</div>
<div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
<div className="flex items-center justify-between mb-2">
<span className="font-mono-data text-[10px] text-error">CRITICAL_EVENT_391</span>
<span className="font-mono-data text-[10px] text-on-surface-variant">14:15:01</span>
</div>
<p className="font-body-md text-sm text-primary mb-1">Optical obstruction on CAM_04</p>
<span className="font-label-caps text-[9px] text-on-surface-variant group-hover:text-secondary-fixed-dim">VIEW_LOGS →</span>
</div>
<div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
<div className="flex items-center justify-between mb-2">
<span className="font-mono-data text-[10px] text-on-surface-variant">SYS_UPDATE_002</span>
<span className="font-mono-data text-[10px] text-on-surface-variant">14:02:33</span>
</div>
<p className="font-body-md text-sm text-on-surface-variant mb-1">Deep Learning weights sync complete</p>
<span className="font-label-caps text-[9px] text-on-surface-variant group-hover:text-secondary-fixed-dim">VIEW_LOGS →</span>
</div>
<div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
<div className="flex items-center justify-between mb-2">
<span className="font-mono-data text-[10px] text-error">CRITICAL_EVENT_388</span>
<span className="font-mono-data text-[10px] text-on-surface-variant">13:58:20</span>
</div>
<p className="font-body-md text-sm text-primary mb-1">Temperature threshold exceeded in RACK_01</p>
<span className="font-label-caps text-[9px] text-on-surface-variant group-hover:text-secondary-fixed-dim">VIEW_LOGS →</span>
</div>
</div>
<div className="p-3 text-center bg-white/2">
<button className="font-label-caps text-[10px] text-on-surface-variant hover:text-primary transition-colors">CLEAR_ALL_NOTIFICATIONS</button>
</div>
</div>
</section>
</div>
{/* Footer Shell (Shared Component) */}
<footer className="w-full py-6 px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5 bg-background">
<span className="font-label-caps text-label-caps text-primary">EYEX_CORE_SYST</span>
<div className="flex gap-8">
<a className="font-mono-data text-mono-data text-on-surface-variant hover:text-secondary-fixed-dim underline transition-all" href="#">Documentation</a>
<a className="font-mono-data text-mono-data text-on-surface-variant hover:text-secondary-fixed-dim underline transition-all" href="#">API</a>
<a className="font-mono-data text-mono-data text-on-surface-variant hover:text-secondary-fixed-dim underline transition-all" href="#">Terms</a>
</div>
<p className="font-mono-data text-mono-data text-on-surface-variant opacity-80">© 2024 EYEX CORE. ALL RIGHTS RESERVED.</p>
</footer>
</main>

// FOOTER
<footer className="w-full py-6 px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-4 border-t border-white/5 bg-background">
<span className="font-label-caps text-label-caps text-primary">EYEX_CORE_SYST</span>
<div className="flex gap-8">
<a className="font-mono-data text-mono-data text-on-surface-variant hover:text-secondary-fixed-dim underline transition-all" href="#">Documentation</a>
<a className="font-mono-data text-mono-data text-on-surface-variant hover:text-secondary-fixed-dim underline transition-all" href="#">API</a>
<a className="font-mono-data text-mono-data text-on-surface-variant hover:text-secondary-fixed-dim underline transition-all" href="#">Terms</a>
</div>
<p className="font-mono-data text-mono-data text-on-surface-variant opacity-80">© 2024 EYEX CORE. ALL RIGHTS RESERVED.</p>
</footer>