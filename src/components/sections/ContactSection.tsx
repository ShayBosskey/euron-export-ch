"use client";

import { useState, type FormEvent } from "react";
import type { ContactSection as ContactSectionType, SiteSettings } from "@/types/sanity";
import { useScrollReveal } from "@/lib/animations/useScrollReveal";

type FormState = "idle" | "loading" | "success" | "error";

const BIZ_PHONE      = "+41 76 259 44 64";
const BIZ_PHONE_HREF = "tel:+41762594464";
const BIZ_EMAIL      = "info@euron-export.com";
const BIZ_ADDRESS    = "Ziegelei 1\n3672 Oberdiessbach BE";
const BIZ_HOURS      = "Mo–Fr 07:00–17:30 · Sa 08:00–12:00";

interface ContactSectionProps {
  data: ContactSectionType | null;
  settings: SiteSettings | null;
}

export function ContactSection({ data, settings }: ContactSectionProps) {
  const containerRef = useScrollReveal({ stagger: 0.1 });
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const endpoint = data?.formspreeEndpoint
      ? `https://formspree.io/f/${data.formspreeEndpoint}`
      : "/api/contact";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Submission failed");
      }
      setState("success");
      form.reset();
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const phone   = settings?.phone   ?? BIZ_PHONE;
  const email   = settings?.email   ?? BIZ_EMAIL;
  const address = settings?.address ?? BIZ_ADDRESS;

  return (
    <section
      id="contact"
      ref={containerRef as React.RefObject<HTMLElement>}
      className="bg-[var(--eu-surface-dark)] text-[var(--eu-on-dark)] relative"
    >
      {/* ── Dark CTA band ─────────────────────────────────── */}
      <div className="max-w-[var(--eu-container-max)] mx-auto px-[var(--eu-container-gutter)] py-20">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-center pb-16 border-b border-white/10">
          <div data-reveal>
            <div className="inline-flex items-center gap-3 mb-4">
              <span className="w-6 h-0.5 bg-[var(--eu-stripe-amber)]" />
              <span className="text-[13px] font-bold tracking-[1.5px] uppercase text-[var(--eu-on-dark-soft)]">
                Direkt sprechen
              </span>
            </div>
            <h2 className="mt-4 text-4xl md:text-5xl font-bold text-[var(--eu-on-dark)] leading-tight max-w-[720px]">
              {data?.headline ?? "Unsicher, in welche Spur Sie gehören?"}
            </h2>
            <p className="mt-4 text-[18px] text-[var(--eu-on-dark-soft)] leading-relaxed max-w-[560px]">
              {data?.subheadline ??
                "Rufen Sie an. Disposition antwortet innert 24 Std. — Mo–Fr 07:00–17:30, Sa morgens."}
            </p>
          </div>

          {/* Quick-contact actions */}
          <div data-reveal className="flex flex-col gap-3">
            <a
              href={BIZ_PHONE_HREF}
              className="flex items-center justify-between h-16 px-7 bg-[var(--eu-recycle-green)] text-white border border-[var(--eu-recycle-green)] font-bold no-underline hover:bg-[var(--eu-recycle-green-active)] hover:border-[var(--eu-recycle-green-active)] transition-colors"
            >
              <span className="inline-flex items-center gap-3 text-[16px]">
                <PhoneIcon />
                {phone}
              </span>
              <span className="text-[11px] tracking-[1.5px] uppercase opacity-85">
                Tap to call
              </span>
            </a>

            <div className="grid grid-cols-2 gap-3">
              <ContactPill icon={<MailIcon />} label={email} href={`mailto:${email}`} />
              <ContactPill icon={<PinIcon />} label="Route planen" href="https://www.google.com/maps/search/?api=1&query=Ziegelei+1%2C+3672+Oberdiessbach" external />
            </div>

            <p className="text-[13px] text-[var(--eu-on-dark-soft)] tracking-[0.5px] mt-1">
              {BIZ_HOURS}
            </p>
          </div>
        </div>

        {/* ── Contact form ──────────────────────────────────── */}
        <div className="pt-16 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left: address block */}
          <div data-reveal className="flex flex-col gap-8">
            <div>
              <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-[var(--eu-on-dark-soft)] mb-2">
                Adresse
              </p>
              <p className="font-bold text-[18px] text-[var(--eu-on-dark)] whitespace-pre-line leading-snug">
                {address}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-[var(--eu-on-dark-soft)] mb-2">
                Öffnungszeiten
              </p>
              <p className="font-bold text-[16px] text-[var(--eu-on-dark)]">{BIZ_HOURS}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[1.5px] uppercase text-[var(--eu-on-dark-soft)] mb-2">
                Steuernummer
              </p>
              <p className="font-bold text-[16px] text-[var(--eu-on-dark)] font-[family-name:var(--eu-font-mono)]">
                CHE-432.118.077
              </p>
            </div>
          </div>

          {/* Right: contact form */}
          <div data-reveal data-form-region>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField id="name" label="Name *" type="text" placeholder="Max Muster" required />
                <FormField id="company" label="Firma" type="text" placeholder="Garage AG" />
              </div>
              <FormField id="email" label="E-Mail *" type="email" placeholder="max@example.com" required />
              <FormField id="phone" label="Telefon" type="tel" placeholder="+41 76 …" />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="message"
                  className="text-[11px] font-bold tracking-[1.5px] uppercase text-[var(--eu-on-dark-soft)]"
                >
                  Nachricht *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="Schildern Sie Ihr Anliegen kurz…"
                  className="w-full px-3.5 py-3 bg-transparent border border-white/25 text-[var(--eu-on-dark)] placeholder-[var(--eu-on-dark-soft)] font-[family-name:var(--eu-font-body)] text-[15px] leading-relaxed focus:outline-none focus:border-[var(--eu-recycle-green)] transition-colors resize-none"
                />
              </div>

              {state === "success" && (
                <p className="text-[var(--eu-recycle-green)] bg-[var(--eu-recycle-green-soft)] border border-[var(--eu-recycle-green)] px-4 py-3 text-[14px]">
                  Danke! Wir melden uns in Kürze.
                </p>
              )}
              {state === "error" && (
                <p className="text-[var(--eu-error)] bg-red-950/40 border border-[var(--eu-error)] px-4 py-3 text-[14px]">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={state === "loading"}
                className="h-12 px-7 font-bold text-[13px] tracking-[0.5px] uppercase bg-[var(--eu-recycle-green)] text-white border border-[var(--eu-recycle-green)] hover:bg-[var(--eu-recycle-green-active)] hover:border-[var(--eu-recycle-green-active)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {state === "loading" ? "Wird gesendet…" : "Nachricht senden"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Cargo stripe at bottom */}
      <div className="eu-cargo-stripe" />
    </section>
  );
}

/* -- Sub-components ------------------------------------------------------- */
function FormField({
  id,
  label,
  type,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[11px] font-bold tracking-[1.5px] uppercase text-[var(--eu-on-dark-soft)]"
      >
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-3.5 py-3 bg-transparent border border-white/25 text-[var(--eu-on-dark)] placeholder-[var(--eu-on-dark-soft)] text-[15px] focus:outline-none focus:border-[var(--eu-recycle-green)] transition-colors"
      />
    </div>
  );
}

function ContactPill({
  icon,
  label,
  href,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="flex items-center gap-2.5 px-4 py-3 border border-white/25 text-[var(--eu-on-dark-soft)] text-[13px] no-underline hover:border-white/50 hover:text-[var(--eu-on-dark)] transition-colors truncate"
    >
      {icon}
      <span className="truncate">{label}</span>
    </a>
  );
}

function PhoneIcon() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.8.3 1.6.6 2.3a2 2 0 0 1-.4 2.1L8 9.4a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.7.3 1.5.5 2.3.6a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" />
      <path d="m2 6 10 7 10-7" />
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
