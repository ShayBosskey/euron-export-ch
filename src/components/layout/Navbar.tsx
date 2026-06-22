"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";

const NAV_LINKS = [
  { label: "Garagen-Service", href: "/services" },
  { label: "Reifen kaufen", href: "/markets" },
  { label: "Über uns", href: "/about" },
  { label: "Kontakt", href: "/contact" },
];

interface NavbarProps {
  siteName: string;
}

export function Navbar({ siteName }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: "power3.out", delay: 0.2 }
    );
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      ref={navRef}
      className={`sticky top-0 z-50 bg-[var(--eu-canvas)] transition-[border-color] duration-200 ${
        scrolled
          ? "border-b border-[var(--eu-hairline-strong)]"
          : "border-b border-[var(--eu-hairline)]"
      }`}
    >
      {/* Main nav bar */}
      <div className="max-w-[var(--eu-container-max)] mx-auto px-[var(--eu-container-gutter)] flex items-center gap-10 h-[72px]">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 no-underline shrink-0">
          <svg width={40} height={40} viewBox="0 0 40 40" fill="none" aria-hidden="true">
            <circle cx="20" cy="20" r="19" stroke="var(--eu-recycle-green)" strokeWidth="2" />
            <circle cx="20" cy="20" r="9" stroke="var(--eu-recycle-green)" strokeWidth="1.5" />
            <circle cx="20" cy="20" r="4" fill="var(--eu-recycle-green)" />
            <path d="M20 2v4M20 34v4M2 20h4M34 20h4" stroke="var(--eu-recycle-green)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div className="flex flex-col gap-[2px]">
            <span className="font-bold text-[14px] leading-none tracking-[1.5px] uppercase text-[var(--eu-ink)]">
              {siteName}
            </span>
            <span className="font-normal text-[10px] leading-none tracking-[1.5px] uppercase text-[var(--eu-muted)]">
              Reifen · Recycling
            </span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden lg:flex gap-8 flex-1 justify-center">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[14px] text-[var(--eu-body)] tracking-[0.3px] no-underline py-[26px] border-b-2 border-transparent hover:text-[var(--eu-ink)] hover:border-[var(--eu-ink)] transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTA */}
        <a
          href="/contact"
          className="hidden lg:inline-flex items-center gap-2 h-10 px-[18px] bg-[var(--eu-recycle-green)] text-white border border-[var(--eu-recycle-green)] font-bold text-[13px] tracking-[0.5px] uppercase no-underline hover:bg-[var(--eu-recycle-green-active)] hover:border-[var(--eu-recycle-green-active)] transition-colors duration-200 shrink-0"
        >
          Abholung anfordern
        </a>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="lg:hidden ml-auto inline-flex items-center justify-center w-[38px] h-[38px] border border-[var(--eu-hairline-strong)] bg-transparent text-[var(--eu-ink)] cursor-pointer"
          aria-label="Menü öffnen"
          onClick={() => setMobileOpen(true)}
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </div>

      {/* Mobile full-screen drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-[var(--eu-canvas)] z-[90] flex flex-col">
          <div className="max-w-[var(--eu-container-max)] mx-auto w-full px-5">
            {/* Drawer header */}
            <div className="flex items-center justify-between h-[72px]">
              <span className="font-bold text-[14px] tracking-[1.5px] uppercase text-[var(--eu-ink)]">
                {siteName}
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Menü schliessen"
                className="inline-flex items-center justify-center w-[38px] h-[38px] border border-[var(--eu-hairline-strong)] bg-transparent text-[var(--eu-ink)] cursor-pointer"
              >
                <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>

            {/* Drawer links */}
            <div className="flex flex-col mt-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="py-5 font-bold text-[24px] leading-tight text-[var(--eu-ink)] border-b border-[var(--eu-hairline)] no-underline"
                >
                  {link.label}
                </a>
              ))}
            </div>

            <a
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="mt-6 flex items-center justify-center h-14 bg-[var(--eu-recycle-green)] text-white font-bold text-[14px] tracking-[0.5px] uppercase no-underline"
            >
              Abholung anfordern
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
