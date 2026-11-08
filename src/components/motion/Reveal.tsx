"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

// One shared observer for every revealed element on the page (cheap, no per-element listeners).
let observer: IntersectionObserver | null = null;
function getObserver() {
  if (observer || typeof window === "undefined" || !("IntersectionObserver" in window)) return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          (e.target as HTMLElement).dataset.revealed = "true";
          observer?.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  return observer;
}

type Variant = "up" | "image" | "line" | "fade";

/**
 * Fades/slides content in when it scrolls into view. Content is fully visible without
 * JavaScript and for people who prefer reduced motion (see globals.css `.motion`).
 */
export function Reveal({
  as: Tag = "div",
  variant = "up",
  delay = 0,
  className = "",
  style,
  children,
  ...rest
}: {
  as?: ElementType;
  variant?: Variant;
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
} & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = getObserver();
    if (!io) {
      el.dataset.revealed = "true";
      return;
    }
    io.observe(el);
    return () => io.unobserve(el);
  }, []);
  return (
    <Tag ref={ref} data-reveal={variant} className={className} style={{ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties} {...rest}>
      {children}
    </Tag>
  );
}
