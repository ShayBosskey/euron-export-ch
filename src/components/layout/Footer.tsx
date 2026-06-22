import type { SiteSettings } from "@/types/sanity";

const BIZ = {
  phone:    "+41 76 259 44 64",
  phoneHref:"tel:+41762594464",
  email:    "info@euron-export.com",
  street:   "Ziegelei 1",
  zip:      "3672",
  city:     "Oberdiessbach",
  hours:    "Mo–Fr 07:00–17:30 · Sa 08:00–12:00",
  legalName:"Euron Export",
};

const LEISTUNGEN = [
  { label: "Garagen-Abholung", href: "/services" },
  { label: "Reifen kaufen (Privat)", href: "/markets" },
  { label: "Bulk-Verkauf (Van/LKW)", href: "/markets" },
  { label: "Granulat & Verwertung", href: "/about" },
];

const UNTERNEHMEN = [
  { label: "Über uns", href: "/about" },
  { label: "Standort & Anlage", href: "/contact" },
  { label: "Kontakt", href: "/contact" },
];

const RECHTLICHES = [
  { label: "Impressum", href: "/impressum" },
  { label: "AGB", href: "/agb" },
  { label: "Datenschutz", href: "/datenschutz" },
  { label: "EU-Konformität", href: "/eu-konformitaet" },
];

interface FooterProps {
  settings: SiteSettings | null;
}

export function Footer({ settings }: FooterProps) {
  const year = new Date().getFullYear();
  const siteName = settings?.siteName ?? BIZ.legalName;
  const email    = settings?.email   ?? BIZ.email;
  const phone    = settings?.phone   ?? BIZ.phone;
  const address  = settings?.address ?? `${BIZ.street}\n${BIZ.zip} ${BIZ.city}`;

  return (
    <footer className="bg-[var(--eu-surface-soft)] border-t border-[var(--eu-hairline)] pt-20 pb-8 text-[var(--eu-body)]">
      <div className="max-w-[var(--eu-container-max)] mx-auto px-[var(--eu-container-gutter)]">

        {/* Header: brand + contact block */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_2fr] gap-16 pb-14 border-b border-[var(--eu-hairline)]">
          <div className="flex flex-col gap-5">
            {/* Logo type */}
            <div>
              <p className="font-bold text-[20px] tracking-[1px] uppercase text-[var(--eu-ink)]">
                {siteName}
              </p>
              <p className="mt-1 text-[11px] tracking-[1.5px] uppercase text-[var(--eu-muted)] font-normal">
                Reifen · Recycling · Export
              </p>
            </div>
            <p className="text-[14px] leading-relaxed text-[var(--eu-muted)] max-w-[320px]">
              {settings?.tagline ??
                "Reifenrecycling, Sortierhof und Container-Export aus Oberdiessbach BE."}
            </p>
            <p className="text-[12px] tracking-[0.5px] text-[var(--eu-muted-soft)] uppercase">
              {BIZ.hours}
            </p>
          </div>

          {/* Contact cells */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-7">
            {/* Address */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] tracking-[1.5px] uppercase text-[var(--eu-muted)] font-bold">
                Standort
              </span>
              <p className="text-[16px] font-bold text-[var(--eu-ink)] leading-snug whitespace-pre-line">
                {address}
              </p>
              <a
                href="https://www.google.com/maps/search/?api=1&query=Ziegelei+1%2C+3672+Oberdiessbach"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] tracking-[1.5px] uppercase font-bold text-[var(--eu-ink)] no-underline hover:text-[var(--eu-recycle-green)] transition-colors"
              >
                Route planen ›
              </a>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] tracking-[1.5px] uppercase text-[var(--eu-muted)] font-bold">
                Telefon
              </span>
              <a
                href={BIZ.phoneHref}
                className="text-[16px] font-bold text-[var(--eu-ink)] no-underline font-[family-name:var(--eu-font-mono)] hover:text-[var(--eu-recycle-green)] transition-colors"
              >
                {phone}
              </a>
              <a
                href={`https://wa.me/41762594464`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] tracking-[1.5px] uppercase font-bold text-[var(--eu-recycle-green)] no-underline hover:text-[var(--eu-recycle-green-active)] transition-colors"
              >
                WhatsApp öffnen ›
              </a>
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] tracking-[1.5px] uppercase text-[var(--eu-muted)] font-bold">
                E-Mail
              </span>
              <a
                href={`mailto:${email}`}
                className="text-[16px] font-bold text-[var(--eu-ink)] no-underline hover:text-[var(--eu-recycle-green)] transition-colors break-all"
              >
                {email}
              </a>
            </div>
          </div>
        </div>

        {/* Sitemap — 3 cols */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-14 py-14 border-b border-[var(--eu-hairline)]">
          <FooterCol title="Leistungen" links={LEISTUNGEN} />
          <FooterCol title="Unternehmen" links={UNTERNEHMEN} />
          <FooterCol title="Rechtliches" links={RECHTLICHES} />
        </div>

        {/* Trust strip */}
        <div className="py-8 border-b border-[var(--eu-hairline)]">
          <p className="text-[11px] tracking-[1.5px] uppercase font-bold text-[var(--eu-muted)] mb-4">
            Amtlich anerkannt & lizenziert
          </p>
          <div className="flex flex-wrap gap-3">
            {([
              { code: "BE", label: "Kanton Bern",   cls: "bg-[var(--eu-stripe-graphite)] text-white" },
              { code: "TH", label: "Stadt Thun",    cls: "bg-[var(--eu-recycle-green)] text-white" },
              { code: "OD", label: "Oberdiessbach", cls: "bg-[var(--eu-stripe-amber)] text-[var(--eu-ink)]" },
            ] as const).map((b) => (
              <div
                key={b.code}
                className={`flex items-baseline gap-3 px-5 py-3 min-w-[140px] ${b.cls}`}
              >
                <span className="font-bold text-[24px] leading-none tracking-[0.5px]">
                  {b.code}
                </span>
                <span className="text-[11px] tracking-[1px] uppercase opacity-90">
                  {b.label}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[11px] tracking-[0.5px] text-[var(--eu-muted)]">
            Lizenz-Nr. BE-3672-21 · ausgestellt 14.03.2009 · zuletzt erneuert 02.2026
          </p>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-7 text-[12px] text-[var(--eu-muted)]">
          <span>
            © {year} {siteName} · CHE-432.118.077 · Alle Rechte vorbehalten
          </span>
          <div className="flex items-center gap-3">
            <span className="text-[11px] tracking-[1.5px] uppercase">VSU · UVEK · KVU</span>
            <span className="opacity-30">·</span>
            <a href="/studio" className="hover:text-[var(--eu-ink)] transition-colors no-underline">
              CMS
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-[12px] tracking-[2px] uppercase font-bold text-[var(--eu-ink)]">
        {title}
      </span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          className="text-[15px] text-[#9a8a3a] no-underline hover:text-[var(--eu-recycle-green)] transition-colors duration-150"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
