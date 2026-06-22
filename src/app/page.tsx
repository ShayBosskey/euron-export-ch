import type { Metadata } from "next";
import { client } from "@/sanity/client";
import { heroSectionQuery, siteSettingsQuery } from "@/sanity/queries";
import type { HeroSection, SiteSettings } from "@/types/sanity";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection as HeroSectionComponent } from "@/components/sections/HeroSection";
import { groq } from "next-sanity";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await client
    .fetch<SiteSettings | null>(siteSettingsQuery)
    .catch(() => null);
  return {
    title: settings?.siteName ?? "Euron Export",
    description:
      settings?.seoDescription ??
      "Reifenrecycling, Sortierhof und Container-Export aus Oberdiessbach BE. Amtlich lizenziert, EU-konform.",
  };
}

interface HomeData {
  hero: HeroSection | null;
  settings: SiteSettings | null;
}

const homeQuery = groq`
  {
    "hero":     ${heroSectionQuery},
    "settings": ${siteSettingsQuery},
  }
`;

export default async function Home() {
  const data = await client.fetch<HomeData>(homeQuery).catch(() => null);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--eu-canvas)]">
        <div className="text-center max-w-lg px-6">
          <h1 className="text-3xl font-bold mb-4 text-[var(--eu-ink)]">CMS Not Connected</h1>
          <p className="text-[var(--eu-muted)] mb-8">
            Copy{" "}
            <code className="text-[var(--eu-recycle-green)]">.env.local.example</code> to{" "}
            <code className="text-[var(--eu-recycle-green)]">.env.local</code>, add your Sanity
            credentials, then restart with{" "}
            <code className="text-[var(--eu-recycle-green)]">npm run dev</code>.
          </p>
          <a
            href="/studio"
            className="inline-flex items-center px-6 py-3 bg-[var(--eu-recycle-green)] text-white font-semibold hover:bg-[var(--eu-recycle-green-active)] transition-colors"
          >
            Open Studio →
          </a>
        </div>
      </main>
    );
  }

  return (
    <>
      <Navbar siteName={data.settings?.siteName ?? "Euron Export"} />
      <main>
        <HeroSectionComponent data={data.hero} />
      </main>
      <Footer settings={data.settings} />
    </>
  );
}
