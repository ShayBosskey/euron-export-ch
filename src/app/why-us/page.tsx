import type { Metadata } from "next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Warum Euron Export — Euron Export",
  description:
    "Über 15 Jahre Erfahrung im Reifenrecycling. Amtlich lizenziert, EU-konform und kantonal anerkannt. Verlässlicher Partner für Garagen und Betriebe in der Schweiz.",
};

export default function WhyUsPage() {
  return (
    <>
      <Navbar siteName="Euron Export" />
      <main className="min-h-screen flex items-center justify-center bg-[var(--eu-canvas)]">
        <div className="text-center px-6 max-w-lg">
          <p className="text-[11px] tracking-[2px] uppercase font-bold text-[var(--eu-recycle-green)] mb-4">
            Warum wir
          </p>
          <h1 className="text-4xl font-bold text-[var(--eu-ink)] mb-4">
            Unsere Stärken
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
