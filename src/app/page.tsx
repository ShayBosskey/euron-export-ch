import { client } from "@/sanity/client";
import { homePageQuery } from "@/sanity/queries";
import type { HomePage } from "@/types/sanity";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { MarketsSection } from "@/components/sections/MarketsSection";
import { WhyUsSection } from "@/components/sections/WhyUsSection";
import { ContactSection } from "@/components/sections/ContactSection";

export const revalidate = 60;

export default async function Home() {
  // Fetch returns null if the Sanity project isn't configured yet.
  // Each section also resolves to null when its document hasn't been created.
  // Every component handles null gracefully — the page never crashes.
  const data = await client.fetch<HomePage>(homePageQuery).catch(() => null);

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[var(--color-navy)] text-white">
        <div className="text-center max-w-lg px-6">
          <h1 className="font-display text-3xl font-bold mb-4">CMS Not Connected</h1>
          <p className="text-white/70 mb-8">
            Copy{" "}
            <code className="text-[var(--color-gold)]">.env.local.example</code> to{" "}
            <code className="text-[var(--color-gold)]">.env.local</code>, add your Sanity
            credentials, then restart with{" "}
            <code className="text-[var(--color-gold)]">npm run dev</code>.
          </p>
          <a
            href="/studio"
            className="inline-flex items-center px-6 py-3 bg-[var(--color-gold)] text-[var(--color-navy)] font-semibold rounded-sm hover:bg-[var(--color-gold-light)] transition-colors"
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
        {/* Each section receives its document (or null) and handles the null state internally */}
        <HeroSection data={data.hero} />
        <AboutSection data={data.about} />
        <ServicesSection data={data.services} />
        <MarketsSection data={data.markets} />
        <WhyUsSection data={data.whyUs} />
        <ContactSection data={data.contact} settings={data.settings} />
      </main>
      <Footer settings={data.settings} />
    </>
  );
}
