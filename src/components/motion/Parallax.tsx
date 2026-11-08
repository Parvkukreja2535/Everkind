"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Subtle parallax: the child drifts up to `strength` px as its frame scrolls past.
 * The child is scaled slightly so no edges ever show. Disabled for reduced motion.
 */
export function Parallax({ children, strength = 28, className = "" }: { children: ReactNode; strength?: number; className?: string }) {
  const frame = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const f = frame.current;
    const el = inner.current;
    if (!f || !el) return;
    let raf = 0;
    let visible = false;
    const update = () => {
      raf = 0;
      const r = f.getBoundingClientRect();
      const vh = window.innerHeight;
      const progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1..1
      const y = Math.max(-1, Math.min(1, progress)) * strength;
      el.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(1.1)`;
    };
    const onScroll = () => { if (visible && !raf) raf = requestAnimationFrame(update); };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) onScroll(); });
    io.observe(f);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [strength]);

  return (
    <div ref={frame} className={`relative overflow-hidden ${className}`}>
      <div ref={inner} className="absolute inset-0 will-change-transform" style={{ transform: "scale(1.1)" }}>{children}</div>
    </div>
  );
}
