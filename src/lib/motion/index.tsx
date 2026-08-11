// src/lib/motion/index.tsx
// Cerefy motion system (Site Build Execution Guide Part 1).
//
// One consistent motion vocabulary used across every page:
//   <FadeUpIn/>        — section entering viewport
//   <Stagger/>         — card grids / lists (child delay, max 6 before sync)
//   <FlowDraw/>        — pipeline steps appearing in reading direction
//   <ExecutionPulse/>  — the single active pipeline stage glows
//   <CountUp/>         — real numeric stat animates 0 → value
//
// Every pattern reads `prefers-reduced-motion` and collapses to an instant
// opacity/state change (no translate/draw/pulse). Motion communicates real
// state — loading, an executing pipeline, a real number — never decoration.

import React, { useEffect, useRef, useState } from 'react';

/** True when the OS requests reduced motion. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

/* ============================================================
   FADE UP IN — section entry
   ============================================================ */

export const FadeUpIn: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  style,
  ...rest
}) => {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`${className} ${!reduced && inView ? 'motion-fade-up-in' : ''}`}
      style={{ ...(reduced ? {} : inView ? { opacity: 1 } : { opacity: 0 }), ...style }}
      {...rest}
    >
      {children}
    </div>
  );
};

/* ============================================================
   STAGGER — card grids; children animate at 60ms increments
   (capped at 6 before switching to simultaneous, per the guide)
   ============================================================ */

export const Stagger: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...rest
}) => {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();

  const childrenWithMotion = React.Children.map(children, (child, i) => {
    if (!React.isValidElement(child)) return child;
    const delay = i >= 6 ? 0 : i * 60;
    return React.cloneElement(child, {
      style: { ...(child.props.style ?? {}), ...(reduced || !inView ? {} : { ['--motion-delay' as string]: `${delay}ms` }) },
    });
  });

  return (
    <div ref={ref} className={className} {...rest}>
      {inView ? childrenWithMotion : children}
    </div>
  );
};

/** Apply this class to each staggered card child. */
export const staggerItemClass = 'motion-stagger-in';

/* ============================================================
   FLOW DRAW — pipeline steps appear in reading direction;
   the connecting line draws after each step. Mirrors in RTL.
   ============================================================ */

export const FlowDraw: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div ref={ref} className={`flex items-center gap-2 ${className}`}>
      {React.Children.map(children, (child, i) => {
        const isLast = i === React.Children.count(children) - 1;
        return (
          <React.Fragment key={i}>
            {inView && !reduced ? <div className="motion-flow-x">{child}</div> : <>{child}</>}
            {!isLast && <div className="motion-connector w-5 shrink-0" aria-hidden="true" />}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* ============================================================
   EXECUTION PULSE — subtle glow on the active stage only
   ============================================================ */

export const ExecutionPulse: React.FC<{ active?: boolean; className?: string; children?: React.ReactNode }> = ({
  active = false,
  className = '',
  children,
}) => {
  const reduced = usePrefersReducedMotion();
  if (!active || reduced) {
    return <span className={className}>{children}</span>;
  }
  return (
    <span className={`motion-execution-pulse ${className}`}>
      {children}
    </span>
  );
};

/* ============================================================
   COUNT UP — real numeric stat animates from 0 to value
   (only ever used for real backend figures, never fabricated)
   ============================================================ */

export const CountUp: React.FC<{
  value: number;
  duration?: number;
  className?: string;
  formatter?: (n: number) => string;
}> = ({ value, duration = 600, className = '', formatter }) => {
  const reduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(reduced ? value : 0);
  const { ref, inView } = useInView<HTMLSpanElement>();

  useEffect(() => {
    if (!inView || reduced) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced, value, duration]);

  return (
    <span ref={ref} className={className}>
      {formatter ? formatter(display) : display.toLocaleString()}
    </span>
  );
};