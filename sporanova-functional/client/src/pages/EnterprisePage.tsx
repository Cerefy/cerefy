import { Link } from "react-router";
import PublicNav from "../components/PublicNav";
import AnimatedSection from "../components/AnimatedSection";
import Logo from "../components/Logo";

const pillars = [
  { label: "Security", title: "Enterprise-grade security posture", desc: "SOC 2 Type II certified. Data encrypted at rest and in transit. Private cloud and on-premises deployment available. No training on your data.", details: ["AES-256 encryption", "SAML/OIDC SSO", "Private VPC deployment", "SOC 2 Type II"] },
  { label: "Governance", title: "Comprehensive audit and compliance", desc: "Full audit trails on every query, decision, and agent action. Configurable data retention policies. Export-ready compliance reports.", details: ["Immutable audit logs", "GDPR compliance", "Data lineage tracking", "Configurable retention"] },
  { label: "Permissions", title: "Fine-grained access control", desc: "Role-based and attribute-based access control at the row, column, and document level. Agents operate only within defined permission boundaries.", details: ["RBAC + ABAC", "Data-level permissions", "Agent sandboxing", "Federated identity"] },
  { label: "Scalability", title: "Built for enterprise workloads", desc: "Horizontal scaling to billions of records. Sub-200ms query response at scale. 99.95% uptime SLA with dedicated support.", details: ["Auto-scaling infrastructure", "99.95% SLA", "Global CDN", "Dedicated SRE support"] },
  { label: "Integrations", title: "Connect your entire enterprise stack", desc: "60+ native connectors. REST API and webhook support. Custom connector SDK. Real-time and batch sync modes.", details: ["Salesforce, SAP, Oracle", "PostgreSQL, Snowflake", "Google Workspace", "REST API + webhooks"] },
];

export default function Enterprise() {
  return (
    <div className="min-h-screen bg-sn-white">
      <PublicNav />
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="sn-label mb-6">Enterprise</div>
          <h1 className="sn-display mb-6" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#1A1F3C", maxWidth: "700px" }}>
            Enterprise-ready<br />
            <span style={{ color: "#6B7FBF" }}>from day one.</span>
          </h1>
          <p className="text-lg leading-relaxed mb-16" style={{ color: "#6B6660", maxWidth: "560px" }}>
            SOPRANOVA was designed for enterprise deployment from the ground up. Security, governance, and compliance are not features — they are foundational properties.
          </p>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-20">
          {pillars.map((p, i) => (
            <AnimatedSection key={p.label} delay={i * 50} className={i === 0 ? "lg:col-span-2" : ""}>
              <div className="p-8 rounded-2xl border" style={{ background: "#FAFAF8", borderColor: "#E8E6E2" }}>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <div className="sn-label mb-3">{p.label}</div>
                    <h3 className="text-xl font-medium mb-3" style={{ color: "#1A1F3C" }}>{p.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#6B6660" }}>{p.desc}</p>
                  </div>
                  <div className="md:w-52 flex-shrink-0">
                    <div className="space-y-2">
                      {p.details.map((d) => (
                        <div key={d} className="flex items-center gap-2 text-sm" style={{ color: "#6B6660" }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#4A8B8C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          {d}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection className="text-center" delay={200}>
          <div className="rounded-3xl p-12 md:p-16" style={{ background: "#1A1F3C" }}>
            <div className="sn-label mb-4" style={{ color: "rgba(248,246,242,0.4)" }}>Enterprise deployment</div>
            <h2 className="sn-display mb-4" style={{ fontSize: "2rem", color: "#F8F6F2" }}>Ready for a security review?</h2>
            <p className="text-sm mb-8" style={{ color: "rgba(248,246,242,0.55)" }}>Our team is available for technical due diligence, security questionnaires, and custom deployment architectures.</p>
            <Link to="/contact" className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300"
              style={{ background: "#F8F6F2", color: "#1A1F3C" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; }}>
              Contact Enterprise Sales
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
