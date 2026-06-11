"use client";

import type { MarketsSection as MarketsSectionType, Market } from "@/types/sanity";
import { useScrollReveal } from "@/lib/animations/useScrollReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

function MarketCard({ market }: { market: Market }) {
  return (
    <div
      data-reveal
      className="group flex gap-5 p-6 bg-white/5 border border-white/10 rounded-sm hover:border-[var(--color-gold)]/50 hover:bg-white/10 transition-all duration-300"
    >
      {market.flagEmoji && (
        <span className="text-4xl flex-shrink-0 leading-none">{market.flagEmoji}</span>
      )}
      <div>
        <h3 className="font-display text-lg font-bold text-white mb-1">
          {market.region}
        </h3>
        {market.countries && (
          <p className="text-xs text-[var(--color-gold)] font-medium mb-2 tracking-wide">
            {market.countries}
          </p>
        )}
        {market.description && (
          <p className="text-sm text-white/60 leading-relaxed">{market.description}</p>
        )}
      </div>
    </div>
  );
}

interface MarketsSectionProps {
  data: MarketsSectionType | null;
}

export function MarketsSection({ data }: MarketsSectionProps) {
  const containerRef = useScrollReveal({ stagger: 0.1, y: 30 });

  if (!data) return null;

  const markets = data.markets ?? [];

  return (
    <section
      id="markets"
      ref={containerRef as React.RefObject<HTMLElement>}
      className="py-24 md:py-32 bg-[var(--color-navy-light)]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <SectionHeading
          headline={data.headline}
          subheadline={data.subheadline}
          centered
          light
        />

        {markets.length > 0 ? (
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {markets.map((market) => (
              <MarketCard key={market._key} market={market} />
            ))}
          </div>
        ) : (
          <p className="mt-12 text-center text-white/40">Markets coming soon.</p>
        )}
      </div>
    </section>
  );
}
