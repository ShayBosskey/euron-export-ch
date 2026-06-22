"use client";

import type React from "react";
import Image from "next/image";
import type { HeroSection as HeroSectionType } from "@/types/sanity";
import { useHeroAnimation } from "@/lib/animations/useHeroAnimation";
import { urlFor } from "@/sanity/image";

interface HeroSectionProps {
  data: HeroSectionType | null;
}

export function HeroSection({ data }: HeroSectionProps) {
  const heroRef = useHeroAnimation();

  if (!data) {
    return (
      <section className="relative min-h-[720px] flex items-center justify-center bg-[var(--eu-surface-dark)]">
        <div className="text-center text-[var(--eu-on-dark-soft)] px-6">
          <p className="font-bold text-2xl text-[var(--eu-on-dark)] mb-2">
            Hero nicht konfiguriert.
          </p>
          <p className="text-sm">
            Öffne{" "}
            <a href="/studio" className="underline text-[var(--eu-recycle-green)]">
              /studio
            </a>{" "}
            → Hero Section um Inhalte hinzuzufügen.
          </p>
        </div>
      </section>
    );
  }

  const bgUrl = data.backgroundImage
    ? urlFor(data.backgroundImage).width(1920).height(1080).url()
    : null;

  return (
    <section
      ref={heroRef as React.RefObject<HTMLElement>}
      className="relative bg-[var(--eu-surface-dark)] text-[var(--eu-on-dark)] overflow-hidden min-h-[720px]"
    >
      {/* Background: CMS photo or warehouse illustration */}
      {bgUrl ? (
        <Image
          src={bgUrl}
          alt={data.backgroundImage?.alt ?? ""}
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      ) : (
        <WarehouseIllustration />
      )}

      {/* Left-gradient scrim — keeps text legible on any photo */}
      <div data-hero-overlay className="absolute inset-0 eu-hero-scrim" />

      {/* Content */}
      <div className="relative z-10 max-w-[var(--eu-container-max)] mx-auto px-[var(--eu-container-gutter)]">
        <div className="flex flex-col justify-center min-h-[720px] py-24 max-w-[720px]">

          {/* Eyebrow */}
          <div className="flex items-center gap-3.5 mb-7">
            <span className="w-10 h-1 bg-[var(--eu-recycle-green)] shrink-0" />
            <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[var(--eu-on-dark-soft)]">
              Reifen · Recycling · Verkauf · Oberdiessbach
            </span>
          </div>

          {/* Headline */}
          <h1
            data-hero-headline
            className="font-bold text-[clamp(40px,6vw,80px)] leading-[1.02] tracking-[-1.2px] text-[var(--eu-on-dark)] max-w-[720px] text-balance"
          >
            {data.headline ?? "Wir kümmern uns um alles rund um Reifen."}
          </h1>

          {/* Sub-headline */}
          {data.subheadline && (
            <p
              data-hero-sub
              className="mt-6 text-[18px] leading-relaxed text-[var(--eu-on-dark-soft)] max-w-[580px]"
            >
              {data.subheadline}
            </p>
          )}

          {/* Routing CTAs */}
          <div className="mt-11 grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-[680px]">
            <RoutingButton
              icon={<RecycleIcon />}
              eyebrow="Für Garagen · Werkstätten"
              label={data.ctaPrimaryLabel ?? "Ich will Reifen entsorgen"}
              sub="Abholung anfragen"
              variant="green"
              href={data.ctaPrimaryHref ?? "#contact"}
            />
            <RoutingButton
              icon={<ShopIcon />}
              eyebrow="Für Privat & Bulk"
              label={data.ctaSecondaryLabel ?? "Ich will Reifen kaufen"}
              sub="Bestand ansehen"
              variant="ink"
              href={data.ctaSecondaryHref ?? "#markets"}
            />
          </div>

          {/* Contact strip */}
          <div className="mt-8 flex flex-wrap gap-7 text-[14px] text-[var(--eu-on-dark-soft)]">
            <a
              href="tel:+41762594464"
              className="inline-flex items-center gap-2 text-[var(--eu-on-dark)] no-underline font-[family-name:var(--eu-font-mono)] hover:text-[var(--eu-recycle-green)] transition-colors"
              data-hero-cta=""
            >
              <PhoneIcon />
              +41 76 259 44 64
            </a>
            <span className="inline-flex items-center gap-2">
              <PinIcon />
              Ziegelei 1 · 3672 Oberdiessbach
            </span>
          </div>
        </div>
      </div>

      {/* Cargo stripe */}
      <div className="eu-cargo-stripe absolute bottom-0 left-0 right-0 z-20" />
    </section>
  );
}

