import { useState } from "react";
import PublicNav from "../components/PublicNav";
import AnimatedSection from "../components/AnimatedSection";
import Logo from "../components/Logo";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [focused, setFocused] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  const inputStyle = (field: string) => ({
    background: "#F4F3F0",
    border: `1.5px solid ${focused === field ? "#6B7FBF" : "transparent"}`,
    color: "#1A1F3C",
    boxShadow: focused === field ? "0 0 0 3px rgba(107,127,191,0.08)" : "none",
    borderRadius: "12px",
    outline: "none",
    width: "100%",
    padding: "12px 16px",
    fontSize: "0.875rem",
    transition: "all 0.2s ease",
  });

  return (
    <div className="min-h-screen bg-sn-white">
      <PublicNav />
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <AnimatedSection>
            <div className="sn-label mb-6">Contact</div>
            <h1 className="sn-display mb-6" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1A1F3C" }}>
              Let's talk about your<br />
              <span style={{ color: "#6B7FBF" }}>intelligence needs.</span>
            </h1>
            <p className="text-base leading-relaxed mb-10" style={{ color: "#6B6660" }}>
              Our enterprise team is ready to discuss your use case, run a technical evaluation, and design a deployment plan that fits your organization.
            </p>
            <div className="space-y-4">
              {[
                { label: "Enterprise Sales", detail: "For organizations with 100+ employees" },
                { label: "Technical Evaluation", detail: "Security reviews, architecture deep-dives" },
                { label: "Partnership Inquiries", detail: "Integration partners and resellers" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-1 h-1 rounded-full mt-2.5 flex-shrink-0" style={{ background: "#6B7FBF" }} />
                  <div>
                    <div className="text-sm font-medium" style={{ color: "#1A1F3C" }}>{item.label}</div>
                    <div className="text-sm" style={{ color: "#8C887F" }}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>

          <AnimatedSection delay={80}>
            {sent ? (
              <div className="h-full flex items-center justify-center text-center p-8 rounded-2xl" style={{ background: "#F4F3F0" }}>
                <div>
                  <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#1A1F3C" }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10l5 5 8-9" stroke="#F8F6F2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <h3 className="font-medium text-lg mb-2" style={{ color: "#1A1F3C" }}>Message received</h3>
                  <p className="text-sm" style={{ color: "#8C887F" }}>Our enterprise team will be in touch within one business day.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 rounded-2xl border space-y-4" style={{ background: "#FAFAF8", borderColor: "#E8E6E2" }}>
                <div>
                  <label className="sn-label block mb-1.5">Full Name</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                    placeholder="Sarah Reeves" style={inputStyle("name")} />
                </div>
                <div>
                  <label className="sn-label block mb-1.5">Work Email</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    placeholder="sarah@company.com" style={inputStyle("email")} />
                </div>
                <div>
                  <label className="sn-label block mb-1.5">Company</label>
                  <input type="text" required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
                    onFocus={() => setFocused("company")} onBlur={() => setFocused(null)}
                    placeholder="Meridian Financial" style={inputStyle("company")} />
                </div>
                <div>
                  <label className="sn-label block mb-1.5">Message</label>
                  <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    onFocus={() => setFocused("message")} onBlur={() => setFocused(null)}
                    placeholder="Tell us about your intelligence needs and current data environment..."
                    style={{ ...inputStyle("message"), resize: "none" }} />
                </div>
                <button type="submit" className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-300 mt-2"
                  style={{ background: "#1A1F3C", color: "#FAFAF8" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#252B4A"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1F3C"; e.currentTarget.style.transform = ""; }}>
                  Send Message
                </button>
              </form>
            )}
          </AnimatedSection>
        </div>
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
