"use client";

import Image from "next/image";
import { PortableText } from "@portabletext/react";
import type { AboutSection as AboutSectionType } from "@/types/sanity";
import { useScrollReveal } from "@/lib/animations/useScrollReveal";
import { urlFor } from "@/sanity/image";
import { SectionHeading } from "@/components/ui/SectionHeading";

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
      className="py-24 md:py-32 bg-[var(--color-surface)]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text */}
          <div>
            <SectionHeading headline={data.headline} />

            {data.body?.length > 0 && (
              <div
                data-reveal
                className="mt-8 prose prose-lg prose-slate max-w-none text-[var(--color-text-secondary)] [&_strong]:text-[var(--color-navy)] [&_a]:text-[var(--color-gold)]"
              >
                <PortableText value={data.body} />
              </div>
            )}

            {/* Stats */}
            {(yearsActive !== null || data.teamSize) && (
              <div data-reveal className="mt-10 flex gap-12">
                {yearsActive !== null && (
                  <div>
                    <p className="font-display text-4xl font-bold text-[var(--color-navy)]">
                      {yearsActive}+
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1 tracking-wide">
                      Years of expertise
                    </p>
                  </div>
                )}
                {data.teamSize && (
                  <div>
                    <p className="font-display text-4xl font-bold text-[var(--color-navy)]">
                      {data.teamSize}
                    </p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1 tracking-wide">
                      Team members
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Image */}
          {imageUrl && (
            <div data-reveal className="relative rounded-sm overflow-hidden aspect-[4/3] shadow-2xl">
              <Image
                src={imageUrl}
                alt={data.image?.alt ?? "About Euron Export"}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-[var(--color-navy)]/10" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
