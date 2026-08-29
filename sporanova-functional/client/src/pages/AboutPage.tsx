import PublicNav from "../components/PublicNav";
import AnimatedSection from "../components/AnimatedSection";
import Logo from "../components/Logo";
import { Link } from "react-router";

const values = [
  { title: "Clarity over complexity", desc: "We believe enterprise software has been needlessly complex for too long. Every design decision optimizes for understanding, not feature count." },
  { title: "Intelligence with evidence", desc: "AI recommendations without evidence are guesses. SOPRANOVA always shows its reasoning, its sources, and its confidence level." },
  { title: "Premium for a reason", desc: "The enterprises we serve make consequential decisions. The quality of our product reflects the weight of that responsibility." },
  { title: "Privacy as architecture", desc: "Your data is your competitive advantage. We never train on it, never share it, and build our infrastructure to ensure it stays yours." },
];

export default function About() {
  return (
    <div className="min-h-screen bg-sn-white">
      <PublicNav />
      <div className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="sn-label mb-6">About</div>
          <h1 className="sn-display mb-8" style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#1A1F3C", maxWidth: "700px" }}>
            Built to make enterprise<br />
            intelligence <span style={{ color: "#6B7FBF" }}>feel effortless.</span>
          </h1>
          <p className="text-lg leading-relaxed mb-6" style={{ color: "#6B6660", maxWidth: "600px" }}>
            SOPRANOVA was founded on a simple observation: the most important business decisions were still being made with inadequate information. Not because data was scarce — but because extracting intelligence from it required too much effort.
          </p>
          <p className="text-lg leading-relaxed mb-16" style={{ color: "#6B6660", maxWidth: "600px" }}>
            We built SOPRANOVA to close that gap. An intelligence operating system that sits above your entire enterprise — connecting data, reasoning about it, and surfacing the insights that matter.
          </p>
        </AnimatedSection>

        {/* Values */}
        <AnimatedSection delay={100}>
          <div className="sn-label mb-8">What we stand for</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-20">
            {values.map((v, i) => (
              <AnimatedSection key={v.title} delay={i * 40}>
                <div className="p-7 rounded-2xl h-full" style={{ background: "#F4F3F0" }}>
                  <h3 className="font-medium mb-3" style={{ fontSize: "1.1rem", color: "#1A1F3C", fontFamily: "'Instrument Serif', serif" }}>{v.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#6B6660" }}>{v.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>

        {/* Mission statement */}
        <AnimatedSection delay={200}>
          <div className="rounded-3xl p-12 md:p-16 relative overflow-hidden text-center" style={{ background: "#1A1F3C" }}>
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(107,127,191,0.15) 0%, transparent 70%)" }} />
            <div className="relative">
              <div className="sn-label mb-6" style={{ color: "rgba(248,246,242,0.4)" }}>Our mission</div>
              <blockquote className="sn-display mb-8" style={{ fontSize: "clamp(1.5rem, 2.5vw, 2.25rem)", color: "#F8F6F2", maxWidth: "600px", margin: "0 auto 2rem" }}>
                "An intelligent operating layer for every enterprise that takes its future seriously."
              </blockquote>
              <Link to="/contact" className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300"
                style={{ background: "rgba(248,246,242,0.12)", color: "#F8F6F2", border: "1px solid rgba(248,246,242,0.2)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(248,246,242,0.18)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(248,246,242,0.12)"; }}>
                Get in Touch
              </Link>
            </div>
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
