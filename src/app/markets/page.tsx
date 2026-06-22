import type { Metadata } from "next";
import { groq } from "next-sanity";
import { client } from "@/sanity/client";
import { marketsSectionQuery, siteSettingsQuery } from "@/sanity/queries";
import type { MarketsSection, SiteSettings } from "@/types/sanity";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MarketsSection as MarketsSectionComponent } from "@/components/sections/MarketsSection";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Märkte & Reifen kaufen — Euron Export",
  description:
    "Sortierte Occasionsreifen ab Lager in Oberdiessbach BE. Einzel- und Bulk-Verkauf für Privatkunden, Händler und Exporteure in der EU.",
};

interface MarketsPageData {
  markets: MarketsSection | null;
  settings: SiteSettings | null;
}

const marketsPageQuery = groq`
  {
    "markets":  ${marketsSectionQuery},
    "settings": ${siteSettingsQuery},
  }
`;

export default async function MarketsPage() {
  const data = await client.fetch<MarketsPageData>(marketsPageQuery).catch(() => null);

  return (
    <>
      <Navbar siteName={data?.settings?.siteName ?? "Euron Export"} />
      <main className="min-h-screen bg-[var(--eu-canvas)]">
        <MarketsSectionComponent data={data?.markets ?? null} />
      </main>
      <Footer settings={data?.settings ?? null} />
    </>
  );
}
