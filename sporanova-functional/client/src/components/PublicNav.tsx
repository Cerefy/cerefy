import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import Logo from "./Logo";

const navItems = [
  { label: "Platform", href: "/platform" },
  { label: "Intelligence", href: "/intelligence" },
  { label: "AI Agents", href: "/agents" },
  { label: "Solutions", href: "/solutions" },
  { label: "Enterprise", href: "/enterprise" },
  { label: "About", href: "/about" },
];

export default function PublicNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <>
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? "rgba(250,250,248,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(212,209,203,0.5)" : "1px solid transparent",
        }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="transition-opacity hover:opacity-75">
            <Logo size={26} showWordmark />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className="px-4 py-2 text-sm rounded-lg transition-all duration-200"
                style={{
                  color: location.pathname === item.href ? "#1A1F3C" : "#6B6660",
                  fontWeight: location.pathname === item.href ? "500" : "400",
                  background: location.pathname === item.href ? "rgba(232,230,226,0.7)" : "transparent",
                }}
                onMouseEnter={(e) => { if (location.pathname !== item.href) e.currentTarget.style.background = "rgba(232,230,226,0.5)"; }}
                onMouseLeave={(e) => { if (location.pathname !== item.href) e.currentTarget.style.background = "transparent"; }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium transition-all duration-200"
              style={{ color: "#6B6660" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#1A1F3C")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B6660")}
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200"
              style={{ background: "#1A1F3C", color: "#FAFAF8" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#252B4A"; e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1F3C"; e.currentTarget.style.transform = ""; }}
            >
              Get Started
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <div className="w-5 flex flex-col gap-1.5">
              <span className="block h-0.5 bg-sn-navy transition-all duration-300"
                style={{ transform: menuOpen ? "rotate(45deg) translateY(8px)" : "" }} />
              <span className="block h-0.5 bg-sn-navy transition-all duration-300"
                style={{ opacity: menuOpen ? 0 : 1 }} />
              <span className="block h-0.5 bg-sn-navy transition-all duration-300"
                style={{ transform: menuOpen ? "rotate(-45deg) translateY(-8px)" : "" }} />
            </div>
          </button>
        </div>
      </nav>

      <div
        className="fixed inset-0 z-40 md:hidden transition-all duration-300"
        style={{ opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? "auto" : "none" }}
      >
        <div className="absolute inset-0 bg-sn-white/95 backdrop-blur-xl" />
        <div className="relative h-full flex flex-col pt-20 px-6 gap-2">
          {navItems.map((item, i) => (
            <Link
              key={item.href}
              to={item.href}
              className="py-4 text-lg font-medium border-b border-sn-100 transition-all duration-200"
              style={{
                color: "#1A1F3C",
                transitionDelay: menuOpen ? `${i * 40}ms` : "0ms",
                transform: menuOpen ? "translateX(0)" : "translateX(-12px)",
                opacity: menuOpen ? 1 : 0,
              }}
            >
              {item.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 mt-6">
            <Link to="/login" className="py-3 text-center text-sm font-medium rounded-xl border border-sn-200">Sign In</Link>
            <Link to="/signup" className="py-3 text-center text-sm font-medium rounded-xl" style={{ background: "#1A1F3C", color: "#FAFAF8" }}>Get Started</Link>
          </div>
        </div>
      </div>
    </>
  );
}
