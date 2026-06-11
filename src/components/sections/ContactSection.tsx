"use client";

import { useState, type FormEvent } from "react";
import type { ContactSection as ContactSectionType, SiteSettings } from "@/types/sanity";
import { useScrollReveal } from "@/lib/animations/useScrollReveal";
import { SectionHeading } from "@/components/ui/SectionHeading";

type FormState = "idle" | "loading" | "success" | "error";

interface ContactSectionProps {
  data: ContactSectionType;
  settings: SiteSettings;
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

    const endpoint = data.formspreeEndpoint
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

  return (
    <section
      id="contact"
      ref={containerRef as React.RefObject<HTMLElement>}
      className="py-24 md:py-32 bg-[var(--color-surface)]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left column */}
          <div>
            <SectionHeading headline={data.headline} subheadline={data.subheadline} />

            <div data-reveal className="mt-10 space-y-6">
              {settings.email && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-sm bg-[var(--color-navy)]/10 text-[var(--color-navy)]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase">Email</p>
                    <a href={`mailto:${settings.email}`} className="text-[var(--color-navy)] hover:text-[var(--color-gold)] transition-colors font-medium">
                      {settings.email}
                    </a>
                  </div>
                </div>
              )}
              {settings.phone && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-sm bg-[var(--color-navy)]/10 text-[var(--color-navy)]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase">Phone</p>
                    <a href={`tel:${settings.phone}`} className="text-[var(--color-navy)] hover:text-[var(--color-gold)] transition-colors font-medium">
                      {settings.phone}
                    </a>
                  </div>
                </div>
              )}
              {settings.address && (
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-sm bg-[var(--color-navy)]/10 text-[var(--color-navy)]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase">Address</p>
                    <p className="text-[var(--color-navy)] font-medium whitespace-pre-line">{settings.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contact form */}
          <div data-reveal>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase mb-2">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    placeholder="Jane Smith"
                    className="w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-sm text-[var(--color-navy)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase mb-2">
                    Company
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    placeholder="Acme AG"
                    className="w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-sm text-[var(--color-navy)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="jane@example.com"
                  className="w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-sm text-[var(--color-navy)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold)] transition-colors"
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-xs font-semibold tracking-widest text-[var(--color-text-muted)] uppercase mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  required
                  placeholder="Tell us about your export needs..."
                  className="w-full px-4 py-3 bg-white border border-[var(--color-border)] rounded-sm text-[var(--color-navy)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-gold)] transition-colors resize-none"
                />
              </div>

              {state === "success" && (
                <p className="text-green-700 bg-green-50 border border-green-200 rounded-sm px-4 py-3 text-sm">
                  Thank you! We&apos;ll be in touch shortly.
                </p>
              )}
              {state === "error" && (
                <p className="text-red-700 bg-red-50 border border-red-200 rounded-sm px-4 py-3 text-sm">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={state === "loading"}
                className="w-full py-4 px-8 font-semibold text-sm tracking-wide rounded-sm bg-[var(--color-navy)] text-white hover:bg-[var(--color-navy-light)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {state === "loading" ? "Sending…" : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
