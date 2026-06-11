import type { SiteSettings } from "@/types/sanity";

interface FooterProps {
  settings: SiteSettings;
}

export function Footer({ settings }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-navy)] text-white/70 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <p className="font-display text-xl font-bold text-white mb-3">
              {settings.siteName}
            </p>
            <p className="text-sm leading-relaxed">
              {settings.tagline}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-[var(--color-gold)] uppercase mb-4">
              Navigation
            </p>
            <ul className="space-y-2 text-sm">
              {["About", "Services", "Markets", "Why Us", "Contact"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase().replace(" ", "-")}`}
                    className="hover:text-[var(--color-gold)] transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold tracking-widest text-[var(--color-gold)] uppercase mb-4">
              Contact
            </p>
            <ul className="space-y-2 text-sm">
              {settings.email && (
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="hover:text-[var(--color-gold)] transition-colors"
                  >
                    {settings.email}
                  </a>
                </li>
              )}
              {settings.phone && <li>{settings.phone}</li>}
              {settings.address && (
                <li className="whitespace-pre-line">{settings.address}</li>
              )}
              {settings.linkedIn && (
                <li>
                  <a
                    href={settings.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--color-gold)] transition-colors"
                  >
                    LinkedIn
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/40">
          <p>
            &copy; {year} {settings.siteName}. All rights reserved.
          </p>
          <p>
            Built in Switzerland &nbsp;·&nbsp;{" "}
            <a href="/studio" className="hover:text-white/60 transition-colors">
              CMS
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
