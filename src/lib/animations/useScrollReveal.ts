"use client";

import { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export interface ScrollRevealOptions {
  y?: number;
  x?: number;
  opacity?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  ease?: string;
  start?: string;
}

const DEFAULTS: ScrollRevealOptions = {
  y: 40,
  x: 0,
  opacity: 0,
  duration: 0.8,
  delay: 0,
  stagger: 0.12,
  ease: "power3.out",
  start: "top 85%",
};

/**
 * Animates a container's children from hidden → visible on scroll.
 * Uses GSAP Context via @gsap/react for automatic cleanup on unmount.
 */
export function useScrollReveal(options: ScrollRevealOptions = {}) {
  const containerRef = useRef<HTMLElement>(null);
  const opts = { ...DEFAULTS, ...options };

  useGSAP(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const targets = container.querySelectorAll("[data-reveal]");
      if (!targets.length) return;

      gsap.fromTo(
        targets,
        { y: opts.y, x: opts.x, opacity: opts.opacity },
        {
          y: 0,
          x: 0,
          opacity: 1,
          duration: opts.duration,
          delay: opts.delay,
          stagger: opts.stagger,
          ease: opts.ease,
          scrollTrigger: {
            trigger: container,
            start: opts.start,
            once: true,
          },
        }
      );
    },
    { scope: containerRef }
  );

  return containerRef;
}
