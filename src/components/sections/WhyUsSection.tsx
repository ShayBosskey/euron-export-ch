"use client";

import type { WhyUsSection as WhyUsSectionType, Usp } from "@/types/sanity";
import { useScrollReveal } from "@/lib/animations/useScrollReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

function UspCard({ usp }: { usp: Usp }) {
  return (
    <div data-reveal className="text-center px-6">
      {usp.stat && (
        <p className="font-display text-5xl md:text-6xl font-bold text-[var(--color-gold)] mb-3">
          {usp.stat}
        </p>
      )}
      <h3 className="text-lg font-bold text-white mb-2">{usp.title}</h3>
      <p className="text-sm text-white/60 leading-relaxed max-w-xs mx-auto">{usp.description}</p>
    </div>
  );
}

interface WhyUsSectionProps {
  data: WhyUsSectionType;
}

export function WhyUsSection({ data }: WhyUsSectionProps) {
  const containerRef = useScrollReveal({ stagger: 0.15, y: 30 });

  return (
    <section
      id="why-us"
      ref={containerRef as React.RefObject<HTMLElement>}
      className="py-24 md:py-32 bg-[var(--color-navy)]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeading
          headline={data.headline}
          subheadline={data.subheadline}
          centered
          light
        />

        <div className="mt-20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {data.usps.map((usp) => (
            <UspCard key={usp._key} usp={usp} />
          ))}
        </div>
      </div>
    </section>
  );
}