/* -- Routing button tile -------------------------------------------------- */
function RoutingButton({
  icon,
  eyebrow,
  label,
  sub,
  variant,
  href,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  label: string;
  sub: string;
  variant: "green" | "ink";
  href: string;
}) {
  const isGreen = variant === "green";
  return (
    <a
      href={href}
      data-hero-cta=""
      className={`grid grid-cols-[56px_1fr] gap-[18px] items-center p-[22px_24px] min-h-[112px] no-underline cursor-pointer transition-transform duration-200 hover:-translate-y-[3px] border-t-4 ${
        isGreen
          ? "bg-[var(--eu-recycle-green)] border-[var(--eu-recycle-green-active)] text-white"
          : "bg-[var(--eu-on-dark)] border-[var(--eu-action-ink-active)] text-[var(--eu-ink)]"
      }`}
    >
      <span
        className={`w-14 h-14 inline-flex items-center justify-center shrink-0 ${
          isGreen ? "bg-white/16" : "bg-[var(--eu-ink)]/8"
        }`}
      >
        {icon}
      </span>
      <span className="flex flex-col gap-1.5 min-w-0">
        <span
          className={`text-[11px] tracking-[1.5px] uppercase font-bold ${
            isGreen ? "text-white/85" : "text-[var(--eu-ink)]/65"
          }`}
        >
          {eyebrow}
        </span>
        <span className="font-bold text-[22px] leading-tight tracking-[-0.2px]">
          {label}
        </span>
        <span
          className={`inline-flex items-center gap-2 text-[13px] tracking-[1.5px] uppercase font-bold ${
            isGreen ? "text-white/85" : "text-[var(--eu-ink)]/65"
          }`}
        >
          {sub} →
        </span>
      </span>
    </a>
  );
}

