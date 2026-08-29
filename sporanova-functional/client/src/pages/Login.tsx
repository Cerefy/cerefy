import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Logo from "../components/Logo";
import { trpc } from "../lib/trpc";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      setSuccess(true);
      await new Promise((r) => setTimeout(r, 450));
      navigate("/app/dashboard", { replace: true });
    },
    onError: (mutationError) => {
      setError(mutationError.message);
      setLoading(false);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    login.mutate({ email, password });
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#FAFAF8" }}>
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 relative overflow-hidden"
        style={{ background: "#1A1F3C" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 50% at 30% 60%, rgba(107,127,191,0.18) 0%, transparent 65%)" }}
        />

        {/* Animated geometry */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full border"
              style={{
                width: 80 + i * 60,
                height: 80 + i * 60,
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                borderColor: `rgba(107, 127, 191, ${0.06 - i * 0.008})`,
                animation: `sn-spin-slow ${18 + i * 5}s linear infinite ${i % 2 === 0 ? "" : "reverse"}`,
              }}
            />
          ))}
          <div
            className="absolute"
            style={{
              left: "50%", top: "50%",
              transform: "translate(-50%, -50%)",
              animation: "sn-float 4s ease-in-out infinite",
            }}
          >
            <Logo size={56} color="rgba(248,246,242,0.25)" showWordmark={false} />
          </div>
        </div>

        <div className="relative">
          <Logo size={24} color="#F8F6F2" showWordmark />
        </div>

        <div className="relative">
          <blockquote
            className="sn-display mb-6"
            style={{ fontSize: "1.75rem", color: "#F8F6F2", lineHeight: 1.3 }}
          >
            "The intelligence layer your enterprise has been missing."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sn-indigo/30 flex items-center justify-center">
              <span className="text-xs font-medium text-sn-lavender">SR</span>
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: "#F8F6F2" }}>Sarah Reeves</div>
              <div className="text-xs" style={{ color: "rgba(248,246,242,0.4)" }}>CTO, Meridian Financial</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — auth */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className="w-full max-w-sm sn-scale-in"
          style={{
            opacity: success ? 0 : 1,
            transform: success ? "scale(0.97)" : "",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
          <div className="lg:hidden mb-8">
            <Logo size={24} showWordmark />
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-medium mb-2" style={{ color: "#1A1F3C" }}>Welcome back</h1>
            <p className="text-sm" style={{ color: "#8C887F" }}>Sign in to your SOPRANOVA workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="sn-label block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: "#F4F3F0",
                  border: `1.5px solid ${focused === "email" ? "#6B7FBF" : "transparent"}`,
                  color: "#1A1F3C",
                  boxShadow: focused === "email" ? "0 0 0 3px rgba(107,127,191,0.08)" : "none",
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="sn-label">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs transition-colors"
                  style={{ color: "#8C887F" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#6B7FBF")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#8C887F")}
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                  background: "#F4F3F0",
                  border: `1.5px solid ${focused === "password" ? "#6B7FBF" : "transparent"}`,
                  color: "#1A1F3C",
                  boxShadow: focused === "password" ? "0 0 0 3px rgba(107,127,191,0.08)" : "none",
                }}
              />
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                className="w-4 h-4 rounded flex items-center justify-center transition-all duration-200"
                style={{ background: remember ? "#1A1F3C" : "#E8E6E2", border: "1.5px solid" + (remember ? "#1A1F3C" : "#D4D1CB") }}
                onClick={() => setRemember(!remember)}
              >
                {remember && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="#FAFAF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span className="text-sm" style={{ color: "#6B6660" }}>Remember me</span>
            </label>

            {error && <p role="alert" className="text-xs" style={{ color: "#A05B5B" }}>{error}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-medium transition-all duration-300 mt-2 relative overflow-hidden"
              style={{
                background: loading || success ? "#6B7FBF" : "#1A1F3C",
                color: "#FAFAF8",
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(26,31,60,0.2)"; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
            >
              {loading && !success ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                    <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Signing in...
                </span>
              ) : success ? (
                <span className="flex items-center justify-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l4 4 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Entering workspace
                </span>
              ) : "Sign In"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-sn-100" />
              <span className="text-xs" style={{ color: "#B8B4AC" }}>or</span>
              <div className="flex-1 h-px bg-sn-100" />
            </div>

            {/* SSO */}
            {[
              { label: "Continue with Google", icon: "G" },
              { label: "Continue with Microsoft", icon: "M" },
            ].map((sso) => (
              <button
                key={sso.label}
                type="button"
                disabled={sso.icon === "M"}
                onClick={() => { if (sso.icon === "G") window.location.assign("/api/auth/google?returnTo=/app/dashboard"); }}
                className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-3 transition-all duration-200 border"
                style={{ borderColor: "#E8E6E2", color: "#1A1F3C", background: "#fff", opacity: sso.icon === "M" ? 0.55 : 1, cursor: sso.icon === "M" ? "not-allowed" : "pointer" }}
                title={sso.icon === "M" ? "Microsoft sign-in is not configured" : undefined}
                onMouseEnter={(e) => { if (sso.icon !== "M") { e.currentTarget.style.borderColor = "#D4D1CB"; e.currentTarget.style.background = "#F8F6F2"; } }}
                onMouseLeave={(e) => { if (sso.icon !== "M") { e.currentTarget.style.borderColor = "#E8E6E2"; e.currentTarget.style.background = "#fff"; } }}
              >
                <span className="font-semibold text-base" style={{ width: 18, textAlign: "center" }}>{sso.icon}</span>
                {sso.label}
              </button>
            ))}
          </form>

          <p className="text-center text-sm mt-8" style={{ color: "#8C887F" }}>
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium transition-colors"
              style={{ color: "#6B7FBF" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1F3C")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7FBF")}
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
