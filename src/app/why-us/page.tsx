import type { Metadata } from "next";
import { groq } from "next-sanity";
import { client } from "@/sanity/client";
import { whyUsSectionQuery, siteSettingsQuery } from "@/sanity/queries";
import type { WhyUsSection, SiteSettings } from "@/types/sanity";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhyUsSection as WhyUsSectionComponent } from "@/components/sections/WhyUsSection";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Warum Euron Export — Euron Export",
  description:
    "Über 15 Jahre Erfahrung im Reifenrecycling. Amtlich lizenziert, EU-konform und kantonal anerkannt. Verlässlicher Partner für Garagen und Betriebe in der Schweiz.",
};

interface WhyUsPageData {
  whyUs: WhyUsSection | null;
  settings: SiteSettings | null;
}

const whyUsPageQuery = groq`
  {
    "whyUs":    ${whyUsSectionQuery},
    "settings": ${siteSettingsQuery},
  }
`;

export default async function WhyUsPage() {
  const data = await client.fetch<WhyUsPageData>(whyUsPageQuery).catch(() => null);

  return (
    <>
      <Navbar siteName={data?.settings?.siteName ?? "Euron Export"} />
      <main className="min-h-screen bg-[var(--eu-canvas)]">
        <WhyUsSectionComponent data={data?.whyUs ?? null} />
      </main>
      <Footer settings={data?.settings ?? null} />
    </>
  );
}
