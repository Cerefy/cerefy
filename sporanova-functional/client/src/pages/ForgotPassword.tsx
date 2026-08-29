import { useState } from "react";
import { Link } from "react-router";
import Logo from "../components/Logo";
import { trpc } from "../lib/trpc";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestReset = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => { setSent(true); setLoading(false); },
    onError: (mutationError) => { setError(mutationError.message); setLoading(false); },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    requestReset.mutate({ email });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#FAFAF8" }}>
      <div className="w-full max-w-sm sn-scale-in">
        <div className="mb-8">
          <Logo size={24} showWordmark />
        </div>

        {!sent ? (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-medium mb-2" style={{ color: "#1A1F3C" }}>Reset password</h1>
              <p className="text-sm leading-relaxed" style={{ color: "#8C887F" }}>
                Enter your work email and we'll send you a secure reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="sn-label block mb-1.5">Work Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="you@company.com"
                  required
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{
                    background: "#F4F3F0",
                    border: `1.5px solid ${focused ? "#6B7FBF" : "transparent"}`,
                    color: "#1A1F3C",
                    boxShadow: focused ? "0 0 0 3px rgba(107,127,191,0.08)" : "none",
                  }}
                />
              </div>

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
                    Sending...
                  </span>
                ) : "Send Reset Link"}
              </button>
            </form>
          </>
        ) : (
          <div
            className="text-center sn-scale-in py-8"
            style={{ animation: "sn-scale-in 0.5s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ background: "#F4F3F0" }}
            >
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M3 14h22M14 3l11 11-11 11" stroke="#6B7FBF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0" style={{ animation: "sn-fade 0.5s 0.2s ease forwards" }} />
                <rect x="3" y="7" width="22" height="14" rx="2" stroke="#6B7FBF" strokeWidth="1.5" fill="none" />
                <path d="M3 9l11 8 11-8" stroke="#6B7FBF" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="text-xl font-medium mb-3" style={{ color: "#1A1F3C" }}>Check your inbox</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: "#8C887F" }}>
              We sent a reset link to <strong style={{ color: "#1A1F3C" }}>{email}</strong>.<br />
              It expires in 30 minutes.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setSent(false)}
                className="text-sm transition-colors"
                style={{ color: "#8C887F" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1F3C")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#8C887F")}
              >
                Didn't receive it? Resend
              </button>
            </div>
          </div>
        )}

        <p className="text-center text-sm mt-8" style={{ color: "#8C887F" }}>
          <Link to="/login" className="font-medium transition-colors" style={{ color: "#6B7FBF" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1F3C")} onMouseLeave={(e) => (e.currentTarget.style.color = "#6B7FBF")}>
            ← Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
