"use client";

import Image from "next/image";
import type { HeroSection as HeroSectionType } from "@/types/sanity";
import { useHeroAnimation } from "@/lib/animations/useHeroAnimation";
import { urlFor } from "@/sanity/image";
import { Button } from "@/components/ui/Button";

interface HeroSectionProps {
  data: HeroSectionType;
}

export function HeroSection({ data }: HeroSectionProps) {
  const heroRef = useHeroAnimation();

  return (
    <section
      ref={heroRef as React.RefObject<HTMLElement>}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--color-navy)]"
    >
      {/* Background image */}
      {data.backgroundImage && (
        <Image
          src={urlFor(data.backgroundImage).width(1920).height(1080).url()}
          alt={data.backgroundImage.alt ?? ""}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      )}

      {/* Dark gradient overlay */}
      <div
        data-hero-overlay
        className="absolute inset-0 bg-gradient-to-b from-[var(--color-navy)]/70 via-[var(--color-navy)]/60 to-[var(--color-navy)]/80"
      />

      {/* Decorative gold line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-gold)]" />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-8 text-center py-32">
        <p className="text-[var(--color-gold)] text-sm font-semibold tracking-[0.3em] uppercase mb-6">
          Euron Export AG — Switzerland
        </p>

        <h1
          data-hero-headline
          className="font-display text-5xl md:text-7xl font-bold text-white leading-[1.1] mb-8"
        >
          {data.headline}
        </h1>

        <p
          data-hero-sub
          className="text-lg md:text-xl text-white/75 max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          {data.subheadline}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            href={data.ctaPrimaryHref}
            variant="primary"
            data-hero-cta=""
          >
            {data.ctaPrimaryLabel}
          </Button>
          {data.ctaSecondaryLabel && (
            <Button
              href={data.ctaSecondaryHref ?? "#services"}
              variant="outline"
              data-hero-cta=""
            >
              {data.ctaSecondaryLabel}
            </Button>
          )}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent" />
      </div>
    </section>
  );
}
