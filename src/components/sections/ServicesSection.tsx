"use client";

import type React from "react";
import type { ServicesSection as ServicesSectionType } from "@/types/sanity";
import { useScrollReveal } from "@/lib/animations/useScrollReveal";

/* Hardcoded stats — the scale that speaks for itself */
const STATS = [
  { v: "162 480", u: "Reifen / Jahr",    label: "Verarbeitet & sortiert" },
  { v: "84 %",   u: "Wiederverwendung", label: "Re-use + Retread + Granulat" },
  { v: "247",    u: "Garagen-Kunden",   label: "Aktive Partner in CH" },
  { v: "11",     u: "Exportländer",     label: "MENA · Balkan · Kaukasus" },
];

interface ServicesSectionProps {
  data: ServicesSectionType | null;
}

export function ServicesSection({ data }: ServicesSectionProps) {
  const containerRef = useScrollReveal({ stagger: 0.1 });

  if (!data) return null;

  const headline  = data.headline    ?? "Dreifach amtlich. Schweizweit gültig. EU-konform.";
  const sub       = data.subheadline ?? "Bei einer Umweltkontrolle ist ein Anruf bei uns die kürzeste Verteidigung — wir liefern die ganze Akte. Vertraglich geregelt.";
  const services  = data.services    ?? [];

  return (
    <section
      id="services"
      ref={containerRef as React.RefObject<HTMLElement>}
      className="bg-[var(--eu-canvas)]"
    >
      {/* ── Trust band ────────────────────────────────────── */}
      <div className="pt-20 pb-16 border-b border-[var(--eu-hairline)]">
        <div className="max-w-[var(--eu-container-max)] mx-auto px-[var(--eu-container-gutter)]">
          <div data-reveal className="inline-flex items-center gap-3 mb-5">
            <ShieldIcon />
            <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[var(--eu-muted)]">
              Amtlich anerkannt · Kantonal lizenziert · EU-konform
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-14 items-center">
            <div data-reveal>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--eu-ink)] leading-tight">
                {headline}
              </h2>
              <p className="mt-4 text-[17px] text-[var(--eu-muted)] leading-relaxed">{sub}</p>
            </div>

            {/* Trust badges — cargo-stripe style */}
            <div data-reveal>
              <div className="grid grid-cols-3 border border-[var(--eu-hairline)]">
                {([
                  { code: "BE", label: "Kanton Bern",   sub: "Bewilligung Reifenrecycling", cls: "bg-[var(--eu-stripe-graphite)] text-white" },
                  { code: "TH", label: "Stadt Thun",    sub: "Gewerbeordnung 2024",         cls: "bg-[var(--eu-recycle-green)] text-white" },
                  { code: "OD", label: "Oberdiessbach", sub: "Gemeinde-Lizenz",             cls: "bg-[var(--eu-stripe-amber)] text-[var(--eu-ink)]" },
                ] as const).map((b, i) => (
                  <div
                    key={b.code}
                    className={`p-6 flex flex-col gap-1.5 min-h-[112px] relative ${b.cls} ${
                      i < 2 ? "border-r border-white/20" : ""
                    }`}
                  >
                    <div className="flex items-baseline gap-3">
                      <span className="font-bold text-[28px] leading-none tracking-[0.5px]">
                        {b.code}
                      </span>
                      <span className="text-[11px] tracking-[1.5px] uppercase opacity-85 font-bold">
                        amtlich
                      </span>
                    </div>
                    <span className="font-bold text-[16px]">{b.label}</span>
                    <span className="text-[11px] tracking-[0.5px] opacity-85">{b.sub}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[12px] tracking-[0.5px] text-[var(--eu-muted)]">
                Lizenz-Nr. BE-3672-21 · ausgestellt 14.03.2009 · zuletzt erneuert 02.2026
              </p>
            </div>
          </div>

          {/* CMS services as feature list (if populated) */}
          {services.length > 0 && (
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--eu-hairline)]">
              {services.map((s) => (
                <div
                  key={s._key}
                  data-reveal
                  className="bg-[var(--eu-canvas)] p-8 flex flex-col gap-3"
                >
                  <span className="w-8 h-0.5 bg-[var(--eu-recycle-green)]" />
                  <h3 className="font-bold text-[18px] text-[var(--eu-ink)] leading-snug">
                    {s.title}
                  </h3>
                  <p className="text-[14px] text-[var(--eu-muted)] leading-relaxed">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Stats band ────────────────────────────────────── */}
      <div className="bg-[var(--eu-surface-soft)] py-20">
        <div className="max-w-[var(--eu-container-max)] mx-auto px-[var(--eu-container-gutter)]">
          <div data-reveal className="mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-6 h-0.5 bg-[var(--eu-ink)] opacity-60" />
              <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[var(--eu-muted)]">
                Im Betrieb
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--eu-ink)] mt-4">
              Massstab, der für sich spricht.
            </h2>
            <p className="mt-4 text-[17px] text-[var(--eu-muted)] leading-relaxed max-w-2xl">
              Wir betreiben den grössten zertifizierten Sortierhof im Berner Oberland.
              Alles dokumentiert, jedes Los nachverfolgbar.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 border border-[var(--eu-hairline)] bg-[var(--eu-canvas)]">
            {STATS.map((s, i) => (
              <div
                key={s.u}
                data-reveal
                className={`p-10 ${i < 3 ? "border-r border-[var(--eu-hairline)]" : ""} max-lg:border-b max-lg:border-[var(--eu-hairline)]`}
              >
                <p className="font-bold text-[56px] leading-none tracking-[-0.5px] text-[var(--eu-ink)]">
                  {s.v}
                </p>
                <p className="mt-3.5 text-[13px] font-bold tracking-[1.5px] uppercase text-[var(--eu-recycle-green)]">
                  {s.u}
                </p>
                <p className="mt-2 text-[14px] text-[var(--eu-muted)]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ShieldIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="var(--eu-recycle-green)" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2 4 5v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V5l-8-3z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
