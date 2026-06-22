import type { Metadata } from "next";
import { Saira, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const saira = Saira({
  variable: "--font-saira",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "700", "800"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Euron Export — Reifen Recycling · Oberdiessbach BE",
  description:
    "Reifen kaufen oder entsorgen lassen. Euron Export holt Altreifen bei Schweizer Garagen ab und verkauft sortierte Occasionsreifen ab Lager in Oberdiessbach BE. Amtlich lizenziert · EU-konform.",
  openGraph: {
    title: "Euron Export — Reifen Recycling Schweiz",
    description:
      "Reifen kaufen oder entsorgen lassen. Amtlich lizenziert, EU-konform, kantonal anerkannt.",
    locale: "de_CH",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de" className={`${saira.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
