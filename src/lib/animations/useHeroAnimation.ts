"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

/**
 * Runs the hero entrance sequence:
 * 1. Headline words stagger in from below
 * 2. Sub-headline fades up
 * 3. CTA buttons scale in
 *
 * All animations are scoped to the hero container and cleaned up by
 * GSAP Context on component unmount — no memory leaks.
 */
export function useHeroAnimation() {
  const heroRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const hero = heroRef.current;
      if (!hero) return;

      const headline = hero.querySelector("[data-hero-headline]");
      const sub = hero.querySelector("[data-hero-sub]");
      const ctas = hero.querySelectorAll("[data-hero-cta]");
      const overlay = hero.querySelector("[data-hero-overlay]");

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      if (overlay) {
        tl.fromTo(overlay, { opacity: 1 }, { opacity: 0.55, duration: 1.2 });
      }

      if (headline) {
        try {
          const split = new SplitText(headline, { type: "words" });
          tl.fromTo(
            split.words,
            { y: 80, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9, stagger: 0.06 },
            "-=0.8"
          );
        } catch {
          tl.fromTo(
            headline,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9 },
            "-=0.8"
          );
        }
      }

      if (sub) {
        tl.fromTo(sub, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7 }, "-=0.5");
      }

      if (ctas.length) {
        tl.fromTo(
          ctas,
          { y: 16, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, stagger: 0.1 },
          "-=0.4"
        );
      }
    },
    { scope: heroRef }
  );

  return heroRef;
}
