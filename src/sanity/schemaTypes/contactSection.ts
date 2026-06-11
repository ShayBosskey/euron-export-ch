import { defineField, defineType } from "sanity";

export const contactSectionSchema = defineType({
  name: "contactSection",
  title: "Contact Section",
  type: "document",
  fields: [
    defineField({
      name: "headline",
      title: "Section Headline",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "subheadline",
      title: "Sub-headline",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "formspreeEndpoint",
      title: "Formspree Endpoint",
      type: "string",
      description:
        "Optional: your Formspree form ID (e.g. xpwzqkjy) for form submissions without a backend.",
    }),
  ],
  preview: {
    select: { title: "headline" },
    prepare: (s) => ({ title: s.title as string, subtitle: "Contact Section" }),
  },
});
