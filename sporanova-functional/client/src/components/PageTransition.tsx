import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "react-router";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";

export default function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitioning, setTransitioning] = useState(false);
  const [key, setKey] = useState(0);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) {
      setDisplayChildren(children);
      setKey((k) => k + 1);
      setTransitioning(false);
      return;
    }
    setTransitioning(true);
    const t = window.setTimeout(() => {
      setDisplayChildren(children);
      setKey((k) => k + 1);
      setTransitioning(false);
    }, 140);
    return () => window.clearTimeout(t);
  }, [children, location.pathname, reducedMotion]);

  return (
    <div
      key={key}
      className="sn-route-transition"
      style={{
        opacity: reducedMotion || !transitioning ? 1 : 0,
        transform: reducedMotion || !transitioning ? "translateY(0)" : "translateY(8px)",
        transition: reducedMotion ? "none" : "opacity 0.22s cubic-bezier(0.23, 1, 0.32, 1), transform 0.28s cubic-bezier(0.23, 1, 0.32, 1)",
        minHeight: "100vh",
      }}
    >
      {displayChildren}
    </div>
  );
}
