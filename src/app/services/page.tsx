import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Dienstleistungen — Euron Export",
  description:
    "Unsere Leistungen: Altreifen-Abholung bei Garagen, Reifen-Sortierung und EU-konformer Recycling-Export. Lizenziert, amtlich anerkannt, kantonal genehmigt.",
};

export default function ServicesPage() {
  return (
    <>
      <Navbar siteName="Euron Export" />
      <main className="min-h-screen flex items-center justify-center bg-[var(--eu-canvas)]">
        <div className="text-center px-6 max-w-lg">
          <p className="text-[11px] tracking-[2px] uppercase font-bold text-[var(--eu-recycle-green)] mb-4">
            Dienstleistungen
          </p>
          <h1 className="text-4xl font-bold text-[var(--eu-ink)] mb-4">
            Garagen-Service & Abholung
          </h1>
          <p className="text-[var(--eu-muted)] leading-relaxed">
            Dieser Bereich wird über das Sanity CMS verwaltet und im nächsten Sprint
            mit Inhalten befüllt.
          </p>
        </div>
      </main>
      <Footer settings={null} />
    </>
  );
}
