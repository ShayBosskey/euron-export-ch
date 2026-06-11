import type { PortableTextBlock } from "@portabletext/types";
import type { Image } from "sanity";

export interface SanityImage extends Image {
  alt?: string;
}

export interface SiteSettings {
  _type: "siteSettings";
  _id: string;
  siteName: string;
  tagline: string;
  logo?: SanityImage;
  email: string;
  phone: string;
  address: string;
  linkedIn?: string;
  seoDescription: string;
}

export interface HeroSection {
  _type: "heroSection";
  _id: string;
  headline: string;
  subheadline: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel?: string;
  ctaSecondaryHref?: string;
  backgroundImage?: SanityImage;
  backgroundVideo?: string;
}

export interface Service {
  _key: string;
  title: string;
  description: string;
  icon: string;
}

export interface ServicesSection {
  _type: "servicesSection";
  _id: string;
  headline: string;
  subheadline?: string;
  services: Service[];
}

export interface Market {
  _key: string;
  region: string;
  countries: string;
  description: string;
  flagEmoji?: string;
}

export interface MarketsSection {
  _type: "marketsSection";
  _id: string;
  headline: string;
  subheadline?: string;
  markets: Market[];
}

export interface Usp {
  _key: string;
  title: string;
  stat?: string;
  description: string;
}

export interface WhyUsSection {
  _type: "whyUsSection";
  _id: string;
  headline: string;
  subheadline?: string;
  usps: Usp[];
}

export interface AboutSection {
  _type: "aboutSection";
  _id: string;
  headline: string;
  body: PortableTextBlock[];
  image?: SanityImage;
  foundedYear?: number;
  teamSize?: string;
}

export interface ContactSection {
  _type: "contactSection";
  _id: string;
  headline: string;
  subheadline?: string;
  formspreeEndpoint?: string;
}

export interface HomePage {
  hero: HeroSection;
  about: AboutSection;
  services: ServicesSection;
  markets: MarketsSection;
  whyUs: WhyUsSection;
  contact: ContactSection;
  settings: SiteSettings;
}
