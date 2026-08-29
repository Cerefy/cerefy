import { ReactNode, useEffect, useRef, useState } from "react";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  animation?: "slide-up" | "fade" | "scale" | "slide-right";
}

export default function AnimatedSection({ children, className = "", delay = 0, animation = "slide-up" }: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6%" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const keyframes: Record<string, string> = {
    "slide-up": "sn-slide-up",
    fade: "sn-fade",
    scale: "sn-scale-in",
    "slide-right": "sn-slide-right",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible || reducedMotion ? 1 : 0,
        animation: !reducedMotion && visible ? `${keyframes[animation]} 0.72s cubic-bezier(0.23, 1, 0.32, 1) ${delay}ms both` : undefined,
      }}
    >
      {children}
    </div>
  );
}
