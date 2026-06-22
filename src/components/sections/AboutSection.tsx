"use client";

import type React from "react";
import Image from "next/image";
import { PortableText } from "@portabletext/react";
import type { AboutSection as AboutSectionType } from "@/types/sanity";
import { useScrollReveal } from "@/lib/animations/useScrollReveal";
import { urlFor } from "@/sanity/image";

interface AboutSectionProps {
  data: AboutSectionType | null;
}

export function AboutSection({ data }: AboutSectionProps) {
  const containerRef = useScrollReveal({ y: 30, stagger: 0.15 });

  if (!data) return null;

  const imageUrl = data.image
    ? urlFor(data.image).width(800).height(600).url()
    : null;

  const yearsActive =
    data.foundedYear && data.foundedYear > 0
      ? new Date().getFullYear() - data.foundedYear
      : null;

  return (
    <section
      id="about"
      ref={containerRef as React.RefObject<HTMLElement>}
      className="py-20 md:py-28 bg-[var(--eu-canvas)]"
    >
      <div className="max-w-[var(--eu-container-max)] mx-auto px-[var(--eu-container-gutter)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Text column */}
          <div>
            {/* Eyebrow */}
            <div data-reveal className="inline-flex items-center gap-3 mb-5">
              <span className="w-6 h-0.5 bg-[var(--eu-recycle-green)]" />
              <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[var(--eu-muted)]">
                Über uns
              </span>
            </div>

            <h2
              data-reveal
              className="text-4xl md:text-5xl font-bold leading-tight text-[var(--eu-ink)]"
            >
              {data.headline}
            </h2>

            {data.body && data.body.length > 0 && (
              <div
                data-reveal
                className="mt-8 prose prose-lg max-w-none text-[var(--eu-body)] leading-relaxed [&_strong]:text-[var(--eu-ink)] [&_strong]:font-bold [&_a]:text-[var(--eu-recycle-green)] [&_a]:no-underline [&_a:hover]:underline"
              >
                <PortableText value={data.body} />
              </div>
            )}

            {/* Stats */}
            {(yearsActive !== null || data.teamSize) && (
              <div
                data-reveal
                className="mt-10 flex gap-0 border border-[var(--eu-hairline)]"
              >
                {yearsActive !== null && (
                  <div className="px-8 py-6 border-r border-[var(--eu-hairline)]">
                    <p className="font-bold text-[56px] leading-none tracking-[-0.5px] text-[var(--eu-ink)]">
                      {yearsActive}+
                    </p>
                    <p className="mt-3 text-[13px] font-bold tracking-[1.5px] uppercase text-[var(--eu-recycle-green)]">
                      Jahre Erfahrung
                    </p>
                  </div>
                )}
                {data.teamSize && (
                  <div className="px-8 py-6">
                    <p className="font-bold text-[56px] leading-none tracking-[-0.5px] text-[var(--eu-ink)]">
                      {data.teamSize}
                    </p>
                    <p className="mt-3 text-[13px] font-bold tracking-[1.5px] uppercase text-[var(--eu-recycle-green)]">
                      Mitarbeitende
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image column */}
          {imageUrl && (
            <div
              data-reveal
              className="relative overflow-hidden aspect-[4/3] border border-[var(--eu-hairline)]"
            >
              <Image
                src={imageUrl}
                alt={data.image?.alt ?? "Über Euron Export"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
