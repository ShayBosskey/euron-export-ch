import { defineField, defineType } from "sanity";

export const marketsSectionSchema = defineType({
  name: "marketsSection",
  title: "Markets Section",
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
      name: "markets",
      title: "Markets / Regions",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "region",
              title: "Region Name",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "countries",
              title: "Countries (comma-separated)",
              type: "string",
            }),
            defineField({
              name: "description",
              title: "Short Description",
              type: "text",
              rows: 2,
            }),
            defineField({
              name: "flagEmoji",
              title: "Flag Emoji",
              type: "string",
              description: 'Optional emoji flag e.g. "🇨🇭" or regional icon.',
            }),
          ],
          preview: {
            select: { title: "region", subtitle: "countries" },
          },
        },
      ],
      validation: (r) => r.required().min(1),
    }),
  ],
  preview: {
    select: { title: "headline" },
    prepare: ({ title }: { title: string }) => ({ title, subtitle: "Markets Section" }),
  },
});
