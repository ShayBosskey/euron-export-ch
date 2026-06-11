import { defineField, defineType } from "sanity";

export const siteSettingsSchema = defineType({
  name: "siteSettings",
  title: "Site Settings",
  type: "document",
  fields: [
    defineField({
      name: "siteName",
      title: "Site Name",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "tagline",
      title: "Tagline",
      type: "string",
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alt Text", type: "string" }),
      ],
    }),
    defineField({
      name: "email",
      title: "Contact Email",
      type: "string",
      validation: (r) => r.required().email(),
    }),
    defineField({
      name: "phone",
      title: "Phone Number",
      type: "string",
    }),
    defineField({
      name: "address",
      title: "Office Address",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "linkedIn",
      title: "LinkedIn URL",
      type: "url",
    }),
    defineField({
      name: "seoDescription",
      title: "SEO Meta Description",
      type: "text",
      rows: 2,
      description:
        "Keep under 160 characters for optimal search engine results.",
      validation: (r) => r.max(160),
    }),
  ],
  preview: {
    select: { title: "siteName", subtitle: "tagline" },
  },
});
