"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export interface Slide {
  src: string;
  alt: string;
}

/**
 * Gentle crossfade between photos. Each photo stays for `interval` ms and dissolves over ~1.6s.
 * Pauses when the tab is hidden; shows only the first photo when reduced motion is preferred.
 */
export function Crossfade({
  slides,
  interval = 6500,
  sizes,
  priority = false,
  showControls = false,
  label,
}: {
  slides: Slide[];
  interval?: number;
  sizes: string;
  priority?: boolean;
  showControls?: boolean;
  label: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches || slides.length < 2 || paused) return;
    let timer: number | undefined;
    const start = () => {
      window.clearInterval(timer);
      timer = window.setInterval(() => setActive((i) => (i + 1) % slides.length), interval);
    };
    const onVisibility = () => (document.hidden ? window.clearInterval(timer) : start());
    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [slides.length, interval, paused]);

  return (
    <div className="absolute inset-0" role="group" aria-roledescription="slideshow" aria-label={label}>
      {slides.map((s, i) => (
        <div key={s.src} className="crossfade-slide absolute inset-0" data-active={i === active ? "true" : undefined} aria-hidden={i !== active}>
          <Image src={s.src} alt={s.alt} fill sizes={sizes} priority={priority && i === 0} loading={priority && i === 0 ? undefined : "lazy"} className="crossfade-img object-cover" />
        </div>
      ))}
      {showControls && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-sm">
          {slides.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Show photo ${i + 1} of ${slides.length}`}
              aria-current={i === active}
              onClick={() => { setActive(i); setPaused(true); }}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === active ? "w-6 bg-white" : "w-1.5 bg-white/60 hover:bg-white/90"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
