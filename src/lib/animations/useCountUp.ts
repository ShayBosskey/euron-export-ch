"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * Animates numeric stat elements from 0 to their final value when scrolled into view.
 * Targets elements with a `data-count-up` attribute containing the final number.
 */
export function useCountUp() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const counters = section.querySelectorAll<HTMLElement>("[data-count-up]");

      counters.forEach((el) => {
        const target = parseFloat(el.dataset.countUp ?? "0");
        const isFloat = !Number.isInteger(target);

        gsap.fromTo(
          { val: 0 },
          { val: target, duration: 1.8, ease: "power2.out" },
          {
            val: target,
            duration: 1.8,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
            onUpdate: function () {
              el.textContent = isFloat
                ? this.targets()[0].val.toFixed(1)
                : Math.round(this.targets()[0].val).toString();
            },
          }
        );
      });
    },
    { scope: sectionRef }
  );

  return sectionRef;
}
