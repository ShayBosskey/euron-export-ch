import type { Metadata } from "next";
import { groq } from "next-sanity";
import { client } from "@/sanity/client";
import { contactSectionQuery, siteSettingsQuery } from "@/sanity/queries";
import type { ContactSection, SiteSettings } from "@/types/sanity";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ContactSection as ContactSectionComponent } from "@/components/sections/ContactSection";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Kontakt — Euron Export",
  description:
    "Abholung anfordern oder Reifen bestellen. Kontaktieren Sie Euron Export in Oberdiessbach BE: Telefon, WhatsApp, E-Mail oder direkt vor Ort.",
};

interface ContactPageData {
  contact: ContactSection | null;
  settings: SiteSettings | null;
}

const contactPageQuery = groq`
  {
    "contact":  ${contactSectionQuery},
    "settings": ${siteSettingsQuery},
  }
`;

export default async function ContactPage() {
  const data = await client.fetch<ContactPageData>(contactPageQuery).catch(() => null);

  return (
    <>
      <Navbar siteName={data?.settings?.siteName ?? "Euron Export"} />
      <main className="min-h-screen bg-[var(--eu-canvas)]">
        <ContactSectionComponent
          data={data?.contact ?? null}
          settings={data?.settings ?? null}
        />
      </main>
      <Footer settings={data?.settings ?? null} />
    </>
  );
}
