import { groq } from "next-sanity";

export const siteSettingsQuery = groq`
  *[_type == "siteSettings"][0]{
    siteName,
    tagline,
    logo,
    email,
    phone,
    address,
    linkedIn,
    seoDescription,
  }
`;

export const heroSectionQuery = groq`
  *[_type == "heroSection"][0]{
    headline,
    subheadline,
    ctaPrimaryLabel,
    ctaPrimaryHref,
    ctaSecondaryLabel,
    ctaSecondaryHref,
    backgroundImage,
  }
`;

export const aboutSectionQuery = groq`
  *[_type == "aboutSection"][0]{
    headline,
    body,
    image,
    foundedYear,
    teamSize,
  }
`;

export const servicesSectionQuery = groq`
  *[_type == "servicesSection"][0]{
    headline,
    subheadline,
    services[]{
      _key,
      title,
      description,
      icon,
    }
  }
`;

export const marketsSectionQuery = groq`
  *[_type == "marketsSection"][0]{
    headline,
    subheadline,
    markets[]{
      _key,
      region,
      countries,
      description,
      flagEmoji,
    }
  }
`;

export const whyUsSectionQuery = groq`
  *[_type == "whyUsSection"][0]{
    headline,
    subheadline,
    usps[]{
      _key,
      title,
      stat,
      description,
    }
  }
`;

export const contactSectionQuery = groq`
  *[_type == "contactSection"][0]{
    headline,
    subheadline,
    formspreeEndpoint,
  }
`;

export const homePageQuery = groq`
  {
    "hero":     ${heroSectionQuery},
    "about":    ${aboutSectionQuery},
    "services": ${servicesSectionQuery},
    "markets":  ${marketsSectionQuery},
    "whyUs":    ${whyUsSectionQuery},
    "contact":  ${contactSectionQuery},
    "settings": ${siteSettingsQuery},
  }
`;
