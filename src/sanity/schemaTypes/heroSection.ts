import { defineField, defineType } from "sanity";

export const heroSectionSchema = defineType({
  name: "heroSection",
  title: "Hero Section",
  type: "document",
  fields: [
    defineField({
      name: "headline",
      title: "Main Headline",
      type: "string",
      validation: (r) => r.required(),
      description: 'The large text displayed in the hero (e.g. "Your Gateway to Global Markets").',
    }),
    defineField({
      name: "subheadline",
      title: "Sub-headline",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "ctaPrimaryLabel",
      title: "Primary Button Text",
      type: "string",
      initialValue: "Get in Touch",
    }),
    defineField({
      name: "ctaPrimaryHref",
      title: "Primary Button Link",
      type: "string",
      initialValue: "#contact",
    }),
    defineField({
      name: "ctaSecondaryLabel",
      title: "Secondary Button Text",
      type: "string",
      initialValue: "Our Services",
    }),
    defineField({
      name: "ctaSecondaryHref",
      title: "Secondary Button Link",
      type: "string",
      initialValue: "#services",
    }),
    defineField({
      name: "backgroundImage",
      title: "Background Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alt Text", type: "string" }),
      ],
    }),
  ],
  preview: {
    select: { title: "headline" },
    prepare: (s) => ({ title: s.title as string, subtitle: "Hero Section" }),
  },
});
