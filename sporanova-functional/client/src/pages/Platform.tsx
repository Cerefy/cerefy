import { Link } from "react-router";
import PublicNav from "../components/PublicNav";
import AnimatedSection from "../components/AnimatedSection";
import ExplainerVideo from "../components/ExplainerVideo";
import Logo from "../components/Logo";

const layers = [
  { id: "01", label: "Data", title: "Universal Data Connectivity", desc: "Connect any data source — structured databases, unstructured documents, real-time streams, and external APIs. SOPRANOVA normalizes and semantically indexes everything into a unified enterprise knowledge graph.", color: "#4A7FA5" },
  { id: "02", label: "Intelligence", title: "Reasoning & Analysis", desc: "A sophisticated reasoning layer that understands your business context, identifies patterns across disparate data sources, and generates actionable insights grounded in evidence.", color: "#5B6FA8" },
  { id: "03", label: "Agents", title: "Autonomous AI Agents", desc: "Deploy specialized agents that monitor, analyze, and act within defined parameters. Each agent maintains context, learns from outcomes, and collaborates with the broader intelligence system.", color: "#6B7FBF" },
  { id: "04", label: "Decisions", title: "Decision Intelligence", desc: "Transform insights into structured decisions with full evidence trails, stakeholder routing, and approval workflows. Every decision is traceable, auditable, and reversible.", color: "#8B8FC4" },
  { id: "05", label: "Actions", title: "Intelligent Automation", desc: "Close the loop from insight to action. Trigger workflows, notify stakeholders, update systems, and measure outcomes — all within a unified, auditable automation layer.", color: "#4A8B8C" },
];

export default function Platform() {
  return (
    <div className="min-h-screen bg-sn-white">
      <PublicNav />
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="sn-label mb-6">The Platform</div>
          <h1 className="sn-display mb-6" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#1A1F3C", maxWidth: "700px" }}>
            One intelligent operating layer for your entire enterprise.
          </h1>
          <p className="text-lg leading-relaxed mb-16" style={{ color: "#6B6660", maxWidth: "560px" }}>
            SOPRANOVA is not a tool. It is a platform — a continuous intelligence layer that sits above your data, your teams, and your systems, turning information into decisions at the speed of business.
          </p>
        </AnimatedSection>

        {/* Platform explainer film container — asset pending generation */}
        <AnimatedSection className="mb-24" delay={140}>
          <ExplainerVideo
            label="Platform Film"
            title="Every stream of enterprise data, organized into one operating layer."
            description="A look at how SOPRANOVA receives structured, unstructured, and real-time signals and turns them into a single, ordered system of record."
          />
        </AnimatedSection>

        {/* Platform diagram */}
        <AnimatedSection className="mb-24" delay={100}>
          <div className="rounded-3xl p-10 md:p-16 relative overflow-hidden" style={{ background: "#1A1F3C" }}>
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(107,127,191,0.12) 0%, transparent 65%)" }} />
            <div className="relative">
              <div className="sn-label mb-8" style={{ color: "rgba(248,246,242,0.4)" }}>Intelligence flow</div>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {["Data", "Intelligence", "Agents", "Decisions", "Actions"].map((step, i) => (
                  <div key={step} className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2 mx-auto"
                        style={{ background: `rgba(107,127,191,${0.12 + i * 0.06})`, border: "1px solid rgba(107,127,191,0.2)" }}>
                        <span className="text-xs font-semibold" style={{ color: "rgba(248,246,242,0.8)" }}>0{i + 1}</span>
                      </div>
                      <div className="text-sm font-medium" style={{ color: "#F8F6F2" }}>{step}</div>
                    </div>
                    {i < 4 && (
                      <div className="hidden md:block w-8 h-px" style={{ background: "rgba(107,127,191,0.35)" }}>
                        <div className="w-full h-full flex items-center justify-end">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "rgba(107,127,191,0.6)" }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Layers */}
        <div className="space-y-5">
          {layers.map((layer, i) => (
            <AnimatedSection key={layer.id} delay={i * 60}>
              <div className="rounded-2xl p-8 border transition-all duration-300" style={{ background: "#FAFAF8", borderColor: "#E8E6E2" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = layer.color + "40"; (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#E8E6E2"; (e.currentTarget as HTMLDivElement).style.transform = ""; }}>
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: layer.color + "15" }}>
                      <span className="text-xs font-semibold" style={{ color: layer.color }}>{layer.id}</span>
                    </div>
                  </div>
                  <div>
                    <div className="sn-label mb-2" style={{ color: layer.color }}>{layer.label}</div>
                    <h3 className="text-xl font-medium mb-3" style={{ color: "#1A1F3C" }}>{layer.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#6B6660", maxWidth: "600px" }}>{layer.desc}</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* CTA */}
        <AnimatedSection className="mt-20 text-center" delay={200}>
          <div className="sn-label mb-4">Begin with SOPRANOVA</div>
          <h2 className="sn-display mb-6" style={{ fontSize: "2rem", color: "#1A1F3C" }}>Ready to see it in action?</h2>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/signup" className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300"
              style={{ background: "#1A1F3C", color: "#FAFAF8" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#252B4A"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1F3C"; e.currentTarget.style.transform = ""; }}>
              Get Started
            </Link>
            <Link to="/contact" className="px-6 py-3 rounded-xl text-sm font-medium border transition-all duration-300"
              style={{ borderColor: "#D4D1CB", color: "#1A1F3C" }}>
              Request Demo
            </Link>
          </div>
        </AnimatedSection>
      </div>

      <footer className="border-t border-sn-100 py-10">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Logo size={20} showWordmark />
          <div className="text-sm" style={{ color: "#B8B4AC" }}>© 2026 SOPRANOVA</div>
        </div>
      </footer>
    </div>
  );
}
