import PublicNav from "../components/PublicNav";
import AnimatedSection from "../components/AnimatedSection";
import { Link } from "react-router";

interface Props {
  title: string;
  subtitle: string;
  label: string;
  sections?: { heading: string; body: string }[];
}

export default function GenericPage({ title, subtitle, label, sections = [] }: Props) {
  return (
    <div className="min-h-screen bg-sn-white">
      <PublicNav />
      <section className="pt-36 pb-24 max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="sn-label mb-4">{label}</div>
          <h1 className="sn-display mb-6" style={{ fontSize: "clamp(2.5rem,5vw,4rem)", color: "#1A1F3C" }}>{title}</h1>
          <p className="max-w-xl text-lg leading-relaxed mb-10" style={{ color: "#6B6660" }}>{subtitle}</p>
          <Link to="/signup" className="px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 inline-block"
            style={{ background: "#1A1F3C", color: "#FAFAF8" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#252B4A"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#1A1F3C"; e.currentTarget.style.transform = ""; }}>
            Get Started
          </Link>
        </AnimatedSection>

        {sections.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-20">
            {sections.map((s, i) => (
              <AnimatedSection key={s.heading} delay={i * 70}>
                <div className="p-6 rounded-2xl h-full" style={{ background: "#F4F3F0" }}>
                  <h3 className="font-medium mb-2" style={{ color: "#1A1F3C" }}>{s.heading}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#8C887F" }}>{s.body}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
