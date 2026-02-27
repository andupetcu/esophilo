import type { Metadata } from "next";
import { Cormorant_Garamond, Crimson_Text, Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const crimson = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "EsoPhilo — Ancient Wisdom, Modern Understanding",
    template: "%s | EsoPhilo",
  },
  description:
    "A digital library of 1,178 public domain philosophy and esoteric texts with AI-powered understanding. Explore Hermetic, Gnostic, Buddhist, Stoic, and more.",
  keywords: [
    "philosophy",
    "esoteric",
    "hermetic",
    "gnostic",
    "buddhist",
    "stoic",
    "ancient wisdom",
    "spiritual texts",
  ],
  openGraph: {
    title: "EsoPhilo — Ancient Wisdom, Modern Understanding",
    description:
      "A digital library of 1,178 public domain philosophy and esoteric texts with AI-powered understanding.",
    siteName: "EsoPhilo",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "EsoPhilo",
              url: "https://esophilo.com",
              description:
                "A digital library of 1,178 public domain philosophy and esoteric texts with AI-powered understanding.",
              potentialAction: {
                "@type": "SearchAction",
                target: "https://esophilo.com/search?q={search_term_string}",
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${cormorant.variable} ${crimson.variable} ${inter.variable} font-sans antialiased`}
      >
        <Navigation />
        <main>{children}</main>
      </body>
    </html>
  );
}
