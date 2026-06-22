"use client";

import type React from "react";
import type { MarketsSection as MarketsSectionType } from "@/types/sanity";
import { useScrollReveal } from "@/lib/animations/useScrollReveal";

const FLOW_DISPOSE = [
  {
    i: "01",
    h: "Formular ausfüllen",
    p: "Adresse, geschätzte Anzahl Reifen, gewünschter Tag. 90 Sekunden.",
  },
  {
    i: "02",
    h: "Wir bestätigen innert 24 Std.",
    p: "Sie erhalten Termin, Fahrer-Name und VeVA-Nummer per Mail.",
  },
  {
    i: "03",
    h: "Abholung & Dokumentation",
    p: "Wir laden, sortieren, stellen den Begleitschein aus. Sie sind durch.",
  },
];

const FLOW_BUY = [
  {
    i: "01",
    h: "Bestand filtern",
    p: "Grösse, Saison, Profiltiefe, Qualitätsklasse. Updates stündlich.",
  },
  {
    i: "02",
    h: "Reservieren oder anfragen",
    p: "Einzelner Satz fürs Auto oder ein voller Van — wir antworten innert 24 Std.",
  },
  {
    i: "03",
    h: "Abholen in Oberdiessbach",
    p: "Sie kommen mit dem Auto, Van oder Box-Truck. Wir laden auf, Sie fahren.",
  },
];

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
      className="py-20 md:py-28 bg-[var(--eu-canvas)]"
    >
      <div className="max-w-[var(--eu-container-max)] mx-auto px-[var(--eu-container-gutter)]">

        {/* Section head */}
        <div data-reveal className="mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="w-6 h-0.5 bg-[var(--eu-ink)] opacity-60" />
            <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[var(--eu-muted)]">
              So funktioniert es
            </span>
          </div>
          <h2 className="mt-4 text-4xl md:text-5xl font-bold text-[var(--eu-ink)]">
            {data.headline ?? "Zwei klare Wege. Beide schnell."}
          </h2>
          {data.subheadline && (
            <p className="mt-4 text-[18px] text-[var(--eu-muted)] leading-relaxed max-w-2xl">
              {data.subheadline}
            </p>
          )}
        </div>

        {/* Two-column flow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14">
          <FlowCol
            isGreen
            eyebrow="Für Garagen jeder Grösse"
            title="Wir holen Ihre Altreifen ab"
            steps={FLOW_DISPOSE}
            cta="Abholung anfordern"
            href="#contact"
          />
          <FlowCol
            isGreen={false}
            eyebrow="Für Private & Bulk-Käufer"
            title="Sie wählen aus unserem Bestand"
            steps={FLOW_BUY}
            cta="Bestand ansehen"
            href="#contact"
          />
        </div>

        {/* Export market destinations from CMS (if populated) */}
        {markets.length > 0 && (
          <div className="mt-20">
            <div data-reveal className="inline-flex items-center gap-3 mb-8">
              <span className="w-6 h-0.5 bg-[var(--eu-ink)] opacity-60" />
              <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[var(--eu-muted)]">
                Exportmärkte
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--eu-hairline)]">
              {markets.map((m) => (
                <div
                  key={m._key}
                  data-reveal
                  className="bg-[var(--eu-canvas)] p-6 flex gap-4 items-start"
                >
                  {m.flagEmoji && (
                    <span className="text-3xl leading-none shrink-0">{m.flagEmoji}</span>
                  )}
                  <div>
                    <p className="font-bold text-[16px] text-[var(--eu-ink)]">{m.region}</p>
                    {m.countries && (
                      <p className="text-[13px] font-bold tracking-[0.5px] text-[var(--eu-recycle-green)] mt-0.5">
                        {m.countries}
                      </p>
                    )}
                    {m.description && (
                      <p className="mt-1 text-[13px] text-[var(--eu-muted)] leading-relaxed">
                        {m.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FlowCol({
  isGreen,
  eyebrow,
  title,
  steps,
  cta,
  href,
}: {
  isGreen: boolean;
  eyebrow: string;
  title: string;
  steps: { i: string; h: string; p: string }[];
  cta: string;
  href: string;
}) {
  return (
    <div
      data-reveal
      className={`pl-8 border-l-4 ${isGreen ? "border-[var(--eu-recycle-green)]" : "border-[var(--eu-action-ink)]"}`}
    >
      <span
        className={`text-[13px] font-bold tracking-[1.5px] uppercase ${
          isGreen ? "text-[var(--eu-recycle-green)]" : "text-[var(--eu-action-ink)]"
        }`}
      >
        {eyebrow}
      </span>
      <h3 className="mt-3 text-[24px] font-bold text-[var(--eu-ink)] leading-tight">
        {title}
      </h3>

      <div className="mt-8 flex flex-col gap-6">
        {steps.map((s, i) => (
          <div
            key={s.i}
            className={`grid grid-cols-[auto_1fr] gap-5 pb-6 ${
              i < steps.length - 1 ? "border-b border-[var(--eu-hairline)]" : ""
            }`}
          >
            <span
              className={`font-bold text-[22px] leading-none pt-1 font-[family-name:var(--eu-font-mono)] ${
                isGreen ? "text-[var(--eu-recycle-green)]" : "text-[var(--eu-action-ink)]"
              }`}
            >
              {s.i}
            </span>
            <div>
              <p className="font-bold text-[16px] text-[var(--eu-ink)]">{s.h}</p>
              <p className="mt-1.5 text-[14px] text-[var(--eu-muted)] leading-relaxed">{s.p}</p>
            </div>
          </div>
        ))}
      </div>

      <a
        href={href}
        className={`mt-8 inline-flex items-center gap-2 h-12 px-7 font-bold text-[13px] tracking-[0.5px] uppercase no-underline border transition-colors duration-200 ${
          isGreen
            ? "bg-[var(--eu-recycle-green)] text-white border-[var(--eu-recycle-green)] hover:bg-[var(--eu-recycle-green-active)] hover:border-[var(--eu-recycle-green-active)]"
            : "bg-[var(--eu-action-ink)] text-white border-[var(--eu-action-ink)] hover:bg-[var(--eu-action-ink-active)] hover:border-[var(--eu-action-ink-active)]"
        }`}
      >
        {cta} →
      </a>
    </div>
  );
}
