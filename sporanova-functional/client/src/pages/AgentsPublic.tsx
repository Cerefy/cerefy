import { Link } from "react-router";
import PublicNav from "../components/PublicNav";
import AnimatedSection from "../components/AnimatedSection";
import Logo from "../components/Logo";

const agents = [
  { name: "Revenue Analyst", purpose: "Monitors revenue signals, detects anomalies, and surfaces pricing opportunities across all business units.", status: "active", color: "#4A8B8C" },
  { name: "Customer Intelligence", purpose: "Tracks customer health, predicts churn risk, and identifies expansion opportunities within existing accounts.", status: "active", color: "#5B6FA8" },
  { name: "Market Analyst", purpose: "Continuously monitors competitive intelligence, market signals, and regulatory changes relevant to your sector.", status: "active", color: "#6B7FBF" },
  { name: "Operations Agent", purpose: "Analyzes operational efficiency, identifies process bottlenecks, and recommends resource optimization strategies.", status: "idle", color: "#4A7FA5" },
  { name: "Risk Monitor", purpose: "Flags emerging risks across financial, operational, and reputational domains before they escalate.", status: "active", color: "#8B8FC4" },
  { name: "Forecast Agent", purpose: "Builds and maintains rolling forecasts across revenue, headcount, and operational metrics with confidence intervals.", status: "idle", color: "#4A8B8C" },
];

export default function AgentsPublic() {
  return (
    <div className="min-h-screen bg-sn-white">
      <PublicNav />
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="sn-label mb-6">AI Agents</div>
          <h1 className="sn-display mb-6" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#1A1F3C", maxWidth: "700px" }}>
            Agents that work<br />
            <span style={{ color: "#6B7FBF" }}>while you think.</span>
          </h1>
          <p className="text-lg leading-relaxed mb-16" style={{ color: "#6B6660", maxWidth: "560px" }}>
            SOPRANOVA agents are not chatbots. They are specialized intelligence systems that operate continuously, collaborate with each other, and surface outcomes — not just information.
          </p>
        </AnimatedSection>

        {/* Agent grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
          {agents.map((agent, i) => (
            <AnimatedSection key={agent.name} delay={i * 50}>
              <div className="p-6 rounded-2xl border h-full transition-all duration-300" style={{ background: "#FAFAF8", borderColor: "#E8E6E2" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(26,31,60,0.06)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-semibold" style={{ background: "#1A1F3C", color: "#F8F6F2" }}>
                    {agent.name[0]}
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                    background: agent.status === "active" ? "#EEF6F6" : "#F4F3F0",
                    color: agent.status === "active" ? "#4A8B8C" : "#8C887F",
                  }}>{agent.status}</span>
                </div>
                <div className="font-medium mb-2" style={{ color: "#1A1F3C" }}>{agent.name}</div>
                <p className="text-sm leading-relaxed" style={{ color: "#8C887F" }}>{agent.purpose}</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: agent.status === "active" ? "#4A8B8C" : "#B8B4AC" }} />
                  <span className="text-xs" style={{ color: "#B8B4AC" }}>Monitoring 24/7</span>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Collaboration section */}
        <AnimatedSection delay={200}>
          <div className="rounded-2xl p-10 md:p-14 text-center" style={{ background: "#F4F3F0" }}>
            <div className="sn-label mb-4">Agent Ecosystem</div>
            <h2 className="sn-display mb-4" style={{ fontSize: "2rem", color: "#1A1F3C" }}>Agents that collaborate</h2>
            <p className="text-sm leading-relaxed mx-auto mb-8" style={{ color: "#6B6660", maxWidth: "480px" }}>
              SOPRANOVA agents share context, delegate tasks, and compose insights across domains. Revenue signals inform customer intelligence; market data shapes forecast assumptions; risk monitors alert decision makers.
            </p>
            <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300"
              style={{ background: "#1A1F3C", color: "#FAFAF8" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#252B4A"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1F3C"; e.currentTarget.style.transform = ""; }}>
              Deploy Your First Agent
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
