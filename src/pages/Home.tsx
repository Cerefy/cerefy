import { Users, ShieldCheck, BarChart3, Globe, Code, Terminal, ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/components/providers/auth-provider";

export function HomePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <>
      <main className="relative pt-16">
        {/* Background Decorative Orbs */}
        <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.1)_0%,rgba(56,189,248,0)_70%)] blur-[80px] z-[-1] pointer-events-none" />
        <div
          className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[80px] z-[-1] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, rgba(56, 189, 248, 0) 70%)",
          }}
        />

        {/* Hero Section */}
        <section className="max-w-[1200px] mx-auto px-6 pt-32 pb-24 text-center" data-fade-up>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-eye-border bg-eye-surface/50 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary-brand animate-pulse" />
            <span className="font-mono text-[10px] text-eye-text tracking-widest uppercase">
              System Status: Optimal
            </span>
          </div>
          <h1 className="text-[72px] md:text-[84px] font-medium text-eye-white leading-[1] mb-8 tracking-[-0.04em]">
            Intelligence,
            <br />
            Architected.
          </h1>
          <p className="text-[20px] leading-[1.6] text-eye-text max-w-2xl mx-auto mb-12">
            The foundational AI infrastructure layer for the world's most ambitious companies.
            Secure, scalable, and built for the next generation of intelligent systems.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a
              className="luminous-btn-primary px-8 py-4 rounded-md font-medium text-[16px]"
              href="#"
            >
              Get Started
            </a>
            <a
              className="px-8 py-4 rounded-md font-medium text-[16px] text-eye-white border border-eye-border hover:border-primary-brand/50 transition-all flex items-center gap-2"
              href="#"
            >
              View Documentation
              <ArrowRight size={18} />
            </a>
          </div>
        </section>

        {/* Product Visual Section */}
        <section className="max-w-[1200px] mx-auto px-6 mb-32" data-fade-up>
          <div className="rounded-xl overflow-hidden border border-eye-border bg-eye-surface relative">
            <img
              alt="EyeX R&D Lab"
              className="w-full h-auto opacity-80"
              src="https://lh3.googleusercontent.com/aida/AP1WRLsbNJeyilLhaKujz0G9YjWVEIDuNcDN4Ai2KzrPvpB51BHkfQ9WJJiUno537UZnLxzT5wvwpFdVnbKpFpryJ3mFNwtBaoGpJVlbAzR7Weg67FysgkuI1FJh7XKnLTb5z5vZ-bGIb6JLaa5EX_E03apM29tJQk4cPSMpchLRJSHg3sEKhakBalaDWp_eaqOaYDcTk8_k-wV6M9UZXy6qFSHYay8iNXHbf2fpeX-0_s5Dhl5FbuAJVEVLDd8"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-eye-bg via-transparent to-transparent" />
            <div className="absolute bottom-12 left-12 max-w-md">
              <p className="font-mono text-primary-brand mb-2">INFRASTRUCTURE LAYER 01</p>
              <h3 className="text-[36px] font-medium text-eye-white leading-[1.2] tracking-[-0.01em]">
                Built for physical reliability.
              </h3>
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="max-w-[1200px] mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Multi-Agent */}
            <div className="bento-card p-8 rounded-xl md:col-span-2" data-fade-up>
              <div className="flex justify-between items-start mb-12">
                <div>
                  <Users className="text-primary-brand mb-4" size={32} />
                  <h3 className="text-[36px] font-medium text-eye-white mb-2 leading-[1.2] tracking-[-0.01em]">
                    Multi-Agent AI
                  </h3>
                  <p className="text-eye-text text-[14px] leading-[1.6] max-w-sm">
                    Orchestrate autonomous workflows across distributed systems with unified state
                    management.
                  </p>
                </div>
                <div className="font-mono text-[10px] text-eye-text border border-eye-border px-2 py-1 rounded">
                  V2.4.0
                </div>
              </div>
              <div className="w-full h-48 bg-eye-bg rounded border border-eye-border flex items-center justify-center relative group">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 border border-primary-brand/20 rounded-full animate-[spin_10s_linear_infinite]" />
                  <div className="w-24 h-24 border border-primary-brand/40 rounded-full animate-[spin_6s_linear_infinite_reverse] absolute" />
                  <div className="w-4 h-4 bg-primary-brand rounded-full blur-[2px]" />
                </div>
                <span className="font-mono text-[10px] text-eye-text relative z-10">
                  AGENT_ORCHESTRATOR_IDLE
                </span>
              </div>
            </div>

            {/* Card 2: Security */}
            <div className="bento-card p-8 rounded-xl" data-fade-up>
              <ShieldCheck className="text-primary-brand mb-4" size={32} />
              <h3 className="text-[24px] font-medium text-eye-white mb-2 leading-[1.2] tracking-[-0.01em]">
                Enterprise Security
              </h3>
              <p className="text-eye-text text-[14px] leading-[1.6] mb-8">
                Zero-trust architecture purpose-built for LLM data privacy and residency.
              </p>
              <div className="space-y-3">
                <div className="h-2 w-full bg-eye-border rounded-full overflow-hidden">
                  <div className="h-full bg-primary-brand w-full animate-[pulse_2s_infinite]" />
                </div>
                <div className="flex justify-between font-mono text-[10px] text-eye-text">
                  <span>ENCRYPTION ACTIVE</span>
                  <span>AES-256</span>
                </div>
              </div>
            </div>

            {/* Card 3: Real-Time Analytics */}
            <div className="bento-card p-8 rounded-xl" data-fade-up>
              <BarChart3 className="text-primary-brand mb-4" size={32} />
              <h3 className="text-[24px] font-medium text-eye-white mb-2 leading-[1.2] tracking-[-0.01em]">
                Real-Time Analytics
              </h3>
              <p className="text-eye-text text-[14px] leading-[1.6]">
                Live system health metrics and observability dashboards.
              </p>
              <div className="mt-8 flex items-end gap-1 h-24">
                <div className="w-full bg-primary-brand/20 h-[30%] rounded-sm" />
                <div className="w-full bg-primary-brand/30 h-[50%] rounded-sm" />
                <div className="w-full bg-primary-brand/20 h-[40%] rounded-sm" />
                <div className="w-full bg-primary-brand/60 h-[80%] rounded-sm animate-pulse" />
                <div className="w-full bg-primary-brand h-[100%] rounded-sm" />
              </div>
            </div>

            {/* Card 4: Global Scale */}
            <div className="bento-card p-8 rounded-xl md:col-span-2" data-fade-up>
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <Globe className="text-primary-brand mb-4" size={32} />
                  <h3 className="text-[36px] font-medium text-eye-white mb-2 leading-[1.2] tracking-[-0.01em]">
                    Global Scale
                  </h3>
                  <p className="text-eye-text text-[14px] leading-[1.6]">
                    Distributed edge clusters ensure low-latency inference regardless of user
                    location.
                  </p>
                  <div className="mt-6 flex gap-4">
                    <div className="px-3 py-1 bg-eye-surface border border-eye-border rounded font-mono text-[10px]">
                      US-EAST-1
                    </div>
                    <div className="px-3 py-1 bg-eye-surface border border-eye-border rounded font-mono text-[10px]">
                      EU-WEST-2
                    </div>
                    <div className="px-3 py-1 bg-eye-surface border border-eye-border rounded font-mono text-[10px]">
                      AP-SOUTH-1
                    </div>
                  </div>
                </div>
                <div className="flex-1 w-full h-40 bg-eye-surface rounded-lg border border-eye-border flex items-center justify-center opacity-50 overflow-hidden">
                  <div className="relative w-full h-full">
                    <div className="absolute top-1/2 left-1/4 w-1 h-1 bg-primary-brand rounded-full shadow-[0_0_8px_#3abff8]" />
                    <div className="absolute top-1/3 left-2/3 w-1 h-1 bg-primary-brand rounded-full shadow-[0_0_8px_#3abff8]" />
                    <div className="absolute top-2/3 left-1/2 w-1 h-1 bg-primary-brand rounded-full shadow-[0_0_8px_#3abff8]" />
                    <svg className="w-full h-full" viewBox="0 0 100 50">
                      <path
                        d="M10,25 Q30,5 50,25 T90,25"
                        fill="none"
                        stroke="rgba(56, 189, 248, 0.1)"
                        strokeWidth="0.5"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 5: API-First */}
            <div className="bento-card p-8 rounded-xl" data-fade-up>
              <Code className="text-primary-brand mb-4" size={32} />
              <h3 className="text-[24px] font-medium text-eye-white mb-2 leading-[1.2] tracking-[-0.01em]">
                API-First
              </h3>
              <p className="text-eye-text text-[14px] leading-[1.6]">
                Native support for REST and gRPC endpoints for seamless integration.
              </p>
              <div className="mt-6 font-mono text-[11px] text-primary-brand/80 bg-black/40 p-3 rounded border border-eye-border">
                <span className="text-white">POST</span> /v1/orchestrate
              </div>
            </div>

            {/* Card 6: Dev Experience */}
            <div className="bento-card p-8 rounded-xl" data-fade-up>
              <Terminal className="text-primary-brand mb-4" size={32} />
              <h3 className="text-[24px] font-medium text-eye-white mb-2 leading-[1.2] tracking-[-0.01em]">
                Developer Experience
              </h3>
              <p className="text-eye-text text-[14px] leading-[1.6]">
                Typed SDKs and professional CLI tools for rapid deployment.
              </p>
              <div className="mt-6 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="font-mono text-[10px] text-eye-text">CLI READY</span>
              </div>
            </div>
          </div>
        </section>

        {/* Human Context Section */}
        <section className="max-w-[1200px] mx-auto px-6 mb-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div data-fade-up>
              <h2 className="text-[36px] font-medium text-eye-white mb-6 leading-[1.2] tracking-[-0.01em]">
                Engineered by architects, for architects.
              </h2>
              <p className="text-[20px] leading-[1.6] text-eye-text mb-8">
                Our team consists of industry veterans who have built core infrastructure for the
                world's leading technology providers. We understand the mission-critical nature of
                your stack.
              </p>
              <div className="flex gap-4">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-eye-bg bg-eye-surface" />
                  <div className="w-10 h-10 rounded-full border-2 border-eye-bg bg-eye-surface" />
                  <div className="w-10 h-10 rounded-full border-2 border-eye-bg bg-eye-surface" />
                </div>
                <div className="text-eye-white font-medium self-center">
                  Trusted by 500+ Engineering Teams
                </div>
              </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-eye-border" data-fade-up>
              <img
                alt="Engineering Team"
                className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 transition-all duration-700"
                src="https://lh3.googleusercontent.com/aida/AP1WRLtdCX8IHniEQAkqFaTsBrEZES86Q61dq-ZpaYHTaMIpPh6OxeGZTJr9MbupUuxWSt7A0dmbrzgQZGKLLvSvuPptDym8hC0yHQy3Gkb0LgRibS48Ugd1eRFyXEINysszASBLa4UvTM7A651NcUBJZnZLa5E3ZJMuiEZY4Zw_rY6XlASXjy58FF2zZw-Zba3SowkzKSNTPOi7Rrz5Rh_yIf6-5zQ7H8b2ciO7PheqnOMQuDM2QpEUILf72pU"
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-[1200px] mx-auto px-6 mb-32" data-fade-up>
          <div className="bento-card p-16 rounded-2xl text-center relative">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div
                className="w-full h-full"
                style={{
                  backgroundImage: "radial-gradient(#3abff8 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
            </div>
            <h2 className="text-[48px] text-eye-white mb-8 relative z-10 font-medium tracking-[-0.02em]">
              Start building the future of enterprise AI today.
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
              <button className="luminous-btn-primary px-10 py-5 rounded-md font-bold text-[18px]">
                Initialize Stack
              </button>
              <button className="px-10 py-5 rounded-md font-bold text-[18px] text-eye-white border border-eye-border hover:bg-eye-surface transition-all">
                Speak to an Architect
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
