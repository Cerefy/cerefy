import { Link } from "react-router";
import PublicNav from "../components/PublicNav";
import AnimatedSection from "../components/AnimatedSection";
import Logo from "../components/Logo";

const solutions = [
  { label: "Financial Services", title: "Intelligence for financial institutions", desc: "Monitor portfolio performance, detect anomalies in trading patterns, automate compliance reporting, and surface market opportunities before they disappear.", useCases: ["Portfolio risk analysis", "Regulatory compliance automation", "Customer churn prediction", "Market signal detection"] },
  { label: "Retail & E-Commerce", title: "Commerce intelligence at enterprise scale", desc: "Unify customer behavior, inventory, and supply chain data. Build a single view of your customer and act on it in real time.", useCases: ["Demand forecasting", "Price optimization", "Customer lifetime value", "Supply chain intelligence"] },
  { label: "Manufacturing", title: "Operational intelligence for manufacturers", desc: "Connect production data, equipment telemetry, and supply chain signals to optimize throughput and predict failures before they occur.", useCases: ["Predictive maintenance", "Quality control analysis", "Supply chain resilience", "Capacity planning"] },
  { label: "Healthcare & Life Sciences", title: "Intelligence for complex care ecosystems", desc: "Synthesize clinical, operational, and financial data to improve outcomes, reduce costs, and accelerate research.", useCases: ["Operational efficiency", "Clinical outcome analysis", "Research intelligence", "Compliance monitoring"] },
];

export default function Solutions() {
  return (
    <div className="min-h-screen bg-sn-white">
      <PublicNav />
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="sn-label mb-6">Solutions</div>
          <h1 className="sn-display mb-6" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#1A1F3C", maxWidth: "700px" }}>
            Built for every enterprise,<br />
            <span style={{ color: "#6B7FBF" }}>configured for yours.</span>
          </h1>
          <p className="text-lg leading-relaxed mb-16" style={{ color: "#6B6660", maxWidth: "560px" }}>
            SOPRANOVA adapts to your industry, your data, and your intelligence needs. Our modular platform deploys rapidly and scales without friction.
          </p>
        </AnimatedSection>

        <div className="space-y-6">
          {solutions.map((s, i) => (
            <AnimatedSection key={s.label} delay={i * 60}>
              <div className="rounded-2xl p-8 border" style={{ background: "#FAFAF8", borderColor: "#E8E6E2" }}>
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="lg:flex-1">
                    <div className="sn-label mb-3">{s.label}</div>
                    <h3 className="text-xl font-medium mb-3" style={{ color: "#1A1F3C" }}>{s.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#6B6660" }}>{s.desc}</p>
                  </div>
                  <div className="lg:w-72 flex-shrink-0">
                    <div className="sn-label mb-3">Use Cases</div>
                    <div className="space-y-2">
                      {s.useCases.map((uc) => (
                        <div key={uc} className="flex items-center gap-2 text-sm" style={{ color: "#6B6660" }}>
                          <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: "#6B7FBF" }} />
                          {uc}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection className="mt-16 text-center" delay={200}>
          <div className="sn-label mb-4">Your industry, your terms</div>
          <h2 className="sn-display mb-6" style={{ fontSize: "2rem", color: "#1A1F3C" }}>Don't see your sector?</h2>
          <p className="text-sm mb-8" style={{ color: "#6B6660" }}>SOPRANOVA deploys across any enterprise context. Talk to our team about your specific requirements.</p>
          <Link to="/contact" className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300"
            style={{ background: "#1A1F3C", color: "#FAFAF8" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#252B4A"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1F3C"; e.currentTarget.style.transform = ""; }}>
            Talk to Our Team
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
