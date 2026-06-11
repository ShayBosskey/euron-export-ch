import { defineField, defineType } from "sanity";

export const aboutSectionSchema = defineType({
  name: "aboutSection",
  title: "About Section",
  type: "document",
  fields: [
    defineField({
      name: "headline",
      title: "Section Headline",
      type: "string",
      validation: (r) => r.required(),
    }),
    defineField({
      name: "body",
      title: "Body Text",
      type: "array",
      of: [{ type: "block" }],
      description: "Rich text editor — supports bold, italic, and links.",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alt Text", type: "string" }),
      ],
    }),
    defineField({
      name: "foundedYear",
      title: "Founded Year",
      type: "number",
    }),
    defineField({
      name: "teamSize",
      title: "Team Size Description",
      type: "string",
      description: 'e.g. "25+ professionals"',
    }),
  ],
  preview: {
    select: { title: "headline" },
    prepare: (s) => ({ title: s.title as string, subtitle: "About Section" }),
  },
});
