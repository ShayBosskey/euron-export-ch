import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Euron Export | Swiss B2B Export Partners",
  description:
    "Euron Export AG connects Swiss and European manufacturers with global markets. Reliable, experienced, and built on trust.",
  openGraph: {
    title: "Euron Export | Swiss B2B Export Partners",
    description:
      "Connecting Swiss and European manufacturers with global markets.",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
