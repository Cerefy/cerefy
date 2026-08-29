import { Link } from "react-router";
import PublicNav from "../components/PublicNav";
import AnimatedSection from "../components/AnimatedSection";
import ExplainerVideo from "../components/ExplainerVideo";
import Logo from "../components/Logo";

const steps = [
  { n: "01", title: "Understands", desc: "Natural language queries translate into precise, context-aware analysis against your enterprise data." },
  { n: "02", title: "Analyzes", desc: "Multi-layer statistical and semantic analysis surfaces trends, anomalies, and causal relationships." },
  { n: "03", title: "Finds Patterns", desc: "Cross-domain pattern recognition connects signals across time, geography, and business units." },
  { n: "04", title: "Generates Insights", desc: "Structured insights with evidence chains, confidence scores, and business impact assessments." },
  { n: "05", title: "Recommends Actions", desc: "Calibrated recommendations ranked by expected impact, feasibility, and strategic alignment." },
];

export default function IntelligencePublic() {
  return (
    <div className="min-h-screen bg-sn-white">
      <PublicNav />
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="sn-label mb-6">Intelligence Layer</div>
          <h1 className="sn-display mb-6" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#1A1F3C", maxWidth: "700px" }}>
            Intelligence that<br />
            <span style={{ color: "#6B7FBF" }}>understands context.</span>
          </h1>
          <p className="text-lg leading-relaxed mb-16" style={{ color: "#6B6660", maxWidth: "560px" }}>
            SOPRANOVA's intelligence layer is not a search engine. It reasons about your business, understands your domain, and generates insights that a analyst would be proud to present.
          </p>
        </AnimatedSection>

        {/* Process visualization */}
        <AnimatedSection className="mb-24" delay={80}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {steps.map((step, i) => (
              <div key={step.n} className="relative">
                <div className="p-6 rounded-2xl h-full" style={{ background: "#F4F3F0" }}>
                  <div className="sn-label mb-3">{step.n}</div>
                  <div className="font-medium mb-2" style={{ color: "#1A1F3C", fontFamily: "'Instrument Serif', serif" }}>{step.title}</div>
                  <p className="text-xs leading-relaxed" style={{ color: "#8C887F" }}>{step.desc}</p>
                </div>
                {i < 4 && (
                  <div className="hidden md:flex absolute -right-1.5 top-1/2 -translate-y-1/2 z-10 w-3 h-3 rounded-full items-center justify-center"
                    style={{ background: "#6B7FBF" }}>
                    <div className="w-1 h-1 rounded-full bg-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </AnimatedSection>

        {/* Intelligence explainer film container — asset pending generation */}
        <AnimatedSection className="mb-24" delay={100}>
          <ExplainerVideo
            label="Intelligence Film"
            title="Contextual reasoning that turns patterns into insight and action."
            description="From understanding a question to discovering cross-domain patterns, generating evidence-backed insights, and recommending the next move."
          />
        </AnimatedSection>

        {/* Example query */}
        <AnimatedSection delay={120}>
          <div className="sn-label mb-6">Example Intelligence Output</div>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "#E8E6E2" }}>
            <div className="px-6 py-4 border-b" style={{ background: "#F4F3F0", borderColor: "#E8E6E2" }}>
              <div className="text-sm font-medium" style={{ color: "#1A1F3C" }}>
                "Why did revenue in the North region decline 8.3% last quarter?"
              </div>
            </div>
            <div className="p-6 space-y-5" style={{ background: "#FAFAF8" }}>
              <div>
                <div className="sn-label mb-2" style={{ color: "#4A8B8C" }}>Analysis</div>
                <p className="text-sm leading-relaxed" style={{ color: "#1A1F3C" }}>
                  Revenue contraction in Region North is attributable to three compounding factors identified across 14 data sources spanning the trailing 18 months.
                </p>
              </div>
              <div>
                <div className="sn-label mb-3" style={{ color: "#5B6FA8" }}>Evidence</div>
                <div className="space-y-2">
                  {[
                    { source: "Salesforce CRM", finding: "Enterprise deal closure rate fell from 34% to 21% following rep turnover in Q3." },
                    { source: "Market Intelligence", finding: "Competitor pricing 12% lower in affected segments as of September 2025." },
                    { source: "Customer Success", finding: "Net promoter score declined 18 points; product adoption at 61% vs 79% prior year." },
                  ].map((ev) => (
                    <div key={ev.source} className="flex gap-3 p-3 rounded-xl" style={{ background: "#F4F3F0" }}>
                      <div className="flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium" style={{ background: "#E8E6E2", color: "#6B6660" }}>{ev.source}</div>
                      <p className="text-xs leading-relaxed" style={{ color: "#6B6660" }}>{ev.finding}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="sn-label mb-2" style={{ color: "#6B7FBF" }}>Recommendation</div>
                <p className="text-sm leading-relaxed" style={{ color: "#1A1F3C" }}>
                  Prioritize accelerated onboarding for replacement sales reps in Region North. Consider a 90-day targeted pricing concession of 8–10% for at-risk enterprise accounts while product adoption gaps are resolved.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button className="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200" style={{ background: "#1A1F3C", color: "#F8F6F2" }}>Create Decision</button>
                <button className="px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200" style={{ borderColor: "#E8E6E2", color: "#1A1F3C" }}>Investigate Further</button>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection className="mt-20 text-center" delay={160}>
          <Link to="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300"
            style={{ background: "#1A1F3C", color: "#FAFAF8" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#252B4A"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1F3C"; e.currentTarget.style.transform = ""; }}>
            Experience Intelligence
          </Link>
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
