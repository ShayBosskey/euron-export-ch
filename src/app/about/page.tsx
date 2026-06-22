import type { Metadata } from "next";
import { groq } from "next-sanity";
import { client } from "@/sanity/client";
import { aboutSectionQuery, siteSettingsQuery } from "@/sanity/queries";
import type { AboutSection, SiteSettings } from "@/types/sanity";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AboutSection as AboutSectionComponent } from "@/components/sections/AboutSection";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Über uns — Euron Export",
  description:
    "Erfahren Sie mehr über Euron Export — Ihr zuverlässiger Partner für Reifen-Recycling, Sortierung und EU-konformen Export aus Oberdiessbach BE.",
};

interface AboutPageData {
  about: AboutSection | null;
  settings: SiteSettings | null;
}

const aboutPageQuery = groq`
  {
    "about":    ${aboutSectionQuery},
    "settings": ${siteSettingsQuery},
  }
`;

export default async function AboutPage() {
  const data = await client.fetch<AboutPageData>(aboutPageQuery).catch(() => null);

  return (
    <>
      <Navbar siteName={data?.settings?.siteName ?? "Euron Export"} />
      <main className="min-h-screen bg-[var(--eu-canvas)]">
        <AboutSectionComponent data={data?.about ?? null} />
      </main>
      <Footer settings={data?.settings ?? null} />
    </>
  );
}
