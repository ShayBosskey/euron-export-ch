import { defineField, defineType } from "sanity";

export const servicesSectionSchema = defineType({
  name: "servicesSection",
  title: "Services Section",
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
      name: "services",
      title: "Services",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "title",
              title: "Service Title",
              type: "string",
              validation: (r) => r.required(),
            }),
            defineField({
              name: "description",
              title: "Description",
              type: "text",
              rows: 3,
              validation: (r) => r.required(),
            }),
            defineField({
              name: "icon",
              title: "Icon Name",
              type: "string",
              description: 'One of: "globe", "truck", "document", "chart", "shield", "handshake"',
              options: {
                list: [
                  { title: "Globe", value: "globe" },
                  { title: "Truck / Logistics", value: "truck" },
                  { title: "Document", value: "document" },
                  { title: "Chart / Analytics", value: "chart" },
                  { title: "Shield / Compliance", value: "shield" },
                  { title: "Handshake / Partnerships", value: "handshake" },
                ],
              },
            }),
          ],
          preview: {
            select: { title: "title", subtitle: "description" },
          },
        },
      ],
      validation: (r) => r.required().min(1),
    }),
  ],
  preview: {
    select: { title: "headline" },
    prepare: (s) => ({ title: s.title as string, subtitle: "Services Section" }),
  },
});
