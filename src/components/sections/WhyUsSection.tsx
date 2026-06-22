"use client";

import type React from "react";
import type { WhyUsSection as WhyUsSectionType } from "@/types/sanity";
import { useScrollReveal } from "@/lib/animations/useScrollReveal";

const PARTNERS = [
  "GARAGE SCHMID AG",
  "AUTOMOBIL BÄRTSCHI",
  "TCS · BERN",
  "EMIL FREY",
  "HELVETIA FLEET",
  "GARAGE OBERLAND",
  "AMAG",
  "AVIA WERKSTATT",
];

interface WhyUsSectionProps {
  data: WhyUsSectionType | null;
}

export function WhyUsSection({ data }: WhyUsSectionProps) {
  const containerRef = useScrollReveal({ stagger: 0.1, y: 30 });

  if (!data) return null;

  const usps = data.usps ?? [];

  return (
    <section
      id="why-us"
      ref={containerRef as React.RefObject<HTMLElement>}
      className="bg-[var(--eu-surface-soft)]"
    >
      {/* ── USP stats grid ─────────────────────────────────── */}
      <div className="py-20 md:py-28">
        <div className="max-w-[var(--eu-container-max)] mx-auto px-[var(--eu-container-gutter)]">
          <div data-reveal className="mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-6 h-0.5 bg-[var(--eu-ink)] opacity-60" />
              <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[var(--eu-muted)]">
                Warum Euron Export
              </span>
            </div>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold text-[var(--eu-ink)]">
              {data.headline ?? "Verlässlichkeit, die zählt."}
            </h2>
            {data.subheadline && (
              <p className="mt-4 text-[18px] text-[var(--eu-muted)] leading-relaxed max-w-2xl">
                {data.subheadline}
              </p>
            )}
          </div>

          {usps.length > 0 ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 border border-[var(--eu-hairline)] bg-[var(--eu-canvas)]">
              {usps.map((usp, i) => (
                <div
                  key={usp._key}
                  data-reveal
                  className={`p-10 flex flex-col gap-3 ${
                    i < usps.length - 1 ? "border-r border-[var(--eu-hairline)]" : ""
                  } max-lg:border-b max-lg:border-[var(--eu-hairline)]`}
                >
                  {usp.stat && (
                    <p className="font-bold text-[56px] leading-none tracking-[-0.5px] text-[var(--eu-ink)]">
                      {usp.stat}
                    </p>
                  )}
                  <p className="text-[13px] font-bold tracking-[1.5px] uppercase text-[var(--eu-recycle-green)]">
                    {usp.title}
                  </p>
                  <p className="text-[14px] text-[var(--eu-muted)] leading-relaxed">
                    {usp.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[var(--eu-muted)]">Inhalt folgt.</p>
          )}
        </div>
      </div>

      {/* ── Partner logos band ─────────────────────────────── */}
      <div className="py-16 border-t border-[var(--eu-hairline)]">
        <div className="max-w-[var(--eu-container-max)] mx-auto px-[var(--eu-container-gutter)]">
          <div data-reveal className="text-center mb-8">
            <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[var(--eu-muted)]">
              Über 240 Garagen vertrauen uns
            </span>
          </div>
          <div
            data-reveal
            className="grid grid-cols-2 sm:grid-cols-4"
          >
            {PARTNERS.map((p, i) => (
              <div
                key={p}
                className={`flex items-center justify-center px-6 py-8 border-[var(--eu-hairline)] border font-bold text-[14px] tracking-[1.5px] text-[var(--eu-muted)] uppercase ${
                  i % 4 !== 3 ? "" : ""
                }`}
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
