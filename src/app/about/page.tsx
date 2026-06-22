import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Über uns — Euron Export",
  description:
    "Erfahren Sie mehr über Euron Export — Ihr zuverlässiger Partner für Reifen-Recycling, Sortierung und EU-konformen Export aus Oberdiessbach BE.",
};

export default function AboutPage() {
  return (
    <>
      <Navbar siteName="Euron Export" />
      <main className="min-h-screen flex items-center justify-center bg-[var(--eu-canvas)]">
        <div className="text-center px-6 max-w-lg">
          <p className="text-[11px] tracking-[2px] uppercase font-bold text-[var(--eu-recycle-green)] mb-4">
            Über uns
          </p>
          <h1 className="text-4xl font-bold text-[var(--eu-ink)] mb-4">
            Unser Unternehmen
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
