import { useCallback, useEffect, useRef, useState } from "react";
import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";

interface ExplainerVideoProps {
  /** Small uppercase label shown over the container. */
  label: string;
  /** Editorial display line describing the film's theme. */
  title: string;
  /** Optional supporting sentence. */
  description?: string;
  /**
   * Permanent URL of the explainer asset.
   * Intentionally omitted until the real film is generated and uploaded through
   * the approved web asset workflow; while absent (or on load failure) the
   * container renders its animated fallback treatment.
   */
  src?: string;
  /** Poster frame shown before playback once an asset exists. */
  poster?: string;
}

export default function ExplainerVideo({ label, title, description, src, poster }: ExplainerVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  // Lazy loading: only mount the <video> element once the container approaches the viewport.
  useEffect(() => {
    if (!src) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [src]);

  const togglePlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  const showVideo = Boolean(src) && !failed && nearViewport;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-3xl"
      style={{ background: "#1A1F3C" }}
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true"
        style={{ background: "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(107,127,191,0.15) 0%, transparent 70%)" }} />

      {!showVideo && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sn-accent/10"
            style={{ animation: "sn-spin-slow 28s linear infinite" }} />
          <div className="absolute left-1/2 top-1/2 h-[18rem] w-[18rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sn-blue/10"
            style={{ animation: "sn-spin-slow 22s linear infinite reverse" }} />
          <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sn-accent/10 blur-3xl"
            style={{ animation: "sn-pulse-soft 4.8s ease-in-out infinite" }} />
          <div className="absolute right-[16%] top-[24%] h-2 w-2 rounded-full bg-sn-teal/35"
            style={{ animation: "sn-float 5s ease-in-out infinite" }} />
          <div className="absolute left-[22%] bottom-[26%] h-1.5 w-1.5 rounded-full bg-sn-blue/30"
            style={{ animation: "sn-float 6.5s ease-in-out infinite reverse" }} />
        </div>
      )}

      {showVideo && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay={!reducedMotion}
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster}
          aria-hidden="true"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={() => setFailed(true)}
          src={src}
        />
      )}

      <div className="relative z-10 flex aspect-video flex-col items-center justify-center px-6 text-center">
        <div className="sn-label mb-4" style={{ color: "rgba(248,246,242,0.4)" }}>{label}</div>
        <h2 className="sn-display" style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)", color: "#F8F6F2", maxWidth: "560px" }}>
          {title}
        </h2>
        {description && (
          <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(248,246,242,0.55)", maxWidth: "480px" }}>
            {description}
          </p>
        )}
      </div>

      {showVideo && (
        <button
          type="button"
          onClick={togglePlayback}
          className="absolute bottom-4 right-4 z-20 grid h-9 w-9 place-items-center rounded-full border border-white/45 bg-white/55 text-sn-navy shadow-[0_12px_40px_rgba(26,31,60,0.08)] backdrop-blur-md transition hover:bg-sn-navy hover:text-sn-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sn-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sn-navy"
          aria-label={isPlaying ? `Pause ${label}` : `Play ${label}`}
        >
          {isPlaying ? "Ⅱ" : "▶"}
        </button>
      )}
    </div>
  );
}
