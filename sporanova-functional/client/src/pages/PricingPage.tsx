import { useState } from "react";
import { useNavigate } from "react-router";
import Logo from "../components/Logo";
import { useAuth } from "../_core/hooks/useAuth";
import { trpc } from "../lib/trpc";

const plans = [
  {
    name: "Hobby",
    price: { monthly: 40, yearly: 32 },
    description: "Access to advanced models",
    features: ["2 members", "Integrations", "Basic analytics", "Attachments"],
    trial: true,
  },
  {
    name: "Standard",
    price: { monthly: 150, yearly: 120 },
    badge: "Popular",
    description: "Everything in Hobby, plus",
    features: ["3 members", "Advanced integrations", "API access", "Personalization", "Auto retrain agents", "Helpdesk"],
    trial: true,
  },
  {
    name: "Pro",
    price: { monthly: 500, yearly: 400 },
    description: "Everything in Standard, plus",
    features: ["5 members", "Advanced analytics", "Sources suggestions", "Tickets as a source"],
    trial: true,
  },
  {
    name: "Enterprise",
    price: null,
    description: "Power at your pace with custom solutions.",
    features: ["Higher limits", "Flexible billing", "Custom roles & permissions", "SSO", "White-labeling", "Audit logs"],
    trial: false,
  },
];

const logos = ["ORION", "Miele", "Opal", "Dolby", "SOPRANOVA", "nationalgrid", "Sage", "IHG", "F45", "noon"];

