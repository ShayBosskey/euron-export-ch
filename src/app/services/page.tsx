import type { Metadata } from "next";
import { groq } from "next-sanity";
import { client } from "@/sanity/client";
import { servicesSectionQuery, siteSettingsQuery } from "@/sanity/queries";
import type { ServicesSection, SiteSettings } from "@/types/sanity";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ServicesSection as ServicesSectionComponent } from "@/components/sections/ServicesSection";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Dienstleistungen — Euron Export",
  description:
    "Unsere Leistungen: Altreifen-Abholung bei Garagen, Reifen-Sortierung und EU-konformer Recycling-Export. Lizenziert, amtlich anerkannt, kantonal genehmigt.",
};

interface ServicesPageData {
  services: ServicesSection | null;
  settings: SiteSettings | null;
}

const servicesPageQuery = groq`
  {
    "services": ${servicesSectionQuery},
    "settings": ${siteSettingsQuery},
  }
`;

export default async function ServicesPage() {
  const data = await client.fetch<ServicesPageData>(servicesPageQuery).catch(() => null);

  return (
    <>
      <Navbar siteName={data?.settings?.siteName ?? "Euron Export"} />
      <main className="min-h-screen bg-[var(--eu-canvas)]">
        <ServicesSectionComponent data={data?.services ?? null} />
      </main>
      <Footer settings={data?.settings ?? null} />
    </>
  );
}
