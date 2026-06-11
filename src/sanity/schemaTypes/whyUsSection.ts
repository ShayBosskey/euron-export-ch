import { defineField, defineType } from "sanity";

export const whyUsSectionSchema = defineType({
  name: "whyUsSection",
  title: "Why Us Section",
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
      name: "usps",
      title: "Trust Signals / USPs",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "USP Title",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "stat",
              title: "Stat / Number",
              type: "string",
              description: 'Optional large number e.g. "20+" or "98%".',
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "text",
              rows: 2,
              validation: (r) => r.required(),
            }),
          ],
          preview: {
            select: { title: "stat", subtitle: "title" },
          },
        },
      ],
      validation: (r) => r.required().min(2),
    }),
  ],
  preview: {
    select: { title: "headline" },
    prepare: (s) => ({ title: s.title as string, subtitle: "Why Us Section" }),
  },
});
