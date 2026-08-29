import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Logo from "../components/Logo";
import { trpc } from "../lib/trpc";

export default function Signup() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", company: "", password: "" });
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const register = trpc.auth.register.useMutation({
    onSuccess: () => navigate("/app/dashboard", { replace: true }),
    onError: (mutationError) => {
      setError(mutationError.message);
      setLoading(false);
    },
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (step === 1) { setStep(2); return; }
    setLoading(true);
    register.mutate({
      email: form.email,
      password: form.password,
      name: `${form.firstName} ${form.lastName}`.trim(),
      organizationName: form.company,
    });
  }

  const inputStyle = (key: string) => ({
    background: "#F4F3F0",
    border: `1.5px solid ${focused === key ? "#6B7FBF" : "transparent"}`,
    color: "#1A1F3C",
    boxShadow: focused === key ? "0 0 0 3px rgba(107,127,191,0.08)" : "none",
  });

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200";

  return (
    <div className="min-h-screen flex" style={{ background: "#FAFAF8" }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: "#F4F3F0" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 70% 40%, rgba(107,127,191,0.08) 0%, transparent 65%)" }}
        />
        <Logo size={24} showWordmark />

        <div className="relative">
          {/* Capability grid visual */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {["AI Intelligence", "Enterprise Memory", "AI Agents", "Analytics", "Automation", "Decisions"].map((c, i) => (
              <div
                key={c}
                className="px-4 py-3 rounded-xl text-sm font-medium"
                style={{
                  background: i === 0 ? "#1A1F3C" : "rgba(26,31,60,0.06)",
                  color: i === 0 ? "#F8F6F2" : "#1A1F3C",
                  animation: `sn-slide-up 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 60}ms both`,
                }}
              >
                {c}
              </div>
            ))}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#8C887F" }}>
            Join enterprises that chose clarity over complexity. Full access to every capability, from day one.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm sn-scale-in">
          <div className="lg:hidden mb-8"><Logo size={24} showWordmark /></div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div
                key={s}
                className="h-1 rounded-full transition-all duration-500"
                style={{
                  width: s === step ? 24 : 8,
                  background: s <= step ? "#1A1F3C" : "#E8E6E2",
                }}
              />
            ))}
            <span className="sn-label ml-2">{step} of 2</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-medium mb-2" style={{ color: "#1A1F3C" }}>
              {step === 1 ? "Create your account" : "Your workspace"}
            </h1>
            <p className="text-sm" style={{ color: "#8C887F" }}>
              {step === 1 ? "Start your SOPRANOVA journey." : "A few more details to personalize your experience."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {step === 1 ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="sn-label block mb-1.5">First Name</label>
                    <input type="text" value={form.firstName} onChange={(e) => update("firstName", e.target.value)}
                      onFocus={() => setFocused("firstName")} onBlur={() => setFocused(null)}
                      placeholder="Jane" required className={inputClass} style={inputStyle("firstName")} />
                  </div>
                  <div>
                    <label className="sn-label block mb-1.5">Last Name</label>
                    <input type="text" value={form.lastName} onChange={(e) => update("lastName", e.target.value)}
                      onFocus={() => setFocused("lastName")} onBlur={() => setFocused(null)}
                      placeholder="Smith" required className={inputClass} style={inputStyle("lastName")} />
                  </div>
                </div>
                <div>
                  <label className="sn-label block mb-1.5">Work Email</label>
                  <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
                    onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                    placeholder="jane@company.com" required className={inputClass} style={inputStyle("email")} />
                </div>
                <div>
                  <label className="sn-label block mb-1.5">Password</label>
                  <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)}
                    onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                    placeholder="Create a strong password" required className={inputClass} style={inputStyle("password")} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="sn-label block mb-1.5">Company</label>
                  <input type="text" value={form.company} onChange={(e) => update("company", e.target.value)}
                    onFocus={() => setFocused("company")} onBlur={() => setFocused(null)}
                    placeholder="Your organization" required className={inputClass} style={inputStyle("company")} />
                </div>
                <div>
                  <label className="sn-label block mb-1.5">Role</label>
                  <select
                    onFocus={() => setFocused("role")} onBlur={() => setFocused(null)}
                    className={inputClass} style={inputStyle("role")}
                  >
                    {["Executive / Leadership", "Data & Analytics", "Engineering", "Product", "Operations", "Finance", "Other"].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="sn-label block mb-1.5">Company Size</label>
                  <select
                    onFocus={() => setFocused("size")} onBlur={() => setFocused(null)}
                    className={inputClass} style={inputStyle("size")}
                  >
                    {["1–50", "51–200", "201–1,000", "1,001–5,000", "5,000+"].map((s) => (
                      <option key={s}>{s} employees</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {error && <p role="alert" className="text-xs" style={{ color: "#A05B5B" }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-300 mt-2"
              style={{ background: "#1A1F3C", color: "#FAFAF8" }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,31,60,0.2)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Creating workspace...
                </span>
              ) : step === 1 ? "Continue" : "Create Account"}
            </button>

            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} className="text-sm text-center transition-colors" style={{ color: "#8C887F" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1F3C")} onMouseLeave={(e) => (e.currentTarget.style.color = "#8C887F")}>
                ← Back
              </button>
            )}

            {step === 1 && (
              <p className="text-xs text-center" style={{ color: "#B8B4AC" }}>
                By continuing you agree to our{" "}
                <a href="#" className="underline" style={{ color: "#8C887F" }}>Terms</a>
                {" "}and{" "}
                <a href="#" className="underline" style={{ color: "#8C887F" }}>Privacy Policy</a>
              </p>
            )}
          </form>

          <p className="text-center text-sm mt-8" style={{ color: "#8C887F" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-medium transition-colors" style={{ color: "#6B7FBF" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1F3C")} onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7FBF")}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
