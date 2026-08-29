import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import Logo from "../components/Logo";
import { trpc } from "../lib/trpc";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resetPassword = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setLoading(false);
      navigate("/login", { replace: true });
    },
    onError: (mutationError) => {
      setError(mutationError.message);
      setLoading(false);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    resetPassword.mutate({ token, password: newPassword });
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: "#FAFAF8" }}>
      <div className="w-full max-w-sm sn-scale-in">
        <div className="mb-8">
          <Logo size={24} showWordmark />
        </div>

        <div className="mb-8">
          <h1 className="text-2xl font-medium mb-2" style={{ color: "#1A1F3C" }}>Set new password</h1>
          <p className="text-sm leading-relaxed" style={{ color: "#8C887F" }}>
            Enter a new password for your account below.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="sn-label block mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onFocus={() => setFocused("new")}
              onBlur={() => setFocused(null)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: "#F4F3F0",
                border: `1.5px solid ${focused === "new" ? "#6B7FBF" : "transparent"}`,
                color: "#1A1F3C",
                boxShadow: focused === "new" ? "0 0 0 3px rgba(107,127,191,0.08)" : "none",
              }}
            />
          </div>

          <div>
            <label className="sn-label block mb-1.5">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocused("confirm")}
              onBlur={() => setFocused(null)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200"
              style={{
                background: "#F4F3F0",
                border: `1.5px solid ${focused === "confirm" ? "#6B7FBF" : "transparent"}`,
                color: "#1A1F3C",
                boxShadow: focused === "confirm" ? "0 0 0 3px rgba(107,127,191,0.08)" : "none",
              }}
            />
          </div>

          {!token && <p role="alert" className="text-xs" style={{ color: "#A05B5B" }}>No reset token provided. Please use the link from your email.</p>}

          {error && <p role="alert" className="text-xs" style={{ color: "#A05B5B" }}>{error}</p>}

          <button
            type="submit"
            disabled={loading || !token}
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
                Resetting...
              </span>
            ) : "Reset Password"}
          </button>
        </form>

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