/* -- Warehouse illustration ----------------------------------------------- */
function WarehouseIllustration() {
  return (
    <div className="absolute inset-0 bg-[#0e1213] overflow-hidden">
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        <defs>
          <radialGradient id="vignette" cx="60%" cy="55%" r="75%">
            <stop offset="30%" stopColor="#1a1f21" stopOpacity="0" />
            <stop offset="100%" stopColor="#06080a" stopOpacity="0.85" />
          </radialGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1d2123" />
            <stop offset="100%" stopColor="#0a0c0d" />
          </linearGradient>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#191d1f" />
            <stop offset="100%" stopColor="#10141a" />
          </linearGradient>
          <radialGradient id="light" cx="50%" cy="15%" r="40%">
            <stop offset="0%" stopColor="#f4b81a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f4b81a" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Wall */}
        <rect width="1600" height="560" fill="url(#wall)" />
        {[...Array(20)].map((_, i) => (
          <line key={`w-${i}`} x1={i * 80} y1="0" x2={i * 80} y2="560" stroke="#262b2d" strokeWidth="1" opacity="0.7" />
        ))}
        <line x1="0" y1="200" x2="1600" y2="200" stroke="#262b2d" strokeWidth="1" opacity="0.55" />
        <line x1="0" y1="380" x2="1600" y2="380" stroke="#262b2d" strokeWidth="1" opacity="0.45" />

        {/* Roof trusses */}
        <g stroke="#2d3236" strokeWidth="2" fill="none" opacity="0.8">
          <path d="M0 60 L1600 60" strokeWidth="3" />
          {[...Array(9)].map((_, i) => (
            <g key={`tr-${i}`}>
              <path d={`M${i * 200} 60 L${i * 200 + 100} 110 L${i * 200 + 200} 60`} />
              <line x1={i * 200 + 100} y1="60" x2={i * 200 + 100} y2="110" />
            </g>
          ))}
        </g>

        {/* Amber flood light */}
        <rect width="1600" height="900" fill="url(#light)" />

        {/* Floor */}
        <rect y="560" width="1600" height="340" fill="url(#floor)" />
        <path d="M0 600 L1600 600" stroke="#f4b81a" strokeWidth="3" strokeDasharray="20 18" opacity="0.45" />
        <path d="M0 780 L1600 780" stroke="#f4b81a" strokeWidth="2" strokeDasharray="14 14" opacity="0.35" />

        {/* Tire stacks — far row */}
        {[120, 260, 400, 540, 680, 820, 960, 1100, 1240, 1380, 1520].map((x) => (
          <g key={`far-${x}`} transform={`translate(${x},380)`} opacity="0.7">
            {[...Array(5)].map((_, r) => (
              <ellipse key={r} cx="0" cy={-r * 14} rx="54" ry="12" fill="#181c1e" stroke="#2a2f31" strokeWidth="1" />
            ))}
          </g>
        ))}

        {/* Forklift silhouette */}
        <g transform="translate(1080,480)">
          <rect x="0" y="60" width="160" height="16" fill="#1a1d1f" stroke="#3a3f42" strokeWidth="1.5" />
          <line x1="30" y1="60" x2="30" y2="-90" stroke="#3a3f42" strokeWidth="3" />
          <line x1="50" y1="60" x2="50" y2="-90" stroke="#3a3f42" strokeWidth="3" />
          <rect x="-10" y="40" width="170" height="20" fill="#2a2f31" stroke="#3a3f42" strokeWidth="1" />
          <rect x="110" y="80" width="100" height="110" fill="#1f2426" stroke="#3a3f42" strokeWidth="1.5" />
          <rect x="120" y="90" width="80" height="60" fill="#0a0c0d" stroke="#3a3f42" strokeWidth="1" />
          <rect x="110" y="160" width="100" height="8" fill="#f4b81a" opacity="0.85" />
          <circle cx="130" cy="200" r="22" fill="#0e1011" stroke="#3a3f42" strokeWidth="2" />
          <circle cx="130" cy="200" r="9" fill="#3a3f42" />
          <circle cx="195" cy="200" r="22" fill="#0e1011" stroke="#3a3f42" strokeWidth="2" />
          <circle cx="195" cy="200" r="9" fill="#3a3f42" />
        </g>

        {/* Foreground tire stack */}
        <g transform="translate(1380,720)">
          {[...Array(7)].map((_, r) => (
            <ellipse key={r} cx="0" cy={-r * 22} rx="85" ry="20" fill="#15181a" stroke="#3a3f42" strokeWidth="1.5" />
          ))}
          <rect x="-50" y="-180" width="100" height="22" fill="#f4b81a" opacity="0.92" />
          <text x="0" y="-165" textAnchor="middle" fontFamily="IBM Plex Mono, monospace" fontSize="11" fontWeight="700" fill="#1a1408">
            LOT EX-2026-0418
          </text>
        </g>

        {/* Worker silhouette */}
        <g transform="translate(720,540)" opacity="0.85">
          <ellipse cx="0" cy="-46" rx="10" ry="12" fill="#15181a" />
          <path d="M-16 -32 L-16 14 L-6 14 L-6 -10 L6 -10 L6 14 L16 14 L16 -32 Z" fill="#15181a" />
          <rect x="-16" y="-22" width="32" height="4" fill="#f4b81a" opacity="0.95" />
        </g>

        {/* Vignette */}
        <rect width="1600" height="900" fill="url(#vignette)" />
      </svg>
    </div>
  );
}

/* -- Inline icons --------------------------------------------------------- */
function RecycleIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5" />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 7h14l-1 13H6L5 7z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.8.3 1.6.6 2.3a2 2 0 0 1-.4 2.1L8 9.4a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.7.3 1.5.5 2.3.6a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s7-7 7-12a7 7 0 1 0-14 0c0 5 7 12 7 12z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
