import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { apiVersion, dataset, projectId } from "./src/sanity/env";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  apiVersion,
  schema: {
    types: schemaTypes,
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Euron Export Content")
          .items([
            S.listItem()
              .title("Site Settings")
              .child(S.document().schemaType("siteSettings").documentId("siteSettings")),
            S.divider(),
            S.listItem()
              .title("Hero Section")
              .child(S.document().schemaType("heroSection").documentId("heroSection")),
            S.listItem()
              .title("About Section")
              .child(S.document().schemaType("aboutSection").documentId("aboutSection")),
            S.listItem()
              .title("Services Section")
              .child(S.document().schemaType("servicesSection").documentId("servicesSection")),
            S.listItem()
              .title("Markets Section")
              .child(S.document().schemaType("marketsSection").documentId("marketsSection")),
            S.listItem()
              .title("Why Us Section")
              .child(S.document().schemaType("whyUsSection").documentId("whyUsSection")),
            S.listItem()
              .title("Contact Section")
              .child(S.document().schemaType("contactSection").documentId("contactSection")),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
});