export default function PricingPage() {
  const [yearly, setYearly] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const bootstrap = trpc.workspaces.bootstrap.useMutation({
    onSuccess: () => navigate("/app/dashboard", { replace: true }),
  });

  function handleContinueFree() {
    if (isAuthenticated) {
      bootstrap.mutate();
    } else {
      navigate("/signup");
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#FAFAF8" }}>
      {/* Main content */}
      <div className="flex-1 p-8 lg:p-14 overflow-y-auto">
        <Logo size={22} showWordmark className="mb-10" />

        <h1 className="text-3xl font-medium mb-2" style={{ fontFamily: "'Instrument Serif', serif", color: "#1A1F3C" }}>
          Choose your plan
        </h1>

        {/* Monthly / Yearly toggle */}
        <div className="flex items-center gap-3 mt-6 mb-8">
          <span className="text-sm font-medium" style={{ color: !yearly ? "#1A1F3C" : "#8C887F" }}>Monthly</span>
          <button
            onClick={() => setYearly(!yearly)}
            className="relative w-11 h-6 rounded-full transition-colors duration-200"
            style={{ background: yearly ? "#1A1F3C" : "#D4D1CB" }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
              style={{ transform: yearly ? "translateX(20px)" : "translateX(0)" }}
            />
          </button>
          <span className="text-sm font-medium" style={{ color: yearly ? "#1A1F3C" : "#8C887F" }}>Yearly</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "#EEF6F6", color: "#4A8B8C" }}>
            20% off
          </span>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-10">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="rounded-2xl border p-6 flex flex-col relative"
              style={{
                background: "#FAFAF8",
                borderColor: plan.badge ? "#5B6FA8" : "#E8E6E2",
                borderWidth: plan.badge ? 2 : 1,
              }}
            >
              {plan.badge && (
                <span
                  className="absolute -top-3 right-4 text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: "#1A1F3C", color: "#F8F6F2" }}
                >
                  {plan.badge}
                </span>
              )}

              <div
                className="h-1 rounded-full mb-4"
                style={{
                  background: plan.name === "Hobby" ? "#6B7FBF" : plan.name === "Standard" ? "#B8675A" : plan.name === "Pro" ? "#C5974A" : "#4A8B8C",
                }}
              />

              <h3 className="text-lg font-medium" style={{ color: "#1A1F3C" }}>{plan.name}</h3>

              {plan.price ? (
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-medium" style={{ color: "#1A1F3C" }}>
                    ${yearly ? plan.price.yearly : plan.price.monthly}
                  </span>
                  <span className="text-sm" style={{ color: "#8C887F" }}>/m</span>
                </div>
              ) : (
                <div className="mt-3">
                  <span className="text-2xl font-medium" style={{ color: "#1A1F3C" }}>Let's talk</span>
                </div>
              )}

              {plan.price && (
                <p className="text-xs mt-1" style={{ color: "#B8B4AC" }}>billed {yearly ? "yearly" : "monthly"}</p>
              )}

              {plan.trial ? (
                <button
                  className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: plan.badge ? "#1A1F3C" : "#FAFAF8", color: plan.badge ? "#F8F6F2" : "#1A1F3C", border: plan.badge ? "none" : "1.5px solid #E8E6E2" }}
                  onMouseEnter={(e) => { if (!plan.badge) { e.currentTarget.style.borderColor = "#1A1F3C"; } }}
                  onMouseLeave={(e) => { if (!plan.badge) { e.currentTarget.style.borderColor = "#E8E6E2"; } }}
                >
                  Start 7-day trial
                </button>
              ) : (
                <button
                  className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: "#FAFAF8", color: "#1A1F3C", border: "1.5px solid #E8E6E2" }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1A1F3C"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8E6E2"; }}
                >
                  Contact us
                </button>
              )}

              {plan.price && (
                <p className="text-xs text-center mt-2" style={{ color: "#8C887F" }}>
                  or <button onClick={handleContinueFree} className="underline font-medium hover:text-[#1A1F3C]">buy now</button>
                </p>
              )}

              <p className="text-xs mt-4 mb-2" style={{ color: "#8C887F" }}>{plan.description}</p>

              <ul className="mt-2 space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm" style={{ color: "#1A1F3C" }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#B8B4AC" }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom buttons */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: "#FAFAF8", color: "#1A1F3C", border: "1.5px solid #E8E6E2" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1A1F3C"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8E6E2"; }}
          >
            Back
          </button>
          <button
            onClick={handleContinueFree}
            disabled={bootstrap.isPending}
            className="px-6 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: "#FAFAF8", color: "#1A1F3C", border: "1.5px solid #E8E6E2" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#1A1F3C"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E8E6E2"; }}
          >
            {bootstrap.isPending ? "Creating..." : "Continue for free"}
          </button>
          <button
            onClick={handleContinueFree}
            disabled={bootstrap.isPending}
            className="px-8 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: "#1A1F3C", color: "#F8F6F2" }}
            onMouseEnter={(e) => { if (!bootstrap.isPending) { e.currentTarget.style.background = "#252B4A"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1F3C"; }}
          >
            {bootstrap.isPending ? "Creating..." : "Continue for free"}
          </button>
        </div>

        {/* Logos */}
        <div className="flex flex-wrap items-center gap-6 mb-8" style={{ color: "#B8B4AC" }}>
          {logos.map((logo) => (
            <span key={logo} className="text-xs font-semibold tracking-wide uppercase">{logo}</span>
          ))}
        </div>

        <p className="text-xs" style={{ color: "#B8B4AC" }}>© 2026 SOPRANOVA Inc.</p>
        <div className="flex gap-4 mt-2">
          <a href="#" className="text-xs underline" style={{ color: "#8C887F" }}>Terms</a>
          <a href="#" className="text-xs underline" style={{ color: "#8C887F" }}>Privacy</a>
        </div>
      </div>

      {/* Right sidebar */}
      <div
        className="hidden lg:flex lg:w-[380px] flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: "#1A1F3C" }}
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(107,127,191,0.08) 10px, rgba(107,127,191,0.08) 11px)",
          }}
        />

        <div className="relative">
          <div className="rounded-2xl p-6 mb-8" style={{ background: "#FAFAF8" }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg" style={{ background: "#1A1F3C" }}>
                <span className="text-sm font-bold" style={{ color: "#F8F6F2" }}>S</span>
              </div>
              <span className="text-lg font-medium" style={{ color: "#1A1F3C", fontFamily: "'Instrument Serif', serif" }}>
                SOPRANOVA
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "#1A1F3C" }}>
              "We deployed SOPRANOVA across our Italian and Gulf operations. Arabic dialect handling and Italian regulatory knowledge out of the box — our support agents now resolve 70% of inquiries without human escalation."
            </p>
            <p className="mt-4 text-xs" style={{ color: "#8C887F" }}>
              <strong style={{ color: "#1A1F3C" }}>Ahmed Al-Rashid</strong>, VP of Operations, SOPRANOVA
            </p>
          </div>
        </div>

        <div className="relative mt-auto">
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>Trusted by teams building across</p>
          <div className="grid grid-cols-3 gap-3">
            {["MENA", "Italy", "GCC", "EU", "APAC", "Americas"].map((region) => (
              <div
                key={region}
                className="px-3 py-2 rounded-lg text-center text-[10px] font-medium"
                style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
              >
                {region}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
